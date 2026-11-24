import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// Filters kept in the URL (?search=&status=&page=), like the shop's product grid,
// so Back/Forward and bookmarks return to the same view.
// get('page') -> the value, or the default; update({ status: 'paid', page: null })
// (null, '' or the default removes the key).
export default function useUrlParams(defaults = {}) {
    const [params, setParams] = useSearchParams();

    const get = useCallback(
        (key) => params.get(key) ?? (defaults[key] !== undefined ? String(defaults[key]) : ''),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [params]
    );

    const update = useCallback((changes, { push = false } = {}) => {
        setParams((prev) => {
            const next = new URLSearchParams(prev);
            Object.entries(changes).forEach(([key, value]) => {
                const isDefault = defaults[key] !== undefined && String(defaults[key]) === String(value);
                if (value === null || value === undefined || value === '' || isDefault) next.delete(key);
                else next.set(key, String(value));
            });
            return next;
        }, { replace: !push });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setParams]);

    return { get, update, params };
}
