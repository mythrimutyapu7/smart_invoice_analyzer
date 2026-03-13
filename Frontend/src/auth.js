const TOKEN_KEY = "sia_token";
const USER_KEY = "sia_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
  } else {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function signOut() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAuthHeaders() {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function authFetch(path, options = {}) {
  const resp = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export async function signIn({ email, password }) {
  const data = await authFetch("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  setToken(data.token);
  setCurrentUser(data.user);
  return data.user;
}

export async function signUp({ name, email, password }) {
  const data = await authFetch("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

  setToken(data.token);
  setCurrentUser(data.user);
  return data.user;
}

export async function fetchCurrentUser() {
  const token = getToken();
  if (!token) return null;

  const resp = await fetch("/api/auth/me", {
    headers: getAuthHeaders(),
  });

  if (!resp.ok) {
    signOut();
    return null;
  }

  const data = await resp.json();
  setCurrentUser(data);
  return data;
}

export async function updateCurrentUser(update) {
  const resp = await fetch("/api/auth/me", {
    method: "PATCH",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || "Update failed");
  }

  const data = await resp.json();
  setCurrentUser(data);
  return data;
}
