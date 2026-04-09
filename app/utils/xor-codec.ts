const ENCODE_KEY = "fw26k";

export function xorDecode(encoded: string, key: string = ENCODE_KEY): string {
  try {
    const raw = atob(encoded);
    let result = "";
    for (let i = 0; i < raw.length; i++) {
      result += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return "";
  }
}

export { ENCODE_KEY };
