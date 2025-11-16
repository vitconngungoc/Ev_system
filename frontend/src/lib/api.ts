// API Configuration
const DEFAULT_API_BASE_URL = 'http://localhost:8080/api';
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || DEFAULT_API_BASE_URL;

const deriveFileBaseUrl = (apiUrl: string): string => {
  try {
    const url = new URL(apiUrl);
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length && segments[segments.length - 1].toLowerCase() === 'api') {
      segments.pop();
    }
    const normalizedPath = segments.length ? `/${segments.join('/')}` : '';
    return `${url.origin}${normalizedPath}`;
  } catch {
    return apiUrl.replace(/\/api\/?$/i, '');
  }
};

export const FILE_BASE_URL = deriveFileBaseUrl(API_BASE_URL);

const joinUrl = (base: string, path: string): string => {
  const normalizedBase = base.replace(/\/+$/g, '');
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedPath}`;
};

export const resolveAssetUrl = (rawPath?: string | null): string | null => {
  if (rawPath === null || rawPath === undefined) {
    return null;
  }

  const path = String(rawPath).trim();
  if (!path) {
    return null;
  }

  if (/^(?:https?|data|blob):/i.test(path)) {
    return path;
  }

  if (path.startsWith('//')) {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    return `${protocol}${path}`;
  }

  if (path.startsWith('/uploads') || path.startsWith('uploads/')) {
    return joinUrl(FILE_BASE_URL, path);
  }

  if (path.startsWith('/')) {
    return joinUrl(API_BASE_URL, path);
  }

  return joinUrl(API_BASE_URL, path);
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  GOOGLE_LOGIN: '/auth/google',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',

  // Profile
  PROFILE_ME: '/profile/me',
  PROFILE_UPDATE: '/profile/update',
  PROFILE_VERIFICATION_UPLOAD: '/profile/verification/upload',
  PROFILE_VERIFICATION_STATUS: '/profile/verification/status',
  PROFILE_ROLE: '/profile/role',

  // Stations (public)
  STATIONS: '/stations',
  STATION_DETAIL: (id: number | string) => `/stations/${id}`,
  STATION_MODELS: (stationId: number | string) => `/stations/${stationId}/models`,
  STATION_SEARCH_AVAILABLE: (stationId: number | string) => `/stations/${stationId}/models/search`,
  MODELS: '/stations/models',
  MODEL_DETAIL: (modelId: number | string) => `/stations/models/${modelId}`,
  // Get vehicles by station and model
  STATION_MODEL_VEHICLES: (stationId: number | string, modelId: number | string) => 
    `/stations/${stationId}/models/${modelId}/vehicles`,
  // Check if a specific vehicle is available for booking
  VEHICLE_AVAILABILITY: (
    vehicleId: number | string,
    startTime: string,
    endTime: string
  ) => {
    const params = new URLSearchParams({ startTime, endTime });
    return `/vehicles/${vehicleId}/availability?${params.toString()}`;
  },
  MODELS_AVAILABILITY: (
    stationId: number | string,
    modelId: number | string,
    startTime: string,
    endTime: string
  ) => {
    const params = new URLSearchParams({ startTime, endTime });
    return `/stations/${stationId}/models/${modelId}/availability?${params.toString()}`;
  },
  STATION_ADD_RATING: '/stations/rating',
  STATION_RATINGS: (stationId: number | string) => `/stations/rating/${stationId}`,
  STATION_RATING_AVERAGE: (stationId: number | string) => `/stations/rating/${stationId}/average`,

  // Vehicles & reports
  VEHICLE_STATS_BY_STATION: (stationId: number | string) => `/vehicles/station/${stationId}/stats`,
  VEHICLE_STATION_REPORTS: '/vehicles/stations/report',

  // Bookings & renter utilities
  BOOKINGS: '/bookings',
  BOOKING_DETAIL: (id: number | string) => `/bookings/${id}`,
  RENTER_MY_BOOKINGS: '/renter/my-bookings',
  RENTER_CANCEL_BOOKING: (bookingId: number | string) => `/renter/bookings/${bookingId}/cancel`,

  // Admin
  ADMIN_STATIONS: '/admin/stations',
  ADMIN_STATION_DETAIL: (id: number | string) => `/admin/stations/${id}`,
  ADMIN_VEHICLES: '/admin/vehicles',
  ADMIN_VEHICLE_DETAIL: (id: number | string) => `/admin/vehicles/${id}`,
  ADMIN_MODELS: '/admin/models',
  ADMIN_MODEL_DETAIL: (id: number | string) => `/admin/models/${id}`,
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAIL: (id: number | string) => `/admin/users/${id}`,
  ADMIN_USER_STATUS: (userId: number | string, status: string) =>
    `/admin/users/${userId}/status?status=${encodeURIComponent(status)}`,
  ADMIN_USER_ROLE: (id: number | string) => `/admin/users/${id}/role`,
  ADMIN_USER_UNLOCK: (id: number | string) => `/admin/users/${id}/unlock`,
  ADMIN_USER_STATION: (userId: number | string, stationId: number | string) => `/admin/${userId}/station/${stationId}`,
  ADMIN_STAFF_BY_STATION: (stationId: number | string) => `/admin/staff/station/${stationId}`,
  ADMIN_REVENUE: '/admin/revenue',
  ADMIN_STATIONS_REPORT: '/admin/stations/report', // Vehicle stats by station
  ADMIN_PEAK_HOUR_STATS: '/admin/statistics/peak-hour',
  ADMIN_VEHICLE_HISTORY: '/admin/vehicle-history',
  ADMIN_HISTORY_VEHICLE: (vehicleId: number | string) => `/admin/vehicle-history/vehicle/${vehicleId}`,
  ADMIN_HISTORY_RENTER: (renterId: number | string) => `/admin/vehicle-history/renter/${renterId}`,
  ADMIN_HISTORY_STATION: (stationId: number | string) => {
    const params = new URLSearchParams({ stationId: String(stationId) });
    return `/admin/vehicle-history?${params.toString()}`;
  },

  // Staff
  STAFF_DASHBOARD: '/staff/dashboard',
  STAFF_BOOKINGS: (params: StaffBookingSearchParams = {}) => {
    const query = new URLSearchParams();

    if (params.keyword) {
      query.append('keyword', params.keyword);
    }
    if (params.status) {
      query.append('status', params.status);
    }
    if (params.date) {
      query.append('date', params.date);
    }

    const queryString = query.toString();
    return `/staff/bookings${queryString ? `?${queryString}` : ''}`;
  },
  STAFF_CONFIRM_DEPOSIT: (bookingId: number | string) => `/staff/bookings/${bookingId}/confirm-deposit`,
  STAFF_INITIATE_CHECKIN: (bookingId: number | string) => `/staff/rentals/initiate-check-in/${bookingId}`,
  STAFF_CHECKIN: (bookingId: number | string) => `/staff/rentals/check-in/${bookingId}`,
  STAFF_CONTRACTS: '/staff/contracts',
  STAFF_VERIFICATIONS_PENDING: '/staff/verifications/pending',
  STAFF_VERIFICATIONS_ALL: '/admin/users', // Sử dụng admin API để lấy tất cả users với filter
  STAFF_PROCESS_VERIFICATION: (userId: number | string) => `/staff/verifications/${userId}/process`,
  STAFF_PENALTY_FEES: '/staff/penalty-fees',
  STAFF_INVOICES: '/staff/invoices',
  STAFF_STATION_VEHICLES: '/staff/my-station/vehicles',
  STAFF_UPDATE_VEHICLE: (vehicleId: number | string) => `/staff/vehicles/${vehicleId}/details`,
  STAFF_REPORT_DAMAGE: (vehicleId: number | string) => `/staff/vehicles/${vehicleId}/report-damage`,
  STAFF_CALCULATE_BILL: (bookingId: number | string) => `/staff/bookings/${bookingId}/calculate-bill`,
  STAFF_CONFIRM_PAYMENT: (bookingId: number | string) => `/staff/bookings/${bookingId}/confirm-payment`,
  STAFF_CANCEL_BOOKING: (bookingId: number | string) => `/staff/bookings/${bookingId}/cancel`,
  STAFF_REFUND_REQUESTS: '/staff/refund-requests',
  STAFF_CONFIRM_REFUND: (bookingId: number | string) => `/staff/bookings/${bookingId}/confirm-refund`,
};

export interface StaffBookingSearchParams {
  keyword?: string;
  status?: string;
  date?: string;
}

// Helper function to make API calls
export async function apiCall<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (response.status === 204) {
      return null as T;
    }

    const rawText = await response.text();
    let data: any = null;

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = rawText;
      }
    }

    if (!response.ok) {
      // Handle authentication/authorization errors
      if (response.status === 401 || response.status === 403) {
        // Check if this is a request with authentication token
        const hasAuthHeader = options?.headers && 'Authorization' in (options.headers as Record<string, string>);
        const isLoginEndpoint = endpoint.includes('/login') || endpoint.includes('/register');
        const isPublicEndpoint = endpoint.includes('/stations') && !endpoint.includes('/staff') && !endpoint.includes('/admin');
        
        // Only clear session if:
        // 1. Has auth header (authenticated request)
        // 2. NOT a login attempt
        // 3. NOT a public endpoint (stations, ratings, etc)
        if (hasAuthHeader && !isLoginEndpoint && !isPublicEndpoint) {
          console.warn('🔒 Auth token invalid or expired, clearing session...');
          
          // Clear invalid token from localStorage
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('token'); // Legacy key
          localStorage.removeItem('role'); // Legacy key
          
          // Show toast notification
          const message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            // Delay redirect to show the error message
            setTimeout(() => {
              window.location.href = '/login';
            }, 1500);
          }
          
          throw new Error(message);
        }
        
        // For public endpoints or login attempts, just throw the error without clearing session
      }

      let message = 'API request failed';

      if (data && typeof data === 'object') {
        const record = data as Record<string, unknown>;
        const explicitMessage = record.message;

        if (typeof explicitMessage === 'string' && explicitMessage.trim().length > 0) {
          message = explicitMessage.trim();
        } else {
          const candidate = Object.values(record).find(
            (value): value is string => typeof value === 'string' && value.trim().length > 0
          );

          if (candidate) {
            message = candidate.trim();
          }
        }
      } else if (typeof data === 'string' && data.trim().length > 0) {
        message = data.trim();
      }

      const error = new Error(message);
      (error as Error & { data?: unknown }).data = data;
      throw error;
    }

    return data as T;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Không thể kết nối đến server tại ${API_BASE_URL}. Vui lòng đảm bảo backend đang chạy.`);
    }
    throw error;
  }
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


