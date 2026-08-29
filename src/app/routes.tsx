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
const ImageCompress = lazy(() => import('../routes/ImageCompress'));
const ImageUpscale = lazy(() => import('../routes/ImageUpscale'));
const Privacy = lazy(() => import('../routes/Privacy'));
const DesignSystem = lazy(() => import('../routes/DesignSystem'));

const page = (el: React.ReactNode) => <Suspense fallback={<div className="p-8" />}>{el}</Suspense>;

const children: RouteObject[] = [
  { index: true, element: page(<Dashboard />) },
  { path: 'pdf/security', element: page(<PdfSecurity />) },
  { path: 'pdf/compress', element: page(<PdfCompress />) },
  { path: 'pdf/merge', element: page(<PdfMerge />) },
  { path: 'image/compress', element: page(<ImageCompress />) },
  { path: 'image/upscale', element: page(<ImageUpscale />) },
  { path: 'privacy', element: page(<Privacy />) },
  ...(import.meta.env.DEV ? [{ path: '_ds', element: page(<DesignSystem />) }] : []),
  { path: '*', element: <NotFound /> },
];

export const routeObjects: RouteObject[] = [{ path: '/', element: <AppShell />, children }];

export const router = createBrowserRouter(routeObjects);
export const makeTestRouter = (entries: string[]) => createMemoryRouter(routeObjects, { initialEntries: entries });
