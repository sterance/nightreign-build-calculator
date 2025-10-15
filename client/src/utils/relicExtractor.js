// browser-only relic extractor for .sl2 files

const DS2_KEY = new Uint8Array([
  0x18, 0xF6, 0x32, 0x66, 0x05, 0xBD, 0x17, 0x8A,
  0x55, 0x24, 0x52, 0x3A, 0xC0, 0xA0, 0xC6, 0x09,
]);

const IV_SIZE = 0x10;

const SECTIONS = {
  1: { start: 0x00000004, end: 0x00100003 },
  2: { start: 0x00100024, end: 0x00200023 },
  3: { start: 0x00200044, end: 0x00300043 },
  4: { start: 0x00300064, end: 0x00400063 },
  5: { start: 0x00400084, end: 0x00500083 },
  6: { start: 0x005000A4, end: 0x006000A3 },
  7: { start: 0x006000C4, end: 0x007000C3 },
  8: { start: 0x007000E4, end: 0x008000E3 },
  9: { start: 0x00800104, end: 0x00900103 },
  10: { start: 0x00900124, end: 0x00A00123 }
};

function getDataView(buffer) {
  return buffer instanceof DataView ? buffer : new DataView(buffer);
}

function sliceBuffer(buffer, start, end) {
  const u8 = new Uint8Array(buffer);
  return u8.slice(start, end).buffer;
}

function concatBuffers(buffers) {
  const total = buffers.reduce((acc, b) => acc + b.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const b of buffers) {
    out.set(new Uint8Array(b), offset);
    offset += b.byteLength;
  }
  return out.buffer;
}

async function importAesKey(rawKeyBytes) {
  return await globalThis.crypto.subtle.importKey(
    'raw',
    rawKeyBytes,
    { name: 'AES-CBC' },
    false,
    ['decrypt']
  );
}

async function aesCbcDecrypt(key, iv, ciphertext) {
  const result = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-CBC', iv },
    key,
    ciphertext
  );
  return result;
}

function expectBND4Header(view) {
  if (
    view.getUint8(0) !== 0x42 || // 'B'
    view.getUint8(1) !== 0x4E || // 'N'
    view.getUint8(2) !== 0x44 || // 'D'
    view.getUint8(3) !== 0x34    // '4'
  ) {
    throw new Error("'BND4' header not found");
  }
}

function readInt32LE(view, offset) {
  return view.getInt32(offset, true);
}

function readEntryHeader(view, base) {
  // first 8 bytes must match 40 00 00 00 ff ff ff ff
  const m0 = view.getUint32(base + 0, true);
  const m1 = view.getUint32(base + 4, true);
  if (!(m0 === 0x00000040 && m1 === 0xffffffff)) {
    return null;
  }
  const entrySize = readInt32LE(view, base + 8);
  const entryDataOffset = readInt32LE(view, base + 16);
  const entryNameOffset = readInt32LE(view, base + 20);
  const entryFooterLength = readInt32LE(view, base + 24);
  return { entrySize, entryDataOffset, entryNameOffset, entryFooterLength };
}

function readAsciiZ(view, offset) {
  const bytes = [];
  for (let i = offset; i < view.byteLength; i++) {
    const b = view.getUint8(i);
    if (b === 0) break;
    bytes.push(b);
    if (bytes.length > 256) break;
  }
  return String.fromCharCode(...bytes);
}

