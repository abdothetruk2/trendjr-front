import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import api, { getErrorMessage } from '../services/api';

// GET one backend path and track { data, total, loading, error, status }.
// `total` comes from the X-Total-Count header of paginated lists (null otherwise).
// The request is cancelled if the component unmounts or the path changes.
export default function useApi(path) {
    const [state, setState] = useState({ data: null, total: null, loading: true, error: '', status: 0 });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setState((prev) => (prev.loading && !prev.error ? prev : { ...prev, loading: true, error: '' }));

        api.get(path, { signal: controller.signal })
            .then((res) => {
                const total = Number(res.headers['x-total-count']);
                setState({
                    data: res.data,
                    total: res.headers['x-total-count'] != null && Number.isFinite(total) ? total : null,
                    loading: false,
                    error: '',
                    status: res.status,
                });
            })
            .catch((err) => {
                if (axios.isCancel(err)) return; // path changed or component unmounted
                setState({ data: null, total: null, loading: false, error: getErrorMessage(err), status: err.response?.status || 0 });
            });

        return () => controller.abort();
    }, [path, attempt]);

    const retry = useCallback(() => setAttempt((n) => n + 1), []);

    return { ...state, retry };
}
