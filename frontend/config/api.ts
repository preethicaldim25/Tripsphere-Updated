import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../get_urls';

/**
 * Axios instance for API calls.
 * Uses the dynamic API_URL from get_urls.ts
 */
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add JWT token and ngrok bypass
api.interceptors.request.use(
  async (config) => {
    try {
      // 1. Add Auth Token
      const token = await AsyncStorage.getItem('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 2. Add Ngrok Bypass Headers (if using ngrok)
      if (config.baseURL?.includes('ngrok')) {
        config.headers['ngrok-skip-browser-warning'] = 'true';
        config.headers['Bypass-Tunnel-Reminder'] = 'true';
      }
    } catch (error) {
      console.error('[API] Interceptor error:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] Unauthorized (401) - User might need to login again');
    }
    return Promise.reject(error);
  }
);

export default api;
