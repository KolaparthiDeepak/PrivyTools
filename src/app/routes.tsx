import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  createMemoryRouter,
  type RouteObject,
} from 'react-router-dom';
import { AppShell } from './AppShell';
import NotFound from '../routes/NotFound';

const Dashboard = lazy(() => import('../routes/Dashboard'));
const PdfSecurity = lazy(() => import('../routes/PdfSecurity'));
const PdfCompress = lazy(() => import('../routes/PdfCompress'));
const PdfMerge = lazy(() => import('../routes/PdfMerge'));
const PdfToImage = lazy(() => import('../routes/PdfToImage'));
const ImageCompress = lazy(() => import('../routes/ImageCompress'));
const ImageUpscale = lazy(() => import('../routes/ImageUpscale'));
const ImageToPdf = lazy(() => import('../routes/ImageToPdf'));
const Privacy = lazy(() => import('../routes/Privacy'));
const DesignSystem = lazy(() => import('../routes/DesignSystem'));
const DevJsonFormat = lazy(() => import('../routes/dev/JsonFormat'));
const DevJsonYaml = lazy(() => import('../routes/dev/JsonYaml'));
const DevJsonCsv = lazy(() => import('../routes/dev/JsonCsv'));
const DevJsonTs = lazy(() => import('../routes/dev/JsonTs'));
const DevBase64 = lazy(() => import('../routes/dev/Base64'));
const DevUrlEncode = lazy(() => import('../routes/dev/UrlEncode'));
const DevHtmlEntities = lazy(() => import('../routes/dev/HtmlEntities'));
const DevQueryJson = lazy(() => import('../routes/dev/QueryJson'));
const DevSlugify = lazy(() => import('../routes/dev/Slugify'));

const page = (el: React.ReactNode) => <Suspense fallback={<div className="p-8" />}>{el}</Suspense>;

const children: RouteObject[] = [
  { index: true, element: page(<Dashboard />) },
  { path: 'pdf/security', element: page(<PdfSecurity />) },
  { path: 'pdf/compress', element: page(<PdfCompress />) },
  { path: 'pdf/merge', element: page(<PdfMerge />) },
  { path: 'pdf/to-image', element: page(<PdfToImage />) },
  { path: 'image/compress', element: page(<ImageCompress />) },
  { path: 'image/upscale', element: page(<ImageUpscale />) },
  { path: 'image/to-pdf', element: page(<ImageToPdf />) },
  { path: 'dev/json-format', element: page(<DevJsonFormat />) },
  { path: 'dev/json-yaml', element: page(<DevJsonYaml />) },
  { path: 'dev/json-csv', element: page(<DevJsonCsv />) },
  { path: 'dev/json-ts', element: page(<DevJsonTs />) },
  { path: 'dev/base64', element: page(<DevBase64 />) },
  { path: 'dev/url', element: page(<DevUrlEncode />) },
  { path: 'dev/html-entities', element: page(<DevHtmlEntities />) },
  { path: 'dev/query-json', element: page(<DevQueryJson />) },
  { path: 'dev/slug', element: page(<DevSlugify />) },
  { path: 'privacy', element: page(<Privacy />) },
  ...(import.meta.env.DEV ? [{ path: '_ds', element: page(<DesignSystem />) }] : []),
  { path: '*', element: <NotFound /> },
];

export const routeObjects: RouteObject[] = [{ path: '/', element: <AppShell />, children }];

export const router = createBrowserRouter(routeObjects);
export const makeTestRouter = (entries: string[]) => createMemoryRouter(routeObjects, { initialEntries: entries });
