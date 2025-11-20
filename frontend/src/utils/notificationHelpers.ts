// Notification utilities
export const NOTIFICATION_TYPES = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

export interface NotificationOptions {
  title: string;
  message: string;
  type: NotificationType;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

export const getNotificationIcon = (type: NotificationType): string => {
  const icons: Record<string, string> = {
    INFO: '📢',
    SUCCESS: '✅',
    WARNING: '⚠️',
    ERROR: '❌',
  };
  return icons[type] || '📢';
};

export const getNotificationColor = (type: NotificationType): string => {
  const colors: Record<string, string> = {
    INFO: 'bg-blue-500',
    SUCCESS: 'bg-green-500',
    WARNING: 'bg-yellow-500',
    ERROR: 'bg-red-500',
  };
  return colors[type] || 'bg-gray-500';
};

export const EMAIL_TEMPLATES = {
  BOOKING_CONFIRMATION: 'BOOKING_CONFIRMATION',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  CHECK_IN_REMINDER: 'CHECK_IN_REMINDER',
  CHECK_OUT_REMINDER: 'CHECK_OUT_REMINDER',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  VERIFICATION: 'VERIFICATION',
} as const;

export type EmailTemplate = typeof EMAIL_TEMPLATES[keyof typeof EMAIL_TEMPLATES];

export const formatEmailSubject = (template: EmailTemplate, data?: Record<string, any>): string => {
  const subjects: Record<string, string> = {
    BOOKING_CONFIRMATION: `[EV Rental] Xác nhận đặt xe #${data?.bookingId || ''}`,
    PAYMENT_RECEIVED: '[EV Rental] Thanh toán thành công',
    CHECK_IN_REMINDER: '[EV Rental] Nhắc nhở nhận xe',
    CHECK_OUT_REMINDER: '[EV Rental] Nhắc nhở trả xe',
    BOOKING_CANCELLED: '[EV Rental] Đơn đặt xe đã bị hủy',
    PASSWORD_RESET: '[EV Rental] Đặt lại mật khẩu',
    VERIFICATION: '[EV Rental] Xác minh tài khoản',
  };
  return subjects[template] || '[EV Rental] Thông báo';
};

export const shouldSendPushNotification = (type: NotificationType): boolean => {
  return type === NOTIFICATION_TYPES.WARNING || type === NOTIFICATION_TYPES.ERROR;
};
