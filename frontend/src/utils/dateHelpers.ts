// Date and time utilities for bookings
export const formatBookingDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatBookingTime = (date: Date | string): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const calculateBookingDuration = (startDate: Date, endDate: Date): number => {
  const diff = endDate.getTime() - startDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const formatDuration = (days: number): string => {
  if (days === 1) return '1 ngày';
  return `${days} ngày`;
};

export const isBookingActive = (startDate: Date, endDate: Date): boolean => {
  const now = new Date();
  return now >= startDate && now <= endDate;
};

export const isBookingUpcoming = (startDate: Date): boolean => {
  return new Date() < startDate;
};

export const isBookingPast = (endDate: Date): boolean => {
  return new Date() > endDate;
};
