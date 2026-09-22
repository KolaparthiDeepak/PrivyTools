import forge from 'node-forge';
import { decodeBytes, encodeBytes, fromUtf8, randomBytes, runCipher, utf8, type ByteEncoding } from './crypto-bytes';

// Byte-compatible with Jasypt's StandardPBEStringEncryptor:
//   output = encode(salt || iv? || ciphertext)
// salt and iv are one cipher block long (8 for DES, 16 for AES).
// PBES1 (MD5+DES) derives key+IV from the password; a Jasypt RandomIvGenerator
// still prepends 8 IV bytes, which Java then ignores.
// SHA-224 variants are omitted: node-forge has no SHA-224.

export const JASYPT_ALGORITHMS = [
  'PBEWITHHMACSHA512ANDAES_256',
  'PBEWITHHMACSHA512ANDAES_128',
  'PBEWITHHMACSHA384ANDAES_256',
  'PBEWITHHMACSHA384ANDAES_128',
  'PBEWITHHMACSHA256ANDAES_256',
  'PBEWITHHMACSHA256ANDAES_128',
  'PBEWITHHMACSHA1ANDAES_256',
  'PBEWITHHMACSHA1ANDAES_128',
  'PBEWithMD5AndDES',
  'PBEWithMD5AndTripleDES',
] as const;

export type JasyptAlgorithm = (typeof JASYPT_ALGORITHMS)[number];

export interface JasyptOptions {
  password: string;
  algorithm: JasyptAlgorithm;
  iterations: number;
  /** RandomIvGenerator (true) vs NoIvGenerator (false). Always on for AES. */
  randomIv: boolean;
  encoding: ByteEncoding;
  /** Wrap encrypted output in ENC(...) for Spring property files. */
  wrapEnc?: boolean;
}

export const isAesAlgorithm = (a: JasyptAlgorithm) => a.includes('AES');

const MAX_ITERATIONS = 1_000_000;

interface Scheme {
  block: number;
  cipher: 'DES-CBC' | '3DES-CBC' | 'AES-CBC';
  derive: (password: string, salt: string, iterations: number) => { key: string; iv?: string };
}

function md5(...parts: string[]): string {
  const md = forge.md.md5.create();
  parts.forEach((p) => md.update(p));
  return md.digest().getBytes();
}

function asciiPassword(password: string): string {
  // Java's PBEKey only accepts printable ASCII for PBES1.
  if (!/^[\x20-\x7e]*$/.test(password)) throw new Error('MD5-based algorithms only accept ASCII passwords');
  return password;
}

function scheme(algorithm: JasyptAlgorithm): Scheme {
  if (algorithm === 'PBEWithMD5AndDES') {
    return {
      block: 8,
      cipher: 'DES-CBC',
      derive: (pw, salt, n) => {
        let h = md5(asciiPassword(pw), salt);
        for (let i = 1; i < n; i++) h = md5(h);
        return { key: h.slice(0, 8), iv: h.slice(8, 16) };
      },
    };
  }
  if (algorithm === 'PBEWithMD5AndTripleDES') {
    return {
      block: 8,
      cipher: '3DES-CBC',
      // Mirrors SunJCE PBES1Core.deriveCipherKey for DESede.
      derive: (pw, rawSalt, n) => {
        const p = asciiPassword(pw);
        let salt = rawSalt;
        if (salt.slice(0, 4) === salt.slice(4, 8)) salt = salt.slice(0, 4).split('').reverse().join('') + salt.slice(4);
        let out = '';
        for (let half = 0; half < 2; half++) {
          let h = md5(salt.slice(half * 4, half * 4 + 4), p);
          for (let i = 1; i < n; i++) h = md5(h, p);
          out += h;
        }
        return { key: out.slice(0, 24), iv: out.slice(24, 32) };
      },
    };
  }
  const m = /^PBEWITHHMACSHA(1|256|384|512)ANDAES_(128|256)$/.exec(algorithm)!;
  const md = { '1': 'sha1', '256': 'sha256', '384': 'sha384', '512': 'sha512' }[m[1]] as 'sha1' | 'sha256' | 'sha384' | 'sha512';
  const keyLen = Number(m[2]) / 8;
  return {
    block: 16,
    cipher: 'AES-CBC',
    derive: (pw, salt, n) => ({ key: forge.pkcs5.pbkdf2(utf8(pw), salt, n, keyLen, forge.md[md].create()) }),
  };
}

function validate(opts: JasyptOptions) {
  if (opts.password === '') throw new Error('Enter the password');
  if (!Number.isInteger(opts.iterations) || opts.iterations < 1 || opts.iterations > MAX_ITERATIONS) {
    throw new Error(`Iterations must be a whole number from 1 to ${MAX_ITERATIONS.toLocaleString('en-US')}`);
  }
}

const hasIv = (opts: JasyptOptions) => isAesAlgorithm(opts.algorithm) || opts.randomIv;

export function jasyptEncrypt(plaintext: string, opts: JasyptOptions): string {
  validate(opts);
  const s = scheme(opts.algorithm);
  const salt = randomBytes(s.block);
  const iv = hasIv(opts) ? randomBytes(s.block) : '';
  const derived = s.derive(opts.password, salt, opts.iterations);
  const { bytes } = runCipher({ algorithm: s.cipher, key: derived.key, iv: derived.iv ?? iv, decrypt: false, data: utf8(plaintext) });
  const out = encodeBytes(salt + iv + bytes, opts.encoding);
  return opts.wrapEnc ? `ENC(${out})` : out;
}

export function jasyptDecrypt(ciphertext: string, opts: JasyptOptions): string {
  validate(opts);
  const trimmed = ciphertext.trim();
  const unwrapped = /^ENC\((.*)\)$/s.exec(trimmed)?.[1] ?? trimmed;
  const s = scheme(opts.algorithm);
  const raw = decodeBytes(unwrapped, opts.encoding);
  const ivLen = hasIv(opts) ? s.block : 0;
  const header = s.block + ivLen;
  if (raw.length <= header || (raw.length - header) % s.block !== 0) {
    throw new Error('Ciphertext length does not match this algorithm / IV setting');
  }
  const salt = raw.slice(0, s.block);
  const iv = raw.slice(s.block, header);
  const derived = s.derive(opts.password, salt, opts.iterations);
  const { bytes } = runCipher({ algorithm: s.cipher, key: derived.key, iv: derived.iv ?? iv, decrypt: true, data: raw.slice(header) });
  return fromUtf8(bytes);
}
