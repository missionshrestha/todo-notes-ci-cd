const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function loginLocal(access, refresh) {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function logoutLocal() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isAuthenticated() {
  return !!getAccessToken();
}
