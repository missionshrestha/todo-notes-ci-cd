import axios from "axios";
import { getAccessToken } from "../features/auth/useAuth";

const baseURL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const api = axios.create({ baseURL });

// Attach token if present
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  return config;
});

// In 2.2 we'll add response interceptor (401 handling/redirect)
