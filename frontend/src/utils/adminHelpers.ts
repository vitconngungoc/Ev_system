// Admin-specific utilities
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  USER: 'USER',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    STAFF: 'Nhân viên',
    USER: 'Người dùng',
  };
  return labels[role] || role;
};

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BANNED: 'BANNED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
} as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

export const getUserStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    ACTIVE: 'Hoạt động',
    INACTIVE: 'Không hoạt động',
    BANNED: 'Đã khóa',
    PENDING_VERIFICATION: 'Chờ xác minh',
  };
  return labels[status] || status;
};

export const getUserStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    BANNED: 'bg-red-100 text-red-800',
    PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const formatStatistics = (value: number, type: 'currency' | 'number' | 'percentage'): string => {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'number':
    default:
      return new Intl.NumberFormat('vi-VN').format(value);
  }
};

export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};
