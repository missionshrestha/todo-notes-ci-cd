import axios from "axios";
import { API_BASE } from "../../api/client.js";

// POST /api/auth/token/ -> { access, refresh }
export async function loginRequest(username, password) {
  const url = API_BASE + "/auth/token/";
  const { data } = await axios.post(url, { username, password });
  return data; // { access, refresh }
}

// POST /api/auth/refresh/ -> { access }
export async function refreshRequest(refresh) {
  const url = API_BASE + "/auth/refresh/";
  const { data } = await axios.post(url, { refresh });
  return data; // { access }
}
