import axios from "axios";
import { store } from "../redux/store.js";
import { logoutSuccess, authSuccess } from "../redux/slices/authSlice.js";

// Dynamic Base URL Selection:
// - Local Dev (import.meta.env.DEV is true): Automatically hits local port 5001 backend.
// - Live Prod (import.meta.env.DEV is false): Hits VITE_API_URL env variable or live Render server URL.
const getBaseURL = () => {
  if (import.meta.env.DEV) {
    return "http://localhost:5001/api/v1";
  }
  let url =
    import.meta.env.VITE_API_URL || "https://pariwesh.onrender.com/api/v1";
  // Safely ensure the URL always ends with /api/v1
  if (url && !url.endsWith("/api/v1") && !url.endsWith("/api/v1/")) {
    url = url.endsWith("/") ? url.slice(0, -1) : url;
    url = `${url}/api/v1`;
  }
  return url;
};

const BASE_URL = getBaseURL();

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Crucial for refresh cookies
});

// Request Interceptor: Attach access token
API.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Handle key expirations and token rotations
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and request has not been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Request token refresh
        const res = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true },
        );

        const { token, user } = res.data.data;

        // Update credentials inside Redux state
        store.dispatch(authSuccess({ token, user }));

        // Re-execute past failing promise
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return API(originalRequest);
      } catch (refreshError) {
        // If refresh fails, signout user
        store.dispatch(logoutSuccess());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default API;
