#!/usr/bin/env python3
"""
Elden Ring Nightreign Relic Extractor
Extracts relic information from .sl2 save files
"""

import os
import sys
import struct
import hashlib
import json
import shutil
from typing import Optional, Dict, List
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

# Constants from original script
DS2_KEY = b'\x18\xF6\x32\x66\x05\xBD\x17\x8A\x55\x24\x52\x3A\xC0\xA0\xC6\x09'
AOB_search = '00 00 00 00 ?? 00 00 00 ?? ?? 00 00 00 00 00 00 ??'
IV_SIZE = 0x10
PADDING_SIZE = 0xC
START_OF_CHECKSUM_DATA = 4
END_OF_CHECKSUM_DATA = PADDING_SIZE + 16

# Section definitions for memory.sl2 (decrypted format)
SECTIONS = {
    1: {'start': 0x00000004, 'end': 0x00100003},
    2: {'start': 0x00100024, 'end': 0x00200023},
    3: {'start': 0x00200044, 'end': 0x00300043},
    4: {'start': 0x00300064, 'end': 0x00400063},
    5: {'start': 0x00400084, 'end': 0x00500083},
    6: {'start': 0x005000A4, 'end': 0x006000A3},
    7: {'start': 0x006000C4, 'end': 0x007000C3},
    8: {'start': 0x007000E4, 'end': 0x008000E3},
    9: {'start': 0x00800104, 'end': 0x00900103},
    10: {'start': 0x00900124, 'end': 0x00A00123}
}

class BND4Entry:
    def __init__(self, raw_data: bytes, index: int, output_folder: str, size: int, offset: int, name_offset: int, footer_length: int, data_offset: int):
        self.index = index
        self._index = index
        self.size = size
        self.data_offset = data_offset
        self.footer_length = footer_length
        self._raw_data = raw_data
        self._encrypted_data = raw_data[offset:offset + size]
        self._decrypted_slot_path = output_folder
        self._name = f"USERDATA_{index:02d}"
        self._clean_data = b''
        
        # Extract IV from beginning of encrypted data
        self._iv = self._encrypted_data[:IV_SIZE]
        self._encrypted_payload = self._encrypted_data[IV_SIZE:]
        self.decrypted = False
    
    def decrypt(self) -> None:
        try:
            decryptor = Cipher(algorithms.AES(DS2_KEY), modes.CBC(self._iv)).decryptor()
            decrypted_raw = decryptor.update(self._encrypted_payload) + decryptor.finalize()
            
            self._clean_data = decrypted_raw 
            
            if self._decrypted_slot_path:
                os.makedirs(self._decrypted_slot_path, exist_ok=True)
                output_path = os.path.join(self._decrypted_slot_path, self._name)
                with open(output_path, 'wb') as f:
                    f.write(self._clean_data)
            self.decrypted = True
            
        except Exception as e:
            print(f"Error decrypting entry {self._index}: {str(e)}")
            raise

def clean_decrypted_output_folder():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_folder = os.path.join(script_dir, "decrypted_output")

    if os.path.exists(output_folder):
        shutil.rmtree(output_folder)

    os.makedirs(output_folder)
    return output_folder

def merge_userdata_files(input_file):
    clean_decrypted_output_folder()
    unpacked_folder = decrypt_ds2_sl2(input_file)

    if not os.path.isdir(unpacked_folder):
        print(f"❌ Folder not found: {unpacked_folder}")
        return None

    import glob
    userdata_files = sorted(glob.glob(os.path.join(unpacked_folder, "USERDATA_*")))

    if len(userdata_files) != 14:
        print(f"⚠️ Expected 14 USERDATA files, found {len(userdata_files)}")
        return None

    output_file = os.path.join(unpacked_folder, "memory.sl2")
    sizes = []

    with open(output_file, 'wb') as outfile:
        for file_path in userdata_files:
            with open(file_path, 'rb') as f:
                data = f.read()
                outfile.write(data)
                sizes.append(len(data))

    # Save size metadata
    sizes_path = os.path.join(unpacked_folder, "userdata_sizes.json")
    with open(sizes_path, 'w') as f:
        json.dump(sizes, f)

    return unpacked_folder

