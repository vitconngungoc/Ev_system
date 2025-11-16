// API Endpoints Configuration
const API_BASE_URL = 'http://localhost:8080';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
  },
  
  // User Profile
  PROFILE: {
    GET: `${API_BASE_URL}/api/profile`,
    UPDATE: `${API_BASE_URL}/api/profile`,
    UPLOAD_AVATAR: `${API_BASE_URL}/api/profile/avatar`,
  },
  
  // Vehicles
  VEHICLES: {
    LIST: `${API_BASE_URL}/api/vehicles`,
    SEARCH: `${API_BASE_URL}/api/vehicles/search`,
    DETAIL: (id: string) => `${API_BASE_URL}/api/vehicles/${id}`,
    AVAILABLE: `${API_BASE_URL}/api/vehicles/available`,
  },
  
  // Bookings
  BOOKINGS: {
    CREATE: `${API_BASE_URL}/api/bookings`,
    LIST: `${API_BASE_URL}/api/bookings`,
    DETAIL: (id: string) => `${API_BASE_URL}/api/bookings/${id}`,
    CANCEL: (id: string) => `${API_BASE_URL}/api/bookings/${id}/cancel`,
  },
  
  // Verification
  VERIFICATION: {
    UPLOAD: `${API_BASE_URL}/api/verification/upload`,
    STATUS: `${API_BASE_URL}/api/verification/status`,
  },
};

export default API_ENDPOINTS;
