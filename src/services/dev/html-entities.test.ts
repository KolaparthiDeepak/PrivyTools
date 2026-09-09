import { encodeEntities, decodeEntities } from './html-entities';

test('encodes the five', () => {
  expect(encodeEntities(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
});
test('decodes named and numeric', () => {
  expect(decodeEntities('&lt;b&gt;&#39;hi&#39;&amp;&#x2764;')).toBe(`<b>'hi'&❤`);
});
test('round-trips', () => {
  const s = `5 < 6 && "yes" > 'no'`;
  expect(decodeEntities(encodeEntities(s))).toBe(s);
});
