export interface TimestampInfo {
  unixSeconds: string; unixMillis: string; iso: string; utc: string; local: string; relative: string;
}

function relative(from: Date, to: Date): string {
  const secs = Math.round((from.getTime() - to.getTime()) / 1000);
  const abs = Math.abs(secs);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000], ['month', 2592000], ['day', 86400],
    ['hour', 3600], ['minute', 60], ['second', 1],
  ];
  for (const [unit, size] of units) {
    if (abs >= size || unit === 'second') return rtf.format(Math.round(secs / size), unit);
  }
  return 'now';
}

export function describeTimestamp(input: string, now: Date): TimestampInfo {
  const trimmed = input.trim();
  let date: Date;
  if (/^-?\d+$/.test(trimmed)) {
    const n = Number(trimmed);
    date = new Date(trimmed.length > 11 ? n : n * 1000);
  } else {
    date = new Date(trimmed);
  }
  if (Number.isNaN(date.getTime())) {
    throw new Error('Not a recognisable date or timestamp');
  }
  return {
    unixSeconds: String(Math.floor(date.getTime() / 1000)),
    unixMillis: String(date.getTime()),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toString(),
    relative: relative(date, now),
  };
}
