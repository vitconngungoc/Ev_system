// Payment methods and utilities
export const PAYMENT_METHODS = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CREDIT_CARD: 'CREDIT_CARD',
  E_WALLET: 'E_WALLET',
  VNPAY: 'VNPAY',
  MOMO: 'MOMO',
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

export const getPaymentMethodLabel = (method: string): string => {
  switch (method) {
    case PAYMENT_METHODS.CASH:
      return 'Tiền mặt';
    case PAYMENT_METHODS.BANK_TRANSFER:
      return 'Chuyển khoản ngân hàng';
    case PAYMENT_METHODS.CREDIT_CARD:
      return 'Thẻ tín dụng';
    case PAYMENT_METHODS.E_WALLET:
      return 'Ví điện tử';
    case PAYMENT_METHODS.VNPAY:
      return 'VNPay';
    case PAYMENT_METHODS.MOMO:
      return 'MoMo';
    default:
      return method;
  }
};

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const getPaymentStatusColor = (status: string): string => {
  switch (status) {
    case PAYMENT_STATUS.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case PAYMENT_STATUS.PAID:
      return 'bg-green-100 text-green-800';
    case PAYMENT_STATUS.FAILED:
      return 'bg-red-100 text-red-800';
    case PAYMENT_STATUS.REFUNDED:
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPaymentStatusLabel = (status: string): string => {
  switch (status) {
    case PAYMENT_STATUS.PENDING:
      return 'Chờ thanh toán';
    case PAYMENT_STATUS.PAID:
      return 'Đã thanh toán';
    case PAYMENT_STATUS.FAILED:
      return 'Thanh toán thất bại';
    case PAYMENT_STATUS.REFUNDED:
      return 'Đã hoàn tiền';
    default:
      return status;
  }
};
