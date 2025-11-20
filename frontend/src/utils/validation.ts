export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^(84|0[35789])[0-9]{8}$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, message: 'Invalid email format' };
  }
  return { isValid: true };
};

export const validatePhone = (phone: string): ValidationResult => {
  if (!phone) {
    return { isValid: false, message: 'Phone number is required' };
  }
  if (!PHONE_REGEX.test(phone.trim())) {
    return { isValid: false, message: 'Invalid phone number format' };
  }
  return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters' };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain uppercase, lowercase, number and special character' 
    };
  }
  return { isValid: true };
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, message: 'Please confirm your password' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, message: 'Passwords do not match' };
  }
  return { isValid: true };
};

export const validateFullName = (fullName: string): ValidationResult => {
  if (!fullName) {
    return { isValid: false, message: 'Full name is required' };
  }
  if (fullName.trim().length < 2) {
    return { isValid: false, message: 'Full name must be at least 2 characters' };
  }
  return { isValid: true };
};