def decrypt_ds2_sl2(input_file) -> Optional[str]:
    try:
        with open(input_file, 'rb') as f:
            raw = f.read()
    except Exception as e:
        print(f"ERROR: Could not read input file: {e}")
        return None
    
    if raw[0:4] != b'BND4':
        print("ERROR: 'BND4' header not found! This doesn't appear to be a valid SL2 file.")
        return None

    num_bnd4_entries = struct.unpack("<i", raw[12:16])[0]

    BND4_HEADER_LEN = 64
    BND4_ENTRY_HEADER_LEN = 32

    bnd4_entries = []
    successful_decryptions = 0

    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_folder = os.path.join(script_dir, "decrypted_output")
    
    for i in range(num_bnd4_entries):
        pos = BND4_HEADER_LEN + (BND4_ENTRY_HEADER_LEN * i)
        
        if pos + BND4_ENTRY_HEADER_LEN > len(raw):
            print(f"Warning: File too small to read entry #{i} header")
            break
            
        entry_header = raw[pos:pos + BND4_ENTRY_HEADER_LEN]

        if entry_header[0:8] != b'\x40\x00\x00\x00\xff\xff\xff\xff':
            print(f"Warning: Entry header #{i} does not match expected magic value - skipping")
            continue

        entry_size = struct.unpack("<i", entry_header[8:12])[0]
        entry_data_offset = struct.unpack("<i", entry_header[16:20])[0]
        entry_name_offset = struct.unpack("<i", entry_header[20:24])[0]
        entry_footer_length = struct.unpack("<i", entry_header[24:28])[0]
        
        # Validity checks
        if entry_size <= 0 or entry_size > 1000000000:
            print(f"Warning: Entry #{i} has invalid size: {entry_size} - skipping")
            continue
            
        if entry_data_offset <= 0 or entry_data_offset + entry_size > len(raw):
            print(f"Warning: Entry #{i} has invalid data offset: {entry_data_offset} - skipping")
            continue
            
        if entry_name_offset <= 0 or entry_name_offset >= len(raw):
            print(f"Warning: Entry #{i} has invalid name offset: {entry_name_offset} - skipping")
            continue

        try:
            entry = BND4Entry(
                raw_data=raw, 
                index=i, 
                output_folder=output_folder, 
                size=entry_size, 
                offset=entry_data_offset,
                name_offset=entry_name_offset, 
                footer_length=entry_footer_length, 
                data_offset=entry_data_offset  
            )
            
            try:
                entry.decrypt()
                bnd4_entries.append(entry)
                successful_decryptions += 1
            except Exception as e:
                print(f"Error decrypting entry #{i}: {str(e)}")
                continue
                    
        except Exception as e:
            print(f"Error processing entry #{i}: {str(e)}")
            continue

    return output_folder

def locate_name(file_path, offset):
    with open(file_path, 'rb') as f:
        f.seek(offset)
        raw = f.read(10)
        if raw == b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00':
            return None
        return raw

def locate_name1(file_path, offset):
    with open(file_path, 'rb') as f:
        f.seek(offset)
        raw = f.read(5)
        if raw == b'\x00\x00\x00\x00\x00':
            return None
        return raw

def locate_name2(file_path, offset):
    with open(file_path, 'rb') as f:
        f.seek(offset)
        raw = f.read(3)
        if raw == b'\x00\x00\x00':
            return None
        return raw

def find_hex_offset(section_data, hex_pattern):
    try:
        pattern_bytes = bytes.fromhex(hex_pattern)
        if pattern_bytes in section_data:
            return section_data.index(pattern_bytes)
        return None
    except ValueError as e:
        print(f"Failed to find hex pattern: {str(e)}")
        return None

def aob_to_pattern(aob: str):
    parts = aob.split()
    pattern = bytearray()
    mask = bytearray()
    for p in parts:
        if p == "??":
            pattern.append(0x00)
            mask.append(0)
        else:
            pattern.append(int(p, 16))
            mask.append(1)
    return bytes(pattern), bytes(mask)

