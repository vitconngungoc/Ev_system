// Form validation utilities

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: Record<string, string> = {};
  
  if (password.length < 8) {
    errors.length = "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    errors.uppercase = "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    errors.lowercase = "Password must contain at least one lowercase letter";
  }
  if (!/\d/.test(password)) {
    errors.number = "Password must contain at least one number";
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.special = "Password must contain at least one special character";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim() === "") {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateMinLength = (
  value: string,
  minLength: number,
  fieldName: string
): string | null => {
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return null;
};

export const validateMaxLength = (
  value: string,
  maxLength: number,
  fieldName: string
): string | null => {
  if (value.length > maxLength) {
    return `${fieldName} must not exceed ${maxLength} characters`;
  }
  return null;
};

export const validateCreditCard = (cardNumber: string): boolean => {
  // Luhn algorithm
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ((value: any) => string | null)[]>
): ValidationResult => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach((field) => {
    const value = data[field];
    const fieldRules = rules[field];

    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
