// Admin-specific utilities
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  USER: 'USER',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const getRoleLabel = (role: string): string => {
  switch (role) {
    case USER_ROLES.ADMIN:
      return 'Quản trị viên';
    case USER_ROLES.STAFF:
      return 'Nhân viên';
    case USER_ROLES.USER:
      return 'Người dùng';
    default:
      return role;
  }
};

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BANNED: 'BANNED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
} as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

export const getUserStatusLabel = (status: string): string => {
  switch (status) {
    case USER_STATUS.ACTIVE:
      return 'Hoạt động';
    case USER_STATUS.INACTIVE:
      return 'Không hoạt động';
    case USER_STATUS.BANNED:
      return 'Đã khóa';
    case USER_STATUS.PENDING_VERIFICATION:
      return 'Chờ xác minh';
    default:
      return status;
  }
};

export const getUserStatusColor = (status: string): string => {
  switch (status) {
    case USER_STATUS.ACTIVE:
      return 'bg-green-100 text-green-800';
    case USER_STATUS.INACTIVE:
      return 'bg-gray-100 text-gray-800';
    case USER_STATUS.BANNED:
      return 'bg-red-100 text-red-800';
    case USER_STATUS.PENDING_VERIFICATION:
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
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
