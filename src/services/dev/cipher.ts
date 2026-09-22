import forge from 'node-forge';
import { decodeBytes, encodeBytes, fromUtf8, hexKey, randomBytes, runCipher, toHex, utf8, type ByteEncoding } from './crypto-bytes';

// Generic symmetric cipher.
// - passphrase: `openssl enc` format ("Salted__" + 8-byte salt + ciphertext). The
//   EVP-MD5 KDF also matches CryptoJS.AES.encrypt(text, passphrase).
// - raw: caller supplies key and IV as hex. GCM output is ciphertext || 16-byte tag.

export type CipherAlgo = 'AES-128' | 'AES-192' | 'AES-256' | 'DES' | '3DES';
export type CipherMode = 'CBC' | 'ECB' | 'CTR' | 'CFB' | 'OFB' | 'GCM';
export type Kdf = 'pbkdf2-sha256' | 'pbkdf2-sha512' | 'evp-md5';

export interface CipherOptions {
  algo: CipherAlgo;
  mode: CipherMode;
  encoding: ByteEncoding;
  keySource: 'passphrase' | 'raw';
  passphrase: string;
  kdf: Kdf;
  iterations: number;
  keyHex: string;
  ivHex: string;
}

export const CIPHER_ALGOS: CipherAlgo[] = ['AES-256', 'AES-192', 'AES-128', '3DES', 'DES'];
const AES_MODES: CipherMode[] = ['CBC', 'GCM', 'CTR', 'CFB', 'OFB', 'ECB'];
const DES_MODES: CipherMode[] = ['CBC', 'ECB'];

export function modesFor(algo: CipherAlgo, keySource: CipherOptions['keySource']): CipherMode[] {
  const modes = algo.startsWith('AES') ? AES_MODES : DES_MODES;
  // openssl enc refuses AEAD modes, so GCM only makes sense with a raw key.
  return keySource === 'passphrase' ? modes.filter((m) => m !== 'GCM') : modes;
}

const keyLen = (algo: CipherAlgo) => ({ 'AES-128': 16, 'AES-192': 24, 'AES-256': 32, DES: 8, '3DES': 24 })[algo];
const blockLen = (algo: CipherAlgo) => (algo.startsWith('AES') ? 16 : 8);

export function ivLen(opts: Pick<CipherOptions, 'algo' | 'mode'>): number {
  if (opts.mode === 'ECB') return 0;
  return opts.mode === 'GCM' ? 12 : blockLen(opts.algo);
}

const forgeName = (o: CipherOptions) =>
  `${o.algo.startsWith('AES') ? 'AES' : o.algo}-${o.mode}` as Parameters<typeof forge.cipher.createCipher>[0];

const MAX_ITERATIONS = 1_000_000;
const SALTED = 'Salted__';

function evpBytesToKey(pass: string, salt: string, len: number): string {
  let out = '';
  let prev = '';
  while (out.length < len) {
    const md = forge.md.md5.create();
    md.update(prev + pass + salt);
    prev = md.digest().getBytes();
    out += prev;
  }
  return out.slice(0, len);
}

function deriveFromPassphrase(o: CipherOptions, salt: string) {
  if (o.passphrase === '') throw new Error('Enter the passphrase');
  const kl = keyLen(o.algo);
  const il = ivLen(o);
  const pass = utf8(o.passphrase);
  let km: string;
  if (o.kdf === 'evp-md5') {
    km = evpBytesToKey(pass, salt, kl + il);
  } else {
    if (!Number.isInteger(o.iterations) || o.iterations < 1 || o.iterations > MAX_ITERATIONS) {
      throw new Error(`Iterations must be a whole number from 1 to ${MAX_ITERATIONS.toLocaleString('en-US')}`);
    }
    const md = o.kdf === 'pbkdf2-sha512' ? forge.md.sha512.create() : forge.md.sha256.create();
    km = forge.pkcs5.pbkdf2(pass, salt, o.iterations, kl + il, md);
  }
  return { key: km.slice(0, kl), iv: km.slice(kl) };
}

function rawKeyIv(o: CipherOptions) {
  const key = hexKey(o.keyHex, 'Key');
  if (key.length !== keyLen(o.algo)) {
    throw new Error(`${o.algo} needs a ${keyLen(o.algo) * 8}-bit key (${keyLen(o.algo) * 2} hex chars)`);
  }
  const iv = hexKey(o.ivHex, 'IV');
  const want = ivLen(o);
  if (o.mode === 'GCM' ? iv.length === 0 : iv.length !== want) {
    throw new Error(want === 0 ? 'ECB takes no IV' : `IV must be ${want * 2} hex chars for ${o.mode}`);
  }
  return { key, iv };
}

function checkMode(o: CipherOptions) {
  if (!modesFor(o.algo, o.keySource).includes(o.mode)) {
    throw new Error(`${o.mode} is not available for ${o.algo}${o.keySource === 'passphrase' ? ' with a passphrase' : ''}`);
  }
}

export function encryptText(plaintext: string, o: CipherOptions): string {
  checkMode(o);
  const data = utf8(plaintext);
  if (o.keySource === 'passphrase') {
    const salt = randomBytes(8);
    const { key, iv } = deriveFromPassphrase(o, salt);
    const { bytes } = runCipher({ algorithm: forgeName(o), key, iv, decrypt: false, data });
    return encodeBytes(SALTED + salt + bytes, o.encoding);
  }
  const { key, iv } = rawKeyIv(o);
  const { bytes, tag } = runCipher({ algorithm: forgeName(o), key, iv, decrypt: false, data });
  return encodeBytes(bytes + (tag ?? ''), o.encoding);
}

export function decryptText(ciphertext: string, o: CipherOptions): string {
  checkMode(o);
  const raw = decodeBytes(ciphertext, o.encoding);
  if (o.keySource === 'passphrase') {
    if (raw.slice(0, 8) !== SALTED || raw.length < 16) throw new Error('Missing the OpenSSL "Salted__" header');
    const { key, iv } = deriveFromPassphrase(o, raw.slice(8, 16));
    return fromUtf8(runCipher({ algorithm: forgeName(o), key, iv, decrypt: true, data: raw.slice(16) }).bytes);
  }
  const { key, iv } = rawKeyIv(o);
  if (o.mode === 'GCM') {
    if (raw.length < 16) throw new Error('Ciphertext is shorter than the GCM tag');
    const data = raw.slice(0, -16);
    const tag = raw.slice(-16);
    return fromUtf8(runCipher({ algorithm: forgeName(o), key, iv, decrypt: true, data, tag }).bytes);
  }
  return fromUtf8(runCipher({ algorithm: forgeName(o), key, iv, decrypt: true, data: raw }).bytes);
}

export function randomKeyHex(algo: CipherAlgo): string {
  return toHex(randomBytes(keyLen(algo)));
}

export function randomIvHex(opts: Pick<CipherOptions, 'algo' | 'mode'>): string {
  return toHex(randomBytes(ivLen(opts)));
}
