import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import api from '../services/api';
import * as session from '../services/session';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/user';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null);
  const user = ref<User | null>(null);

  // Preferences es asíncrono: guardamos la promesa de carga para que
  // el router (y cualquier otro) pueda esperarla antes de decidir.
  let loadPromise: Promise<void> | null = null;

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  function init() {
    if (!loadPromise) {
      loadPromise = (async () => {
        token.value = await session.getToken();
        user.value = await session.getUser();
      })();
    }
    return loadPromise;
  }

  async function setSession(newToken: string, newUser: User) {
    await session.saveToken(newToken);
    await session.saveUser(newUser);
    token.value = newToken;
    user.value = newUser;
  }

  async function login(credentials: LoginPayload) {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    await setSession(data.access_token, data.user);
  }

  async function register(payload: RegisterPayload) {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    await setSession(data.access_token, data.user);
  }

  async function logout() {
    await session.clearSession();
    token.value = null;
    user.value = null;
  }

  // Revalida el token contra la API y refresca los datos del usuario
  async function fetchMe() {
    await init();
    if (!token.value) return null;
    try {
      const { data } = await api.get<User>('/auth/me');
      user.value = data;
      await session.saveUser(data);
      return data;
    } catch {
      // Si el token ya no sirve, el interceptor de respuesta cierra la sesión
      return null;
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    init,
    login,
    register,
    logout,
    fetchMe,
  };
});
