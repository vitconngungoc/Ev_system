import { User } from '../types/auth.types';
import { MAX_CANCELLATION_COUNT, CANCELLATION_WARNING_THRESHOLD } from '../constants/auth.constants';

export const getCancellationWarningMessage = (user: User): string | null => {
  const count = user.cancellationCount || 0;
  
  if (count === 0) return null;
  
  const remaining = MAX_CANCELLATION_COUNT - count;
  
  if (count >= CANCELLATION_WARNING_THRESHOLD) {
    return `⚠️ Warning: You have cancelled ${count} times. ${remaining} more cancellation(s) and your account will be permanently locked.`;
  }
  
  return `You have cancelled ${count} time(s). ${remaining} more cancellation(s) before account lock.`;
};

export const shouldShowCancellationWarning = (user: User): boolean => {
  return (user.cancellationCount || 0) > 0;
};

export const isCancellationLimitReached = (user: User): boolean => {
  return (user.cancellationCount || 0) >= MAX_CANCELLATION_COUNT;
};

export const getCancellationWarningLevel = (user: User): 'none' | 'warning' | 'critical' => {
  const count = user.cancellationCount || 0;
  
  if (count === 0) return 'none';
  if (count >= CANCELLATION_WARNING_THRESHOLD) return 'critical';
  return 'warning';
};
