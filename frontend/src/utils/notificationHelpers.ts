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
  switch (type) {
    case NOTIFICATION_TYPES.INFO:
      return '📢';
    case NOTIFICATION_TYPES.SUCCESS:
      return '✅';
    case NOTIFICATION_TYPES.WARNING:
      return '⚠️';
    case NOTIFICATION_TYPES.ERROR:
      return '❌';
    default:
      return '📢';
  }
};

export const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case NOTIFICATION_TYPES.INFO:
      return 'bg-blue-500';
    case NOTIFICATION_TYPES.SUCCESS:
      return 'bg-green-500';
    case NOTIFICATION_TYPES.WARNING:
      return 'bg-yellow-500';
    case NOTIFICATION_TYPES.ERROR:
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
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
  switch (template) {
    case EMAIL_TEMPLATES.BOOKING_CONFIRMATION:
      return `[EV Rental] Xác nhận đặt xe #${data?.bookingId || ''}`;
    case EMAIL_TEMPLATES.PAYMENT_RECEIVED:
      return '[EV Rental] Thanh toán thành công';
    case EMAIL_TEMPLATES.CHECK_IN_REMINDER:
      return '[EV Rental] Nhắc nhở nhận xe';
    case EMAIL_TEMPLATES.CHECK_OUT_REMINDER:
      return '[EV Rental] Nhắc nhở trả xe';
    case EMAIL_TEMPLATES.BOOKING_CANCELLED:
      return '[EV Rental] Đơn đặt xe đã bị hủy';
    case EMAIL_TEMPLATES.PASSWORD_RESET:
      return '[EV Rental] Đặt lại mật khẩu';
    case EMAIL_TEMPLATES.VERIFICATION:
      return '[EV Rental] Xác minh tài khoản';
    default:
      return '[EV Rental] Thông báo';
  }
};

export const shouldSendPushNotification = (type: NotificationType): boolean => {
  return type === NOTIFICATION_TYPES.WARNING || type === NOTIFICATION_TYPES.ERROR;
};
