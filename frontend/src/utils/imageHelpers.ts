// Image handling utilities
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Chỉ chấp nhận file ảnh JPG, PNG, hoặc WebP' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Kích thước ảnh không được vượt quá 5MB' };
  }

  return { valid: true };
};
