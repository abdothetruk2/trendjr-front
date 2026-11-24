import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// Selected category slug kept in the URL (?category=home-kitchen); 'all' = every product.
// Changing it goes back to page 1.
export default function useCategoryParam() {
    const [params, setParams] = useSearchParams();
    const category = params.get('category') || 'all';

    const setCategory = useCallback((slug) => {
        setParams((prev) => {
            const next = new URLSearchParams(prev);
            if (!slug || slug === 'all') next.delete('category');
            else next.set('category', slug);
            next.delete('page');
            return next;
        }, { replace: true });
    }, [setParams]);

    return [category, setCategory];
}
