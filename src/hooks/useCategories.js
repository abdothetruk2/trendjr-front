import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';

// The store's categories (with product counts), loaded once and shared by every
// component that needs them (home, shop, category and product pages, menus) instead
// of each one requesting /api/categories again. Kept for 5 minutes.
const TTL = 5 * 60 * 1000;
let cache = null; // { data, at }
let inflight = null;

function load() {
  if (!inflight) {
    inflight = api.get('/api/categories?counts=true')
      .then((res) => {
        cache = { data: Array.isArray(res.data) ? res.data : [], at: Date.now() };
        return cache.data;
      })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

const fresh = () => cache && Date.now() - cache.at < TTL;

export default function useCategories() {
  const [state, setState] = useState(() => (fresh()
    ? { data: cache.data, loading: false, error: '' }
    : { data: null, loading: true, error: '' }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (fresh()) {
      setState({ data: cache.data, loading: false, error: '' });
      return undefined;
    }
    let alive = true;
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    load()
      .then((data) => { if (alive) setState({ data, loading: false, error: '' }); })
      .catch((err) => { if (alive) setState({ data: null, loading: false, error: getErrorMessage(err) }); });
    return () => { alive = false; };
  }, [attempt]);

  const retry = useCallback(() => {
    cache = null;
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, retry };
}
