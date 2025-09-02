import axios from 'axios';
import { getAuthToken } from '@/lib/auth';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050';
export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

