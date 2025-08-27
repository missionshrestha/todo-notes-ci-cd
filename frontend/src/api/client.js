import axios from "axios";
import { getAccessToken, getRefreshToken, loginLocal, logoutLocal } from "../features/auth/useAuth.js";

// ---- Base URL from ENV (sanitize trailing slash) ----
export const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// ---- Axios instance ----
export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: false, // using localStorage tokens
});

// ---- Request: attach Authorization if token exists ----
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  return config;
});

// ---- Simple pub-sub for API error banner ----
function emitApiError(message) {
  const ev = new CustomEvent("api:error", { detail: { message } });
  window.dispatchEvent(ev);
}

// ---- Response: refresh-once then logout-on-401; show error banner for others ----
let isRefreshing = false;

api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const { config, response } = error;

    // Network error (no response)
    if (!response) {
      emitApiError("Network error. Check your connection or backend URL.");
      return Promise.reject(error);
    }

    const status = response.status;

    // Try refresh once on 401
    if (status === 401 && !config._retry) {
      const refresh = getRefreshToken();
      if (!refresh) {
        logoutLocal();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        logoutLocal();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        isRefreshing = true;
        config._retry = true;

        const url = API_BASE + "/auth/refresh/";
        const { data } = await axios.post(url, { refresh });

        if (data?.access) {
          loginLocal(data.access, refresh);
          const retryCfg = { ...config };
          retryCfg.headers = { ...retryCfg.headers, Authorization: `Bearer ${data.access}` };
          return api.request(retryCfg);
        } else {
          logoutLocal();
          window.location.href = "/login";
          return Promise.reject(error);
        }
      } catch (e) {
        logoutLocal();
        window.location.href = "/login";
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    // Other errors: emit a compact message
    const msg =
      response?.data?.detail ||
      response?.data?.message ||
      response?.statusText ||
      `Request failed with status ${status}`;
    emitApiError(msg);

    return Promise.reject(error);
  }
);