async function parseAndDecryptUserdataBuffers(bnd4Buffer) {
  const view = getDataView(bnd4Buffer);
  expectBND4Header(view);
  const numEntries = readInt32LE(view, 12);
  const BND4_HEADER_LEN = 64;
  const BND4_ENTRY_HEADER_LEN = 32;

  const key = await importAesKey(DS2_KEY);
  const out = [];
  const userdata = [];

  for (let i = 0; i < numEntries; i++) {
    const pos = BND4_HEADER_LEN + BND4_ENTRY_HEADER_LEN * i;
    if (pos + BND4_ENTRY_HEADER_LEN > bnd4Buffer.byteLength) break;
    const header = readEntryHeader(view, pos);
    if (!header) continue;

    const { entrySize, entryDataOffset, entryNameOffset, entryFooterLength } = header;
    if (entrySize <= 0 || entryDataOffset <= 0) continue;
    if (entryDataOffset + entrySize > bnd4Buffer.byteLength) continue;

    const encSlice = sliceBuffer(bnd4Buffer, entryDataOffset, entryDataOffset + entrySize);
    const encView = new Uint8Array(encSlice);
    const iv = encView.slice(0, IV_SIZE);
    const payload = encView.slice(IV_SIZE).buffer;
    const plain = await aesCbcDecrypt(key, iv, payload);
    // append padding_size and footer_length zero bytes to mirror python output sizing
    let finalPlain = plain;
    // padding size from original script is 0xC (12)
    {
      const p = new Uint8Array(finalPlain);
      const outBuf = new Uint8Array(p.byteLength + 12);
      outBuf.set(p, 0);
      finalPlain = outBuf.buffer;
    }
    if (entryFooterLength && entryFooterLength > 0) {
      const p = new Uint8Array(finalPlain);
      const outBuf = new Uint8Array(p.byteLength + entryFooterLength);
      outBuf.set(p, 0);
      finalPlain = outBuf.buffer;
    }
    out.push(finalPlain);

    // identify USERDATA_* entries by name and track numeric index
    let nameIndex = null;
    if (entryNameOffset > 0 && entryNameOffset < view.byteLength) {
      const name = readAsciiZ(view, entryNameOffset);
      if (name && name.startsWith('USERDATA_')) {
        const suffix = name.slice('USERDATA_'.length);
        const num = parseInt(suffix, 10);
        if (Number.isInteger(num)) {
          nameIndex = num;
          userdata.push({ idx: num, plain: finalPlain });
        }
      }
    }
  }

  // prefer ordered USERDATA_* if found; else fall back to raw decrypt order
  if (userdata.length === 14) {
    userdata.sort((a, b) => a.idx - b.idx);
    return userdata.map((u) => u.plain);
  }
  return out;
}

function bytesIndexOf(haystack, needle) {
  const h = haystack;
  const n = needle;
  const hl = h.length;
  const nl = n.length;
  if (nl === 0) return 0;
  outer: for (let i = 0; i <= hl - nl; i++) {
    for (let j = 0; j < nl; j++) {
      if (h[i + j] !== n[j]) continue outer;
    }
    return i;
  }
  return -1;
}

function findHexOffset(sectionBytes, hexPattern) {
  const clean = hexPattern.replace(/\s+/g, '');
  const bytes = new Uint8Array(clean.match(/.{1,2}/g).map((x) => parseInt(x, 16)));
  const idx = bytesIndexOf(sectionBytes, bytes);
  return idx >= 0 ? idx : null;
}

function findCharacterName(sectionBytes, offset, byteSize = 32) {
  const end = Math.min(sectionBytes.length, offset + byteSize);
  const valueBytes = sectionBytes.subarray(offset, end);
  const chars = [];
  for (let i = 0; i < valueBytes.length; i += 2) {
    const b = valueBytes[i];
    if (b === 0) break;
    if (b >= 32 && b <= 126) chars.push(String.fromCharCode(b));
    else chars.push('.');
  }
  return chars.join('');
}

function readAt(buffer, offset, length) {
  const u8 = new Uint8Array(buffer);
  return u8.slice(offset, offset + length);
}

function locateNameBytes(memoryBuffer, offset, length) {
  const bytes = readAt(memoryBuffer, offset, length);
  let allZero = true;
  for (let i = 0; i < bytes.length; i++) if (bytes[i] !== 0) { allZero = false; break; }
  return allZero ? null : bytes;
}

