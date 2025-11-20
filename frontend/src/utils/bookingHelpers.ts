// Booking status utilities
export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  IN_PROGRESS: 'IN_PROGRESS',
} as const;

export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];

export const getBookingStatusColor = (status: string): string => {
  switch (status) {
    case BOOKING_STATUS.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case BOOKING_STATUS.CONFIRMED:
      return 'bg-blue-100 text-blue-800';
    case BOOKING_STATUS.CANCELLED:
      return 'bg-red-100 text-red-800';
    case BOOKING_STATUS.COMPLETED:
      return 'bg-green-100 text-green-800';
    case BOOKING_STATUS.IN_PROGRESS:
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getBookingStatusLabel = (status: string): string => {
  switch (status) {
    case BOOKING_STATUS.PENDING:
      return 'Chờ xác nhận';
    case BOOKING_STATUS.CONFIRMED:
      return 'Đã xác nhận';
    case BOOKING_STATUS.CANCELLED:
      return 'Đã hủy';
    case BOOKING_STATUS.COMPLETED:
      return 'Hoàn thành';
    case BOOKING_STATUS.IN_PROGRESS:
      return 'Đang thuê';
    default:
      return status;
  }
};

export const canCancelBooking = (status: string): boolean => {
  return status === BOOKING_STATUS.PENDING || status === BOOKING_STATUS.CONFIRMED;
};
