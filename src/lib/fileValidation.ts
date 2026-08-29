type FileLike = { type: string; name: string };

const EXT_BY_MIME: Record<string, string[]> = {
  'application/pdf': ['pdf'],
  'image/png': ['png'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/webp': ['webp'],
};
const LABEL: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/webp': 'WebP',
};
const ext = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

export function isAccepted(file: FileLike, accept: string[]): boolean {
  if (file.type && accept.includes(file.type)) return true;
  const e = ext(file.name);
  return accept.some((m) => EXT_BY_MIME[m]?.includes(e));
}

export function rejectionReason(file: FileLike, accept: string[]): string | null {
  if (isAccepted(file, accept)) return null;
  const want = [...new Set(accept.map((m) => LABEL[m] ?? 'file'))].join(' or ');
  const got = LABEL[file.type] ?? (ext(file.name) ? ext(file.name).toUpperCase() : 'file');
  return `That's a ${got}. This tool needs a ${want}.`;
}