function emptySlotFinderAow(memoryBuffer, patternOffsetStart, patternOffsetEnd) {
  const startPos = patternOffsetStart;
  const endPos = patternOffsetEnd;
  const section = new Uint8Array(readAt(memoryBuffer, startPos, Math.max(0, endPos - startPos)));

  function getSlotSize(b4) {
    if (b4 === 0xC0) return 72;
    if (b4 === 0x90) return 16;
    if (b4 === 0x80) return 80;
    return null;
  }

  const validB4 = new Set([0x80, 0x90, 0xC0]);

  function isValidSlotStart(pos) {
    if (pos + 4 > section.length) return [false, null];
    const b3 = section[pos + 2];
    const b4 = section[pos + 3];
    if ((b3 === 0x80 || b3 === 0x83 || b3 === 0x81 || b3 === 0x82 || b3 === 0x84 || b3 === 0x85) && validB4.has(b4)) {
      const size = getSlotSize(b4);
      if (size && pos + size <= section.length) return [true, size];
    }
    return [false, null];
  }

  let startOffset = null;
  for (let i = 0; i < section.length - 8; i++) {
    const [valid, firstSize] = isValidSlotStart(i);
    if (valid) {
      const nextPos = i + firstSize;
      const [validNext] = isValidSlotStart(nextPos);
      const isEmptyNext = nextPos + 8 <= section.length && section.slice(nextPos, nextPos + 8).every((v, k) => v === (k < 4 ? 0x00 : 0xFF));
      if (validNext || isEmptyNext) { startOffset = i; break; }
    }
  }

  if (startOffset == null) return [];

  const result = [];
  let i = startOffset;
  while (i < section.length - 4) {
    const b3 = section[i + 2];
    const b4 = section[i + 3];
    if ((b3 === 0x80 || b3 === 0x83 || b3 === 0x81 || b3 === 0x82 || b3 === 0x84 || b3 === 0x85) && validB4.has(b4)) {
      const size = getSlotSize(b4);
      if (size && i + size <= section.length) {
        if (b4 === 0xC0) {
          const slot = section.subarray(i, i + size);
          const slotIndex = slot[0] | (slot[1] << 8);
          const itemId = slot[4] | (slot[5] << 8) | (slot[6] << 16);

          const effect1Id = new DataView(slot.buffer, slot.byteOffset + 16, 4).getUint32(0, true);
          const effect2Id = new DataView(slot.buffer, slot.byteOffset + 20, 4).getUint32(0, true);
          const effect3Id = new DataView(slot.buffer, slot.byteOffset + 24, 4).getUint32(0, true);
          const secEffect1Id = new DataView(slot.buffer, slot.byteOffset + 56, 4).getUint32(0, true);
          const secEffect2Id = new DataView(slot.buffer, slot.byteOffset + 60, 4).getUint32(0, true);
          const secEffect3Id = new DataView(slot.buffer, slot.byteOffset + 64, 4).getUint32(0, true);

          result.push({
            offset: startPos + i,
            size,
            item_id: itemId,
            effect1_id: effect1Id,
            effect2_id: effect2Id,
            effect3_id: effect3Id,
            sec_effect1_id: secEffect1Id,
            sec_effect2_id: secEffect2Id,
            sec_effect3_id: secEffect3Id,
            sorting: slotIndex,
          });
        }
        i += size;
        continue;
      }
    }
    if (i + 8 <= section.length) {
      const empty = section[i + 0] === 0x00 && section[i + 1] === 0x00 && section[i + 2] === 0x00 && section[i + 3] === 0x00 && section[i + 4] === 0xFF && section[i + 5] === 0xFF && section[i + 6] === 0xFF && section[i + 7] === 0xFF;
      if (empty) { i += 8; continue; }
    }
    i += 1;
  }

  return result;
}

function extractRelicsFromSection(memoryBuffer, sectionNumber) {
  const sectionInfo = SECTIONS[sectionNumber];
  const sectionBytes = new Uint8Array(readAt(memoryBuffer, sectionInfo.start, sectionInfo.end - sectionInfo.start + 1));

  const baseOffset = 0xA01AA2;
  if (!(sectionNumber >= 1 && sectionNumber <= 10)) return null;
  const nameOffset = baseOffset + (sectionNumber - 1) * 0x290;

  let nameBytes = locateNameBytes(memoryBuffer, nameOffset, 10);
  if (nameBytes == null) nameBytes = locateNameBytes(memoryBuffer, nameOffset, 5);
  if (nameBytes == null) nameBytes = locateNameBytes(memoryBuffer, nameOffset, 3);
  if (nameBytes == null) return null;

  const fixedPatternOffset = findHexOffset(sectionBytes, Array.from(nameBytes).map((b) => b.toString(16).padStart(2, '0')).join(''));
  if (fixedPatternOffset == null) return null;

  const searchStartPosition = fixedPatternOffset + 1000;
  const searchEndPosition = sectionInfo.end - sectionInfo.start;
  if (searchStartPosition >= sectionBytes.length) return null;

  const characterName = findCharacterName(sectionBytes, fixedPatternOffset);
  const relics = emptySlotFinderAow(
    memoryBuffer,
    sectionInfo.start + 32,
    sectionInfo.start + fixedPatternOffset - 100
  );

  return {
    section_number: sectionNumber,
    character_name: characterName,
    relics,
  };
}

export async function extractAllRelicsFromSl2(bnd4ArrayBuffer) {
  const userdataBuffers = await parseAndDecryptUserdataBuffers(bnd4ArrayBuffer);
  if (userdataBuffers.length !== 14) throw new Error(`expected 14 USERDATA buffers, found ${userdataBuffers.length}`);
  const memoryBuffer = concatBuffers(userdataBuffers);

  const all = [];
  for (let section = 1; section <= 10; section++) {
    const data = extractRelicsFromSection(memoryBuffer, section);
    if (data && data.relics && data.relics.length > 0) all.push(data);
  }
  return all;
}