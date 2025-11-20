// Date and time utilities for booking
export const formatBookingDate = (date: string): string => {
  try {
    return new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return date;
  }
};

export const formatBookingTime = (date: string): string => {
  try {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date;
  }
};

export const formatBookingDateTime = (date: string): string => {
  return `${formatBookingDate(date)} ${formatBookingTime(date)}`;
};

export const calculateBookingDuration = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)); // hours
};

export const formatDuration = (hours: number): string => {
  if (hours < 24) {
    return `${hours} giờ`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) {
    return `${days} ngày`;
  }
  return `${days} ngày ${remainingHours} giờ`;
};

export const isBookingActive = (startDate: string, endDate: string): boolean => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
};

export const isBookingUpcoming = (startDate: string): boolean => {
  const now = new Date();
  const start = new Date(startDate);
  return start > now;
};

export const isBookingPast = (endDate: string): boolean => {
  const now = new Date();
  const end = new Date(endDate);
  return end < now;
};
