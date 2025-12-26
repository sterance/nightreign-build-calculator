const BASE32_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePairingCode() {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += BASE32_ALPHABET[Math.floor(Math.random() * 32)];
  }
  return code;
}

function formatCode(code) {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export function formatPairingCode(code) {
  return formatCode(code);
}

