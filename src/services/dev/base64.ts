export function encodeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

export function decodeBase64(input: string): string {
  let bin: string;
  try {
    bin = atob(input.trim());
  } catch {
    throw new Error('Not valid Base64');
  }
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
