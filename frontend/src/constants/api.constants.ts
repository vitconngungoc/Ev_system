// API endpoints and configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE: '/users/update',
    CHANGE_PASSWORD: '/users/change-password',
  },
  VEHICLES: {
    LIST: '/vehicles',
    DETAIL: '/vehicles/:id',
    SEARCH: '/vehicles/search',
  },
  BOOKINGS: {
    CREATE: '/bookings',
    LIST: '/bookings',
    DETAIL: '/bookings/:id',
    CANCEL: '/bookings/:id/cancel',
  },
  PAYMENTS: {
    CREATE: '/payments',
    VERIFY: '/payments/verify',
  },
  STATIONS: {
    LIST: '/stations',
    DETAIL: '/stations/:id',
  },
} as const;

export const API_TIMEOUT = 30000; // 30 seconds
