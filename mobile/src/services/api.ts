import axios from 'axios';
import { getToken } from './session';
import { useAuthStore } from '../stores/auth';
import router from '../router';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Interceptor de petición: espera la lectura asíncrona del token en
// Capacitor Preferences y adjunta el header Authorization en un solo lugar
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuesta: si la API responde 401 el token ya no es válido,
// así que se cierra la sesión y se envía al usuario al login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url ?? '';
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isAuthRequest) {
      await useAuthStore().logout();
      if (router.currentRoute.value.path !== '/login') {
        await router.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
