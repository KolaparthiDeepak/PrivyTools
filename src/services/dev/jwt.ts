export interface DecodedJwt {
  header: unknown;
  payload: unknown;
  signature: string;
  claims: { label: string; value: string }[];
}

function b64urlToJson(seg: string, which: string): unknown {
  try {
    const b64 = seg.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(seg.length / 4) * 4, '=');
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))));
  } catch {
    throw new Error(`JWT ${which} is not valid Base64URL JSON`);
  }
}

const CLAIM_LABELS: Record<string, string> = { exp: 'Expires', iat: 'Issued at', nbf: 'Not before' };

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split('.');
  if (parts.length !== 3) throw new Error('Not a JWT (expected 3 dot-separated parts)');
  const header = b64urlToJson(parts[0], 'header');
  const payload = b64urlToJson(parts[1], 'payload');

  const claims: { label: string; value: string }[] = [];
  if (payload && typeof payload === 'object') {
    for (const [key, label] of Object.entries(CLAIM_LABELS)) {
      const v = (payload as Record<string, unknown>)[key];
      if (typeof v === 'number') claims.push({ label, value: new Date(v * 1000).toISOString() });
    }
  }
  return { header, payload, signature: parts[2], claims };
}
