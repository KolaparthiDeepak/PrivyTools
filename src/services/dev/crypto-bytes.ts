import forge from 'node-forge';

// node-forge works on "binary strings" (one char per byte). These helpers keep
// that detail out of the tool services.

export type ByteEncoding = 'base64' | 'hex';

export function randomBytes(n: number): string {
  const buf = crypto.getRandomValues(new Uint8Array(n));
  let s = '';
  buf.forEach((b) => { s += String.fromCharCode(b); });
  return s;
}

export function encodeBytes(bytes: string, enc: ByteEncoding): string {
  return enc === 'hex' ? forge.util.bytesToHex(bytes).toUpperCase() : forge.util.encode64(bytes);
}

export function decodeBytes(text: string, enc: ByteEncoding): string {
  const s = text.replace(/\s+/g, '');
  if (enc === 'hex') {
    if (!/^(?:[0-9a-fA-F]{2})*$/.test(s)) throw new Error('Not valid hex');
    return forge.util.hexToBytes(s);
  }
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s) || s.length % 4 === 1) throw new Error('Not valid Base64');
  return forge.util.decode64(s);
}

export function hexKey(text: string, what: string): string {
  const s = text.replace(/\s+/g, '');
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(s)) throw new Error(`${what} must be hex`);
  return forge.util.hexToBytes(s);
}

export function toHex(bytes: string): string {
  return forge.util.bytesToHex(bytes);
}

export const utf8 = (s: string) => forge.util.encodeUtf8(s);

export function fromUtf8(bytes: string): string {
  try {
    return forge.util.decodeUtf8(bytes);
  } catch {
    throw new Error('Decrypted bytes are not UTF-8 text — wrong password or settings?');
  }
}

type BlockCipherName = Parameters<typeof forge.cipher.createCipher>[0];

interface RunOpts {
  algorithm: BlockCipherName;
  key: string;
  iv?: string;
  decrypt: boolean;
  data: string;
  tag?: string;
}

/** Runs a forge block cipher; returns output bytes (and the GCM tag when encrypting). */
export function runCipher({ algorithm, key, iv, decrypt, data, tag }: RunOpts): { bytes: string; tag?: string } {
  const c = decrypt
    ? forge.cipher.createDecipher(algorithm, key)
    : forge.cipher.createCipher(algorithm, key);
  c.start(algorithm.endsWith('GCM') ? { iv, tag: tag ? forge.util.createBuffer(tag) : undefined, tagLength: 128 } : { iv });
  c.update(forge.util.createBuffer(data));
  if (!c.finish()) throw new Error('Decryption failed — wrong password, key, or settings');
  const out = c.output.getBytes();
  const gcmTag = !decrypt && algorithm.endsWith('GCM') ? (c.mode as unknown as { tag: forge.util.ByteStringBuffer }).tag.getBytes() : undefined;
  return { bytes: out, tag: gcmTag };
}
