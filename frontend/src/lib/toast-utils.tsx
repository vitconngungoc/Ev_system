import React from 'react';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

/**
 * Enhanced toast utilities với icons và styling đẹp
 */

export const showSuccess = (message: string, description?: string) => {
  toast.success(message, {
    description,
    icon: <CheckCircle2 className="w-5 h-5" />,
  });
};

export const showError = (message: string, description?: string) => {
  toast.error(message, {
    description,
    icon: <XCircle className="w-5 h-5" />,
  });
};

export const showWarning = (message: string, description?: string) => {
  toast.warning(message, {
    description,
    icon: <AlertCircle className="w-5 h-5" />,
  });
};

export const showInfo = (message: string, description?: string) => {
  toast.info(message, {
    description,
    icon: <Info className="w-5 h-5" />,
  });
};

/**
 * Toast với action button
 */
export const showWithAction = (
  message: string,
  actionLabel: string,
  onAction: () => void,
  description?: string
) => {
  toast(message, {
    description,
    action: {
      label: actionLabel,
      onClick: onAction,
    },
  });
};

/**
 * Toast loading state
 */
export const showLoading = (message: string) => {
  return toast.loading(message);
};

/**
 * Update toast đang loading
 */
export const updateToast = (
  toastId: string | number,
  type: 'success' | 'error',
  message: string,
  description?: string
) => {
  if (type === 'success') {
    toast.success(message, {
      id: toastId,
      description,
      icon: <CheckCircle2 className="w-5 h-5" />,
    });
  } else {
    toast.error(message, {
      id: toastId,
      description,
      icon: <XCircle className="w-5 h-5" />,
    });
  }
};

/**
 * Promise toast - tự động chuyển đổi trạng thái
 */
export const showPromise = <T,>(
  promise: Promise<T>,
  {
    loading,
    success,
    error,
  }: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: any) => string);
  }
) => {
  return toast.promise(promise, {
    loading,
    success,
    error,
  });
};
