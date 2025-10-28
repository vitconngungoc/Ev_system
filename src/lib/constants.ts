// App Configuration Constants

// Rental Rules
export const RENTAL_RULES = {
  MIN_RENTAL_HOURS: 8,
  DEPOSIT_RATE: 0.1, // 10%
  LATE_FEE_MULTIPLIER: 1.5, // 150%
};

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 5,
  ALLOWED_TYPES: ['image/jpeg', 'image/png'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png'],
};

// OTP
export const OTP = {
  LENGTH: 6,
  EXPIRY_MINUTES: 1,
};

// Token
export const AUTH = {
  TOKEN_EXPIRY_HOURS: 2,
};

// Vehicle Status
export const VEHICLE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RENTED: 'RENTED',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  RENTING: 'RENTING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

// Verification Status
export const VERIFICATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

// Account Status
export const ACCOUNT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BANNED: 'BANNED',
} as const;

// Vehicle Condition
export const VEHICLE_CONDITION = {
  EXCELLENT: 'EXCELLENT',
  GOOD: 'GOOD',
  MINOR_DAMAGE: 'MINOR_DAMAGE',
  MAINTENANCE_REQUIRED: 'MAINTENANCE_REQUIRED',
} as const;

// Payment Methods
export const PAYMENT_METHOD = {
  QR: 'qr',
  COUNTER: 'counter',
} as const;

// Date Format
export const DATE_FORMAT = {
  DISPLAY: 'dd/MM/yyyy HH:mm',
  INPUT_DATE: 'yyyy-MM-dd',
  INPUT_TIME: 'HH:mm',
} as const;
