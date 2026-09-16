export type Category = 'pdf' | 'image' | 'privacy' | 'ai' | 'dev';

export const CATEGORIES: Record<Category, { label: string; accent: Category }> = {
  pdf: { label: 'PDF', accent: 'pdf' },
  image: { label: 'Image', accent: 'image' },
  privacy: { label: 'Privacy', accent: 'privacy' },
  ai: { label: 'AI', accent: 'ai' },
  dev: { label: 'Developer', accent: 'dev' },
};
