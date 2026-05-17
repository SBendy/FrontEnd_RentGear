function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(out);
    return out;
  }
  for (let i = 0; i < length; i++) {
    out[i] = (Math.random() * 256) | 0;
  }
  return out;
}

export function randomHex(byteLength: number): string {
  return Array.from(randomBytes(byteLength), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