type PrimitiveFormValue = File | Blob | FileList | string | number | boolean;
type FormValue = PrimitiveFormValue | PrimitiveFormValue[] | null | undefined;

// Helper for form data upload (files + fields)
export async function uploadFiles(
  endpoint: string,
  token: string,
  formEntries: Record<string, FormValue>,
  method: 'POST' | 'PUT' = 'POST'
): Promise<any> {
  const formData = new FormData();

  Object.entries(formEntries).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    const appendValue = (entryKey: string, entryValue: PrimitiveFormValue) => {
      if (entryValue === null || entryValue === undefined) {
        return;
      }

      if (entryValue instanceof FileList) {
        Array.from(entryValue).forEach((file) => formData.append(entryKey, file));
        return;
      }

      if (entryValue instanceof Blob) {
        formData.append(entryKey, entryValue);
        return;
      }

      formData.append(entryKey, String(entryValue));
    };

    if (Array.isArray(value)) {
      value.forEach((item) => appendValue(key, item));
      return;
    }

    appendValue(key, value);
  });

  // Debug FormData
  console.log('📤 FormData entries:');
  for (const [key, value] of formData.entries()) {
    console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (response.status === 204) {
    return null;
  }

  const rawText = await response.text();
  let data: any = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  if (!response.ok) {
    const message = typeof data === 'object' && data?.message
      ? data.message
      : 'Upload failed';
    throw new Error(message);
  }

  return data;
}
