import axios from "axios";

export const TOKEN_STORAGE_KEY = "obd-auth-token";
export const AUTH_INVALID_EVENT = "obd-auth-invalid";
const fallbackHost =
  typeof window !== "undefined" ? window.location.hostname || "localhost" : "localhost";
const fallbackProtocol =
  typeof window !== "undefined" && window.location.protocol === "https:" ? "https" : "http";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || `${fallbackProtocol}://${fallbackHost}:8080`
).replace(/\/$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(AUTH_INVALID_EVENT));
    }

    return Promise.reject(error);
  }
);

export function extractApiError(error) {
  if (error?.code === "ERR_NETWORK") {
    return `Не удаётся связаться с API (${API_BASE_URL}). Проверьте, что бэкенд запущен и адрес указан верно.`;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (typeof error?.response?.data === "string") {
    return error.response.data;
  }

  if (error?.message) {
    return error.message;
  }

  return "Что-то пошло не так. Попробуйте ещё раз.";
}

export function getWebSocketUrl(targetUserId, token) {
  const baseUrl = new URL(API_BASE_URL);
  const protocol = baseUrl.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${baseUrl.host}/ws/chat/${targetUserId}?token=${encodeURIComponent(token)}`;
}
