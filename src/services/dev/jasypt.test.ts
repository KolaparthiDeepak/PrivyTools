import { jasyptDecrypt, jasyptEncrypt, JASYPT_ALGORITHMS, type JasyptOptions } from './jasypt';

// Vectors produced by org.jasypt:jasypt:1.9.3 StandardPBEStringEncryptor on JDK 21.
const PLAIN = 'héllo wörld – jdbc:mysql://db/prod?pw=hunter2';
const base: JasyptOptions = {
  password: 's3cr3t-pass', algorithm: 'PBEWITHHMACSHA512ANDAES_256', iterations: 1000, randomIv: true, encoding: 'base64',
};

const VECTORS: [Partial<JasyptOptions>, string][] = [
  [{ algorithm: 'PBEWithMD5AndDES', randomIv: false }, 'bwOkDcyz3GhVauPW8uU+wHDTlqLOIn9cfZehGIYMmL71vY9coSGuCGPN8/3PYxRXnA4Y8bgTU5fUpKhz+KYZCg=='],
  [{ algorithm: 'PBEWithMD5AndDES', randomIv: true }, 'CpHGNxV9WmKTVWx/pB76yFdf6V+iN2ThjXZey/EmVjsQY//HdhOdOuGg/UA8HA0Hq1JNywMq8eQFymv16IUcrOhUaESPLsz/'],
  [{ algorithm: 'PBEWithMD5AndTripleDES', randomIv: false }, '/4zmfKNjhHaS6XnL0Gyw3a1SGVpkApxuPU7lwT0jRj7oSagEO39/fnX5dQyfrCvn0sNXUT/4Wc9t4yqT1Uaxog=='],
  [{ algorithm: 'PBEWithMD5AndTripleDES', randomIv: false, iterations: 7, encoding: 'hex' }, 'D7124CACBB6C3802638E2ED5BA35B62B03DAEEA228EE8844412ADD0A46076376E4EC65900D157451A493613ADE8B334DD4B3E5C242A0D8B29E191785E15AB2D6'],
  [{}, 'me3CzQ5b+xVbffl1r+niv4ejJ5EgCyLx89HzXmuQh4XOrlTbxLM9N7xW8f4fY/hiaxJVbX5GOtzq+icwSaZ4WqxdP/2FHAZ9R5yQtC/fNuWnWPH5wt73Y/Pb5mhy6n5K'],
  [{ algorithm: 'PBEWITHHMACSHA256ANDAES_128' }, 'qnQOWLcbVugvRp7j0DnePvuqBW8KKyyUJsom5zbCLJrdbHD2aWajkKlfQY/47HfY1rovGSDnEB/eid5iETY+2LtaxCB8jyx0LQw7Lave3VtfW3du9Tclf/PcpxSAfjci'],
  [{ algorithm: 'PBEWITHHMACSHA1ANDAES_256', iterations: 500, encoding: 'hex' }, 'A151EE771BBD12BD7C502B5487EBB73CF4ACAD3AE4D9D671D2BFE26BC3BA5A3B628B5371CB11DF4DC498F6F407ED33CEC6B3EA22A2C41DF2752C3D50106161B9B70464C30AF6FBA25D79B3A17D62785DB374284D95176874665BF0D8EFEDAC09'],
  [{ algorithm: 'PBEWITHHMACSHA384ANDAES_256' }, 'Cc7BlB4iZ0b4/7ifWWkvdT8a0wG2YQ173I4or3Qx04qNpoSPtdgI8CtNIIatkm+njaI1Asnb9Vbk8Rj0yhmkuKdeXvsO+saGJ+YM84yoyMLrrsk7BBkEIb+oo/jwVRvN'],
];

test.each(VECTORS)('decrypts a real Jasypt ciphertext %#', (o, ct) => {
  expect(jasyptDecrypt(ct, { ...base, ...o })).toBe(PLAIN);
});

test.each(JASYPT_ALGORITHMS.map((a) => [a]))('round-trips %s', (algorithm) => {
  const opts = { ...base, algorithm, iterations: 50 };
  const ct = jasyptEncrypt(PLAIN, opts);
  expect(jasyptDecrypt(ct, opts)).toBe(PLAIN);
});

test('encrypting twice gives different ciphertexts (random salt)', () => {
  expect(jasyptEncrypt('x', base)).not.toBe(jasyptEncrypt('x', base));
});

test('ENC(...) wrapping is produced and accepted', () => {
  const ct = jasyptEncrypt('secret', { ...base, wrapEnc: true });
  expect(ct).toMatch(/^ENC\(.+\)$/);
  expect(jasyptDecrypt(ct, base)).toBe('secret');
});

test('wrong password fails with a readable error', () => {
  expect(() => jasyptDecrypt(VECTORS[4][1], { ...base, password: 'nope' })).toThrow(/wrong password|not UTF-8/);
});

test('rejects missing password, bad iterations, bad input', () => {
  expect(() => jasyptEncrypt('x', { ...base, password: '' })).toThrow('Enter the password');
  expect(() => jasyptEncrypt('x', { ...base, iterations: 0 })).toThrow(/Iterations/);
  expect(() => jasyptDecrypt('***', base)).toThrow('Not valid Base64');
  expect(() => jasyptDecrypt('AAAA', base)).toThrow(/length/);
});

test('MD5 algorithms reject non-ASCII passwords like Java does', () => {
  expect(() => jasyptEncrypt('x', { ...base, algorithm: 'PBEWithMD5AndDES', password: 'pässword' })).toThrow(/ASCII/);
});
