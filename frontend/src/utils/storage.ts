import { AUTH_TOKEN_KEY, USER_DATA_KEY } from '../constants/auth.constants';
import { User } from '../types/auth.types';

export const saveAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const saveUser = (user: User): void => {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
};

export const getUser = (): User | null => {
  const userData = localStorage.getItem(USER_DATA_KEY);
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
};

export const removeUser = (): void => {
  localStorage.removeItem(USER_DATA_KEY);
};

export const clearAuthData = (): void => {
  removeAuthToken();
  removeUser();
  sessionStorage.clear();
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};
