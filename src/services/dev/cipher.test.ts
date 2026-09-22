import { decryptText, encryptText, modesFor, randomIvHex, randomKeyHex, CIPHER_ALGOS, type CipherOptions } from './cipher';

// Vectors from `openssl enc` 3.6 and node:crypto (GCM).
const PLAIN = 'héllo wörld – jdbc:mysql://db/prod?pw=hunter2';
const pass: CipherOptions = {
  algo: 'AES-256', mode: 'CBC', encoding: 'base64', keySource: 'passphrase', passphrase: 's3cr3t-pass',
  kdf: 'pbkdf2-sha256', iterations: 10000, keyHex: '', ivHex: '',
};
const K16 = '000102030405060708090a0b0c0d0e0f';

test.each<[Partial<CipherOptions>, string]>([
  [{ kdf: 'evp-md5' }, 'U2FsdGVkX188beuePiTioXD6tTUVbvwdvUc7DIKtKV/dJMy0btB4HCEtch+2sOobopjzwbx2oHju7PLqjVXeh+AOxSjPdcV8d4XTFhpy50w='],
  [{}, 'U2FsdGVkX1/y5OlCMomQUExjrPsJo29AQJP17phW8BaAT3Bf4AW3yGPRTbl41qRBN07XQU/4XT4scj3Lc3HsXx7RHAmHPGhmVAQAzQCS2xM='],
  [{ algo: 'AES-128', iterations: 2000 }, 'U2FsdGVkX1+OXoUMnts3Pv2DBLtwrnHtX2aM7pIAbeLd5qMRyKiTyWO9aL18aIbDPS8HTyywGUzaOC6ZJCLIzgXbIYerUw8zL4RPppCj3K0='],
  [{ algo: '3DES' }, 'U2FsdGVkX19SY8JG2CktNjOlSZgScVGQjXY7gkR3wmMzmJdc58eRGmfT5DAaHAFV6b50nva3wGdM4Iw+L5IcDyvVrXERhdrF'],
  [{ mode: 'CTR' }, 'U2FsdGVkX1+HMo4gdPOaSiDDS+tmsw1M/B8LFDxcydg1DkeZamOIT6hnqnGMpDTHQ1/N1S8JbEkiEE22owz+GwM='],
  [{ kdf: 'pbkdf2-sha512', iterations: 1000 }, 'U2FsdGVkX194jz9clpgZw5w+HLgqGZL4/1Jrgy+CzGX2XfqQR3dPLRLrRCDNZLOgCHHe+et0l3pcY+cFgjY+g61nfcN1yrWp67t6YFaBG6I='],
])('decrypts openssl passphrase output %#', (o, ct) => {
  expect(decryptText(ct, { ...pass, ...o })).toBe(PLAIN);
});

test.each<[Partial<CipherOptions>, string]>([
  [{ algo: 'AES-128', keyHex: K16, ivHex: '0f0e0d0c0b0a09080706050403020100' }, '7C7sp8rN1sCcPPgNjYXD623F0pt7JeMy2GjcT84tHD+zdSzFTnFRaIDPR2Ka/QdiAqDaPqs+alJxqWgnbezoUw=='],
  [{ algo: '3DES', keyHex: `${K16}1011121314151617`, ivHex: '0001020304050607' }, 'ewGi/JGeCnK8MPr76qepAodjXD90km1C+5HOrlXOfql/BAfEsERLeAN/hANNH8baaPreT/TnjDA='],
  [{ mode: 'ECB', keyHex: K16 + K16 }, 'xaCtqLIgSOLTG8RpjGl8Bax68uceE92STlPkbadh3NoS1JN1YGaRViOA5KOtDOdzg/vSLJDZamj/iOMoZsQiSg=='],
  [{ mode: 'GCM', keyHex: K16 + K16, ivHex: 'cafebabefacedbaddecaf888' }, 'ilD9nUvU5qLD4I2I0mcJZTGshr/Xnn2MXaiqini6/NQXGHjm7azmk1ZQnbkNCLrIGTRhW9HILoPrEZY/ZGkM95M='],
])('raw key: encrypts deterministically and decrypts %#', (o, ct) => {
  const opts = { ...pass, keySource: 'raw' as const, ...o };
  expect(encryptText(PLAIN, opts)).toBe(ct);
  expect(decryptText(ct, opts)).toBe(PLAIN);
});

test('every algo/mode/key source round-trips', () => {
  for (const algo of CIPHER_ALGOS) {
    for (const keySource of ['passphrase', 'raw'] as const) {
      for (const mode of modesFor(algo, keySource)) {
        const opts: CipherOptions = {
          ...pass, algo, mode, keySource, iterations: 10, encoding: 'hex',
          keyHex: randomKeyHex(algo), ivHex: randomIvHex({ algo, mode }),
        };
        expect(decryptText(encryptText(PLAIN, opts), opts)).toBe(PLAIN);
      }
    }
  }
});

test('GCM detects tampering', () => {
  const opts = { ...pass, keySource: 'raw' as const, mode: 'GCM' as const, keyHex: K16 + K16, ivHex: 'cafebabefacedbaddecaf888', encoding: 'hex' as const };
  const ct = encryptText('secret', opts);
  const flipped = (ct[0] === '0' ? '1' : '0') + ct.slice(1);
  expect(() => decryptText(flipped, opts)).toThrow(/Decryption failed/);
});

test('readable validation errors', () => {
  const raw = { ...pass, keySource: 'raw' as const };
  expect(() => encryptText('x', { ...pass, passphrase: '' })).toThrow('Enter the passphrase');
  expect(() => encryptText('x', { ...raw, keyHex: 'abcd' })).toThrow(/256-bit key/);
  expect(() => encryptText('x', { ...raw, keyHex: K16 + K16, ivHex: '00' })).toThrow(/IV must be 32 hex/);
  expect(() => encryptText('x', { ...pass, mode: 'GCM' })).toThrow(/not available/);
  expect(() => decryptText('aGVsbG8gd29ybGQh', pass)).toThrow(/Salted__/);
});
