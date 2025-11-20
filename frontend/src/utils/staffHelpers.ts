// Staff-specific utilities for vehicle operations
export const VEHICLE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RENTED: 'RENTED',
  MAINTENANCE: 'MAINTENANCE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
} as const;

export type VehicleStatus = typeof VEHICLE_STATUS[keyof typeof VEHICLE_STATUS];

export const getVehicleStatusLabel = (status: string): string => {
  switch (status) {
    case VEHICLE_STATUS.AVAILABLE:
      return 'Có sẵn';
    case VEHICLE_STATUS.RENTED:
      return 'Đang cho thuê';
    case VEHICLE_STATUS.MAINTENANCE:
      return 'Đang bảo trì';
    case VEHICLE_STATUS.OUT_OF_SERVICE:
      return 'Ngừng hoạt động';
    default:
      return status;
  }
};

export const getVehicleStatusColor = (status: string): string => {
  switch (status) {
    case VEHICLE_STATUS.AVAILABLE:
      return 'bg-green-100 text-green-800';
    case VEHICLE_STATUS.RENTED:
      return 'bg-blue-100 text-blue-800';
    case VEHICLE_STATUS.MAINTENANCE:
      return 'bg-yellow-100 text-yellow-800';
    case VEHICLE_STATUS.OUT_OF_SERVICE:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const CHECK_IN_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  ISSUES_FOUND: 'ISSUES_FOUND',
} as const;

export type CheckInStatus = typeof CHECK_IN_STATUS[keyof typeof CHECK_IN_STATUS];

export const CHECK_OUT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  DAMAGES_REPORTED: 'DAMAGES_REPORTED',
} as const;

export type CheckOutStatus = typeof CHECK_OUT_STATUS[keyof typeof CHECK_OUT_STATUS];

export const formatCheckInTime = (date: Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const calculateOdometer = (start: number, end: number): number => {
  return end - start;
};

export const validateOdometer = (reading: number): boolean => {
  return reading >= 0 && reading <= 999999 && Number.isFinite(reading);
};

export const validateFuelLevel = (level: number): boolean => {
  return level >= 0 && level <= 100 && Number.isFinite(level);
};
