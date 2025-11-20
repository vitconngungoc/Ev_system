// Authentication constants
export const AUTH_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
} as const;

export const TOKEN_KEY = 'auth_token';
export const USER_KEY = 'user_data';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])/;

export const PHONE_REGEX = /^(0|\+84)[0-9]{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
