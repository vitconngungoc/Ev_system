import { toast as sonnerToast } from 'sonner';

export const showSuccess = (message: string, description?: string) => {
  sonnerToast.success(message, {
    description,
    duration: 3000,
  });
};

export const showError = (message: string, description?: string) => {
  sonnerToast.error(message, {
    description,
    duration: 4000,
  });
};

export const showWarning = (message: string, description?: string) => {
  sonnerToast.warning(message, {
    description,
    duration: 5000,
  });
};

export const showInfo = (message: string, description?: string) => {
  sonnerToast.info(message, {
    description,
    duration: 3000,
  });
};

export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) => {
  return sonnerToast.promise(promise, messages);
};
