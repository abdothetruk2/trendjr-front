// JWT storage. "Remember me" keeps it in localStorage (survives closing the browser);
// otherwise it lives in sessionStorage for this tab only.
const KEY = 'trendjr_token';

export const getToken = () => localStorage.getItem(KEY) || sessionStorage.getItem(KEY);

export function saveToken(token, remember) {
    clearToken();
    (remember ? localStorage : sessionStorage).setItem(KEY, token);
}

export function clearToken() {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
}
