// Route paths
export const ROUTES = {
  HOME: 'home',
  LOGIN: 'login',
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgot-password',
  PROFILE: 'profile',
  STATIONS: 'stations',
  VEHICLES: 'vehicles',
  VEHICLE_DETAIL: 'vehicle-detail',
  BOOKING_HISTORY: 'booking-history',
  PAYMENT: 'payment',
  RATING: 'rating',
  STAFF_DASHBOARD: 'staff-dashboard',
  ADMIN_DASHBOARD: 'admin-dashboard',
  TERMS_OF_SERVICE: 'terms-of-service',
  PRIVACY_POLICY: 'privacy-policy',
} as const;

// User roles
export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  STATION_STAFF: 'STATION_STAFF',
  ADMIN: 'ADMIN',
  EV_ADMIN: 'EV_ADMIN',
} as const;

// Role IDs
export const ROLE_IDS = {
  CUSTOMER: 1,
  STATION_STAFF: 2,
  ADMIN: 3,
} as const;

// Verification status
export const VERIFICATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

// User status
export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type Route = typeof ROUTES[keyof typeof ROUTES];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type VerificationStatus = typeof VERIFICATION_STATUS[keyof typeof VERIFICATION_STATUS];
export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];
