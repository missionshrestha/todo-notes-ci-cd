import axios from "axios";
import { getAccessToken, getRefreshToken, loginLocal, logoutLocal } from "../features/auth/useAuth.js";

// ---- Base URL from ENV (sanitize trailing slash) ----
const baseURL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// ---- Axios instance ----
export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: false, // we use localStorage tokens, not cookies
});

// ---- Request: attach Authorization if token exists ----
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }
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
        // No refresh token -> logout
        logoutLocal();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If a refresh is in flight, just logout to keep logic simple
        logoutLocal();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        isRefreshing = true;
        config._retry = true;

        // POST /api/auth/refresh/ expects {refresh} and returns {access}
        const url = baseURL + "/auth/refresh/";
        const { data } = await axios.post(url, { refresh });

        if (data?.access) {
          // Save new access, keep the same refresh
          loginLocal(data.access, refresh);

          // Retry the original request with the new token
          const retryCfg = { ...config };
          retryCfg.headers = { ...retryCfg.headers, Authorization: `Bearer ${data.access}` };
          return api.request(retryCfg);
        } else {
          // Unexpected shape -> logout
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
