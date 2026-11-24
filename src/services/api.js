import axios from 'axios';
import { getToken } from './authToken';

// Backend base URL (VITE_API_URL in .env). Requests use paths like '/api/products'.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    timeout: 15000, // a hung request should end in an error, not an endless loader
});

// Send the signed-in user's token with every request (protected routes need it)
api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Readable message for a failed request (the backend sends { message })
export function getErrorMessage(error) {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.code === 'ECONNABORTED') return 'The server took too long to respond.';
    if (!error?.response) return 'Cannot reach the server. Please check your connection and try again.';
    return `Request failed (${error.response.status}).`;
}

export default api;
