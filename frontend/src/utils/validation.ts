// Form validation utilities
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { valid: false, error: 'Email không được để trống' };
  if (!regex.test(email)) return { valid: false, error: 'Email không hợp lệ' };
  return { valid: true };
};

export const validatePhone = (phone: string): { valid: boolean; error?: string } => {
  const regex = /^(0|\+84)[0-9]{9}$/;
  if (!phone) return { valid: false, error: 'Số điện thoại không được để trống' };
  if (!regex.test(phone)) return { valid: false, error: 'Số điện thoại không hợp lệ' };
  return { valid: true };
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password) return { valid: false, error: 'Mật khẩu không được để trống' };
  if (password.length < 8) return { valid: false, error: 'Mật khẩu phải có ít nhất 8 ký tự' };
  if (!/[A-Z]/.test(password)) return { valid: false, error: 'Mật khẩu phải có ít nhất 1 chữ hoa' };
  if (!/[0-9]/.test(password)) return { valid: false, error: 'Mật khẩu phải có ít nhất 1 số' };
  return { valid: true };
};
