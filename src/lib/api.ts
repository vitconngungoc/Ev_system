// API Configuration
export const API_BASE_URL = 'http://localhost:8080/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  GOOGLE_LOGIN: '/auth/google',
  FORGOT_PASSWORD: '/auth/forgot-password',
  VERIFY_OTP: '/auth/verify-otp',
  RESET_PASSWORD: '/auth/reset-password',

  // Profile
  PROFILE_ME: '/profile/me',
  PROFILE_UPDATE: '/profile/update',
  PROFILE_VERIFICATION_UPLOAD: '/profile/verification/upload',
  PROFILE_VERIFICATION_STATUS: '/profile/verification/status',

  // Stations
  STATIONS: '/stations',
  STATION_DETAIL: (id: number) => `/stations/${id}`,

  // Vehicles
  VEHICLES: '/vehicles/search',
  VEHICLE_DETAIL: (id: number) => `/vehicles/${id}`,
  VEHICLES_BY_STATION: (stationId, sortBy = 'createdAt', order = 'desc') =>
  `/vehicles/search?stationId=${stationId}&sortBy=${sortBy}&order=${order}`,

  // Bookings
  BOOKINGS: '/bookings',
  BOOKING_DETAIL: (id: number) => `/bookings/${id}`,
  BOOKING_PAY_DEPOSIT: (id: number) => `/bookings/${id}/pay-deposit`,
};

// Helper function to make API calls
export async function apiCall<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// Helper for authenticated API calls
export async function authenticatedApiCall<T = any>(
  endpoint: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  return apiCall<T>(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

// Helper for file upload
export async function uploadFiles(
  endpoint: string,
  token: string,
  files: Record<string, File>,
  additionalData?: Record<string, string>
): Promise<any> {
  const formData = new FormData();
  
  // Append files
  Object.entries(files).forEach(([key, file]) => {
    formData.append(key, file);
  });

  // Append additional data (e.g., cccdNumber, gplxNumber)
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Upload failed');
  }

  return data;
}
