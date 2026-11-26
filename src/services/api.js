import axios from 'axios';
import { getToken } from './authToken';
import i18n, { currentLanguage } from '../i18n';
import { translateServerMessage } from '../i18n/serverMessages';

// Backend base URL (VITE_API_URL in .env). Requests use paths like '/api/products'.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000, // a hung request should end in an error, not an endless loader
});

// Send the signed-in user's token with every request (protected routes need it)
api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.headers['Accept-Language'] = currentLanguage(); // lets the API pick the language where it can
    return config;
});

// A 401 on a request that carried a token means the session ended (expired
// token, deleted user): AuthContext registers a handler that signs out locally.
let unauthorizedHandler = null;
export function setUnauthorizedHandler(handler) {
    unauthorizedHandler = handler;
}

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const hadToken = Boolean(error?.config?.headers?.Authorization);
        if (error?.response?.status === 401 && hadToken) unauthorizedHandler?.(error);
        return Promise.reject(error);
    }
);

// Readable message for a failed request (the backend sends { message }), in the visitor's language
export function getErrorMessage(error) {
    if (error?.response?.data?.message) return translateServerMessage(error.response.data.message);
    if (error?.code === 'ECONNABORTED') return i18n.t('errors.timeout');
    if (!error?.response) return i18n.t('errors.offline');
    return i18n.t('errors.requestFailed', { status: error.response.status });
}

// A success message from the API ({ message }), translated when known
export const getServerMessage = (data, fallback = '') => translateServerMessage(data?.message) || fallback;

export default api;
