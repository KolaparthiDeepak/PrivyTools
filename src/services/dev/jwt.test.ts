import { decodeJwt } from './jwt';

// header {"alg":"HS256","typ":"JWT"}  payload {"sub":"123","name":"Ada","iat":1700000000}
const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWRhIiwiaWF0IjoxNzAwMDAwMDAwfQ.abc123';

test('decodes header and payload', () => {
  const d = decodeJwt(TOKEN);
  expect(d.header).toEqual({ alg: 'HS256', typ: 'JWT' });
  expect(d.payload).toEqual({ sub: '123', name: 'Ada', iat: 1700000000 });
  expect(d.signature).toBe('abc123');
});

test('humanises iat claim', () => {
  expect(decodeJwt(TOKEN).claims.find((c) => c.label === 'Issued at')?.value).toContain('2023');
});

test('humanises exp and nbf claims', () => {
  // header {"alg":"none"}  payload {"exp":1700000000,"nbf":1699999999}
  const t =
    'eyJhbGciOiJub25lIn0.eyJleHAiOjE3MDAwMDAwMDAsIm5iZiI6MTY5OTk5OTk5OX0.';
  const labels = decodeJwt(t).claims.map((c) => c.label);
  expect(labels).toContain('Expires');
  expect(labels).toContain('Not before');
});

test('handles base64url chars (- _) and missing padding', () => {
  // header {"alg":"none"} ; payload {"q":">>>???"} -> base64url has - and _ and a dropped =
  const d = decodeJwt('eyJhbGciOiJub25lIn0.eyJxIjoiPj4-Pz8_In0.sig');
  expect(d.payload).toEqual({ q: '>>>???' });
});

test('rejects non-JWT', () => {
  expect(() => decodeJwt('a.b')).toThrow(/expected 3/);
});

test('rejects bad base64 json (header)', () => {
  expect(() => decodeJwt('!!!.!!!.sig')).toThrow(/JWT header is not valid Base64URL JSON/);
});

test('rejects bad base64 json (payload)', () => {
  expect(() => decodeJwt('eyJhbGciOiJub25lIn0.!!!.sig')).toThrow(
    /JWT payload is not valid Base64URL JSON/,
  );
});
