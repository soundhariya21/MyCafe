// Tiny API client for the admin server.
const TOKEN_KEY = 'mycafe-admin-token';

export const getToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
const setToken = (t) => {
  try {
    sessionStorage.setItem(TOKEN_KEY, t);
  } catch {
    /* ignore */
  }
};
export const clearToken = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors ?? [];
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn);

async function request(path, { method = 'GET', json, form, auth = true } = {}) {
  const headers = {};
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  if (json) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(path, { method, headers, body: json ? JSON.stringify(json) : form });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection.', 0);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    if (res.status === 401 && auth) onUnauthorized();
    throw new ApiError(data?.error || `Request failed (${res.status}).`, res.status, data?.errors);
  }
  return data;
}

export const getConfig = () => request('/api/config', { auth: false });

export async function login(password) {
  const { token } = await request('/api/login', { method: 'POST', json: { password }, auth: false });
  setToken(token);
}

export const loadContent = () => request('/api/admin/content');
export const saveContent = (rev, content) => request('/api/admin/content', { method: 'PUT', json: { rev, content } });

export async function uploadImage(file) {
  const form = new FormData();
  form.append('file', file);
  const { url } = await request('/api/admin/upload', { method: 'POST', form });
  return url;
}