def aob_search(data: bytes, aob: str):
    pattern, mask = aob_to_pattern(aob)
    L = len(pattern)
    matches = []

    mv = memoryview(data)
    for i in range(len(data) - L + 1):
        ok = True
        for j in range(L):
            if mask[j]:
                if mv[i + j] != pattern[j]:
                    ok = False
                    break
            else:
                if mv[i + j] == 0:
                    ok = False
                    break
        if ok:
            matches.append(i)
            if len(matches) == 1:
                break
    return matches

def find_character_name(section_data, offset, byte_size=32):
    try:
        value_bytes = section_data[offset:offset+byte_size]
        name_chars = []
        for i in range(0, len(value_bytes), 2):
            char_byte = value_bytes[i]
            if char_byte == 0:
                break
            if 32 <= char_byte <= 126:
                name_chars.append(chr(char_byte))
            else:
                name_chars.append('.')
        return ''.join(name_chars)
    except IndexError:
        return "N/A"

def empty_slot_finder_aow(file_path, pattern_offset_start, pattern_offset_end):
    def get_slot_size(b4):
        if b4 == 0xC0:
            return 72
        elif b4 == 0x90:
            return 16
        elif b4 == 0x80:
            return 80
        else:
            return None
    
    start_pos = pattern_offset_start
    end_pos = pattern_offset_end
    valid_b4_values = {0x80, 0x90, 0xC0}
    found_slots = []
    
    try:
        with open(file_path, 'rb') as file:
            file.seek(start_pos)
            section_data = file.read(end_pos - start_pos)
    except Exception as e:
        print(f"Error reading file: {e}")
        return []

    # Find alignment point by scanning for valid slots
    def is_valid_slot_start(pos):
        if pos + 4 > len(section_data):
            return False, None
        
        b3, b4 = section_data[pos+2], section_data[pos+3]
        if b3 in (0x80, 0x83, 0x81, 0x82, 0x84, 0x85) and b4 in valid_b4_values:
            slot_size = get_slot_size(b4)
            if slot_size and pos + slot_size <= len(section_data):
                return True, slot_size
        return False, None
    
    # Find the first valid slot
    start_offset = None
    for i in range(0, len(section_data) - 8):
        valid, first_slot_size = is_valid_slot_start(i)
        if valid:
            next_pos = i + first_slot_size
            valid_next, _ = is_valid_slot_start(next_pos)
            
            is_empty_next = (next_pos + 8 <= len(section_data) and 
                             section_data[next_pos:next_pos+8] == b'\x00\x00\x00\x00\xFF\xFF\xFF\xFF')
            
            if valid_next or is_empty_next:
                start_offset = i
                break
    
    if start_offset is None:
        print("[ERROR] No valid slot alignment found.")
        return []

    # Process all slots from alignment with variable slot sizes
    i = start_offset

    while i < len(section_data) - 4:
        if i + 4 <= len(section_data):
            b3, b4 = section_data[i+2], section_data[i+3]

            if b3 in (0x80, 0x83, 0x81, 0x82, 0x84, 0x85) and b4 in valid_b4_values:
                slot_size = get_slot_size(b4)

                if slot_size and i + slot_size <= len(section_data):
                    if b4 == 0xC0:  # Only process relic slots (72 bytes)
                        slot_data = section_data[i:i+slot_size]
                        
                        # Extract relic information
                        slot_index = slot_data[0:2]
                        slot_index = int.from_bytes(slot_index, byteorder='little')
                        
                        item_id_bytes = slot_data[4:7]
                        item_id = int.from_bytes(item_id_bytes, byteorder='little')
                        
                        # Extract effect IDs
                        effect1_bytes = slot_data[16:20]
                        effect2_bytes = slot_data[20:24]
                        effect3_bytes = slot_data[24:28]

                        sec_effect1_bytes = slot_data[56:60]
                        sec_effect2_bytes = slot_data[60:64]
                        sec_effect3_bytes = slot_data[64:68]

                        effect1_id = int.from_bytes(effect1_bytes, byteorder='little')
                        effect2_id = int.from_bytes(effect2_bytes, byteorder='little')
                        effect3_id = int.from_bytes(effect3_bytes, byteorder='little')

                        sec_effect1_id = int.from_bytes(sec_effect1_bytes, byteorder='little')
                        sec_effect2_id = int.from_bytes(sec_effect2_bytes, byteorder='little')
                        sec_effect3_id = int.from_bytes(sec_effect3_bytes, byteorder='little')
                        
                        slot_info = {
                            'offset': start_pos + i,
                            'size': slot_size,
                            'item_id': item_id,
                            'effect1_id': effect1_id,
                            'effect2_id': effect2_id,
                            'effect3_id': effect3_id,
                            'sec_effect1_id': sec_effect1_id,
                            'sec_effect2_id': sec_effect2_id,
                            'sec_effect3_id': sec_effect3_id,
                            'sorting': slot_index
                        }
                        found_slots.append(slot_info)

                    i += slot_size
                    continue
        
        # Check for empty slots
        if i + 8 <= len(section_data) and section_data[i:i+8] == b'\x00\x00\x00\x00\xFF\xFF\xFF\xFF':
            i += 8
            continue
            
        i += 1
    
    return found_slots

