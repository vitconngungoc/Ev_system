// API constants and configuration

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  LOGOUT: "/auth/logout",
  REFRESH_TOKEN: "/auth/refresh",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",

  // Users
  USERS: "/users",
  USER_PROFILE: "/users/profile",
  USER_BOOKINGS: "/users/bookings",

  // Vehicles
  VEHICLES: "/vehicles",
  VEHICLE_DETAIL: (id: string) => `/vehicles/${id}`,
  VEHICLE_AVAILABILITY: (id: string) => `/vehicles/${id}/availability`,

  // Bookings
  BOOKINGS: "/bookings",
  BOOKING_DETAIL: (id: string) => `/bookings/${id}`,
  BOOKING_CANCEL: (id: string) => `/bookings/${id}/cancel`,

  // Payments
  PAYMENTS: "/payments",
  PAYMENT_PROCESS: "/payments/process",
  PAYMENT_HISTORY: "/payments/history",

  // Stations
  STATIONS: "/stations",
  STATION_DETAIL: (id: string) => `/stations/${id}`,

  // Reviews
  REVIEWS: "/reviews",
  VEHICLE_REVIEWS: (vehicleId: string) => `/reviews/vehicle/${vehicleId}`,

  // Admin
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_USERS: "/admin/users",
  ADMIN_VEHICLES: "/admin/vehicles",
  ADMIN_BOOKINGS: "/admin/bookings",

  // Staff
  STAFF_BOOKINGS: "/staff/bookings",
  STAFF_VEHICLES: "/staff/vehicles",
  STAFF_VERIFICATIONS: "/staff/verifications",
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const REQUEST_TIMEOUT = 30000; // 30 seconds

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
};
