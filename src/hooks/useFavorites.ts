import { usePrefs } from '../store/prefs.store';

export function useFavorites() {
  const favorites = usePrefs((s) => s.favorites);
  const toggle = usePrefs((s) => s.toggleFavorite);
  return { favorites, isFavorite: (id: string) => favorites.includes(id), toggle };
}
