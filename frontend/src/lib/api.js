import axios from 'axios';

// Support both VITE_API_URL and VITE_API_BASE for backward compatibility
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Send cookies with requests
});

// Export API_BASE for use in OAuth links and other direct URL needs
export { API_BASE };

// Token refresh flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    // Only try to refresh if it's NOT the /me endpoint (which uses validateStatus to handle 401s)
    // and if we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh on /api/auth/me - that's handled with validateStatus
      // Also don't try to refresh the refresh endpoint itself
      const requestPath = originalRequest.url || '';
      if (requestPath.includes('/api/auth/me') || 
          requestPath.includes('/auth/me') ||
          requestPath.includes('/api/auth/refresh') ||
          requestPath.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Retry original request (cookies are now updated)
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        // Tokens are set in httpOnly cookies by the server
        await axios.post(`${API_BASE}/api/auth/refresh`, {}, {
          withCredentials: true,
        });
        
        processQueue(null, null); // No token needed, cookies are set
        isRefreshing = false;
        
        // Retry original request (cookies are now updated)
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Refresh failed - user needs to log in again
        // Don't redirect automatically - let the component handle it
        // This prevents redirect loops
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Request interceptor
api.interceptors.request.use((config) => {
  // Cookies are automatically sent with withCredentials: true
  return config;
});

export function setAuth(token) {
  // With cookie-based auth, we don't need to store tokens in localStorage
  // Cookies are managed by the browser
  // This function is kept for backward compatibility but mainly clears state
  if (!token) {
    // Clear any remaining localStorage tokens (cleanup)
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  }
  // Note: We can't manually set httpOnly cookies from JavaScript
  // They're set by the server
}
