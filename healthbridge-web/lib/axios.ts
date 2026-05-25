import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "./config";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 12000,
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Attach JWT access token from cookie to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get("hb_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor ─────────────────────────────────────────────────────
// On 401: clear session and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== "undefined" && err.response?.status === 401) {
      Cookies.remove("hb_token");
      Cookies.remove("hb_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
