// Authentication constants
export const AUTH_TOKEN_KEY = 'authToken';
export const USER_DATA_KEY = 'user';
export const REDIRECT_FLAG_KEY = 'isRedirecting';

// Password requirements
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_REQUIREMENTS = {
  minLength: 6,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

// Cancellation limits
export const MAX_CANCELLATION_COUNT = 3;
export const CANCELLATION_WARNING_THRESHOLD = 2;

// Session timeout (in milliseconds)
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// OTP settings
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 5;

// Form validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Phone number format is invalid',
  WEAK_PASSWORD: 'Password must contain uppercase, lowercase, number and special character',
  PASSWORD_MISMATCH: 'Passwords do not match',
  TERMS_REQUIRED: 'You must agree to the terms of service',
};

// API response messages
export const API_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back!',
  LOGIN_FAILED: 'Login failed. Please check your credentials',
  REGISTER_SUCCESS: 'Registration successful! Please login',
  REGISTER_FAILED: 'Registration failed. Please try again',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  OTP_SENT: 'OTP has been sent to your email',
  NETWORK_ERROR: 'Network error. Please check your connection',
};
