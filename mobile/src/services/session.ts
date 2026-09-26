import { Preferences } from '@capacitor/preferences';
import type { User } from '../types/user';

// Claves con las que se guarda la sesión en Capacitor Preferences
const TOKEN_KEY = 'access_token';
const USER_KEY = 'user';

export const getToken = async (): Promise<string | null> => {
  const { value } = await Preferences.get({ key: TOKEN_KEY });
  return value;
};

export const getUser = async (): Promise<User | null> => {
  const { value } = await Preferences.get({ key: USER_KEY });
  if (!value) return null;
  try {
    return JSON.parse(value) as User;
  } catch {
    return null;
  }
};

export const saveToken = (token: string) =>
  Preferences.set({ key: TOKEN_KEY, value: token });

export const saveUser = (user: User) =>
  Preferences.set({ key: USER_KEY, value: JSON.stringify(user) });

export const clearSession = async () => {
  await Preferences.remove({ key: TOKEN_KEY });
  await Preferences.remove({ key: USER_KEY });
};
