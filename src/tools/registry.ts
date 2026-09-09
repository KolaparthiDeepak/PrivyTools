import {
  ShieldCheck, Minimize2, Combine, ImageDown, Sparkles, Lock, Images, FileImage, Braces, FileJson2, Binary,
  Link, Code, Link2, Table, FileType, Type, CaseSensitive, Clock, CalendarClock,
  type LucideIcon,
} from 'lucide-react';
import type { Category } from './categories';
import type { ProcessingMode } from '../lib/privacyCopy';
export { CATEGORIES } from './categories';
export type { Category } from './categories';
export type { ProcessingMode } from '../lib/privacyCopy';

export interface Tool {
  id: string;
  name: string;
  description: string;
  route: string;
  category: Category;
  icon: LucideIcon;
  shortcut?: string;
  processing: ProcessingMode;
  status: 'live' | 'demo';
  kind?: 'file' | 'text';
  accept: string[];
}

const PDF = ['application/pdf'];
const IMG = ['image/png', 'image/jpeg', 'image/webp'];

export const TOOLS: Tool[] = [
  {
    id: 'pdf-security', name: 'PDF Security', description: 'Protect or unlock PDFs',
    route: '/pdf/security', category: 'pdf', icon: ShieldCheck,
    processing: 'local', status: 'live', accept: PDF,
  },
  {
    id: 'pdf-compress', name: 'Compress PDF', description: 'Reduce file size, keep it readable',
    route: '/pdf/compress', category: 'pdf', icon: Minimize2,
    processing: 'local', status: 'live', accept: PDF,
  },
  {
    id: 'pdf-merge', name: 'Merge PDF', description: 'Combine documents into one',
    route: '/pdf/merge', category: 'pdf', icon: Combine,
    processing: 'local', status: 'live', accept: PDF,
  },
  {
    id: 'pdf-to-image', name: 'PDF to Image', description: 'Turn pages into PNGs',
    route: '/pdf/to-image', category: 'pdf', icon: FileImage,
    processing: 'local', status: 'live', accept: PDF,
  },
  {
    id: 'image-compress', name: 'Compress Image', description: 'Smaller images, same feeling',
    route: '/image/compress', category: 'image', icon: ImageDown,
    processing: 'local', status: 'live', accept: IMG,
  },
  {
    id: 'image-upscale', name: 'Upscale Image', description: 'Enlarge and sharpen images',
    route: '/image/upscale', category: 'image', icon: Sparkles,
    processing: 'local', status: 'live', accept: IMG,
  },
  {
    id: 'image-to-pdf', name: 'Image to PDF', description: 'Combine images into one document',
    route: '/image/to-pdf', category: 'image', icon: Images,
    processing: 'local', status: 'live', accept: ['image/jpeg', 'image/png'],
  },
  {
    id: 'privacy-center', name: 'Privacy Center', description: 'How your files are handled',
    route: '/privacy', category: 'privacy', icon: Lock,
    processing: 'local', status: 'live', accept: [],
  },
  {
    id: 'dev-json-format', name: 'JSON Formatter', description: 'Prettify or minify JSON',
    route: '/dev/json-format', category: 'dev', icon: Braces,
    processing: 'local', status: 'live', kind: 'text', accept: [],
  },
  {
    id: 'dev-json-yaml', name: 'JSON ⇄ YAML', description: 'Convert between JSON and YAML',
    route: '/dev/json-yaml', category: 'dev', icon: FileJson2,
    processing: 'local', status: 'live', kind: 'text', accept: [],
  },
  {
    id: 'dev-base64', name: 'Base64', description: 'Encode or decode Base64',
    route: '/dev/base64', category: 'dev', icon: Binary,
    processing: 'local', status: 'live', kind: 'text', accept: [],
  },
  {
    id: 'dev-url', name: 'URL Encode', description: 'Percent-encode or decode URL components',
    route: '/dev/url', category: 'dev', icon: Link,
    processing: 'local', status: 'live', kind: 'text', accept: [],
  },
  {
    id: 'dev-html-entities', name: 'HTML Entities', description: 'Escape or unescape HTML entities',
    route: '/dev/html-entities', category: 'dev', icon: Code,
    processing: 'local', status: 'live', kind: 'text', accept: [],
  },
  {
    id: 'dev-query-json', name: 'Query String ⇄ JSON', description: 'Parse or build URL query strings',
    route: '/dev/query-json', category: 'dev', icon: Link2,
    processing: 'local', status: 'live', kind: 'text', accept: [],
  },
  {
    id: 'dev-json-csv', name: 'JSON ⇄ CSV', description: 'Convert a JSON array to CSV and back',
    route: '/dev/json-csv', category: 'dev', icon: Table,
    processing: 'local', status: 'live', kind: 'text', accept: [],
  },
  {
    id: 'dev-json-ts', name: 'JSON → TypeScript', description: 'Infer TypeScript interfaces from a JSON sample',
    route: '/dev/json-ts', category: 'dev', icon: FileType,
    processing: 'local', status: 'live', kind: 'text', accept: [],
  },
  {
    id: 'dev-slug', name: 'Slugify', description: 'Make URL-safe slugs from text',
    route: '/dev/slug', category: 'dev', icon: Type,
    processing: 'local', status: 'live', kind: 'text', accept: [],
  },
  {
    id: 'dev-case', name: 'Case Converter', description: 'camelCase, snake_case, kebab-case and more',
    route: '/dev/case', category: 'dev', icon: CaseSensitive,
    processing: 'local', status: 'live', kind: 'text', accept: [],
  },
  {
    id: 'dev-timestamp', name: 'Timestamp Converter', description: 'Unix epoch to human dates and back',
    route: '/dev/timestamp', category: 'dev', icon: Clock,
    processing: 'local', status: 'live', kind: 'text', accept: [],
  },
  {
    id: 'dev-cron', name: 'Cron Explainer', description: 'Read a cron expression in plain English',
    route: '/dev/cron', category: 'dev', icon: CalendarClock,
    processing: 'local', status: 'live', kind: 'text', accept: [],
  },
];

export const getTool = (id: string) => TOOLS.find((t) => t.id === id);
export const toolsByCategory = (c: Category) => TOOLS.filter((t) => t.category === c);