def extract_relics_from_section(file_path, section_number):
    """Extract relics from a specific character section"""
    section_info = SECTIONS[section_number]
    
    with open(file_path, 'rb') as f:
        f.seek(section_info['start'])
        section_data = f.read(section_info['end'] - section_info['start'] + 1)
    
    # Determine character name offset
    base_offset = 0xA01AA2
    if 1 <= section_number <= 10:
        offset = base_offset + (section_number - 1) * 0x290
    else:
        print(f"Invalid section number: {section_number}")
        return None
    
    # Try to locate character name
    name_bytes = locate_name(file_path, offset)
    if name_bytes is None:
        name_bytes = locate_name1(file_path, offset)
        if name_bytes is None:
            name_bytes = locate_name2(file_path, offset)
    
    if name_bytes is None:
        print("Could not locate character name")
        return None
    
    # Find character data in section
    fixed_pattern_offset = find_hex_offset(section_data, name_bytes.hex())
    
    if fixed_pattern_offset is None:
        print("Character name pattern not found in section")
        return None
    
    # Calculate search boundaries for relics
    search_start_position = fixed_pattern_offset + 1000
    search_end_position = section_info['end'] - section_info['start']
    
    if search_start_position >= len(section_data):
        print("Search start position beyond section data")
        return None
    
    # Extract character name
    character_name = find_character_name(section_data, fixed_pattern_offset)
    
    # Find relics in this section
    relics = empty_slot_finder_aow(
        file_path, 
        section_info['start'] + 32, 
        section_info['start'] + fixed_pattern_offset - 100
    )
    
    return {
        'section_number': section_number,
        'character_name': character_name,
        'relics': relics
    }

def extract_all_relics(sl2_file_path):
    """Main function to extract all relic data from an .sl2 file"""
    try:
        # Handle SL2 decryption and merging
        unpacked_folder = merge_userdata_files(sl2_file_path)
        if unpacked_folder is None:
            print("Failed to decrypt and merge SL2 file")
            return None
        
        memory_file = os.path.join(unpacked_folder, "memory.sl2")
        if not os.path.exists(memory_file):
            print("memory.sl2 not found after decryption")
            return None
        
        all_character_data = []
        
        # Extract relics from all 10 character sections
        for section_num in range(1, 11):
            section_data = extract_relics_from_section(memory_file, section_num)
            if section_data and section_data['relics']:
                all_character_data.append(section_data)
        
        return all_character_data
        
    except Exception as e:
        print(f"Error extracting relics: {str(e)}")
        return None

def main():
    """Command line interface for testing"""
    if len(sys.argv) != 2:
        print("Usage: python relic_extractor.py <path_to_sl2_file>")
        sys.exit(1)
    
    sl2_file = sys.argv[1]
    if not os.path.exists(sl2_file):
        print(f"File not found: {sl2_file}")
        sys.exit(1)
    
    print(f"Extracting relics from: {sl2_file}")
    relic_data = extract_all_relics(sl2_file)
    
    if relic_data:
        print(json.dumps(relic_data, indent=2))
    else:
        print("No relic data extracted")
        sys.exit(1)

if __name__ == "__main__":
    main()