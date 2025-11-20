export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
}

export interface ErrorState {
  hasError: boolean;
  errorMessage?: string;
}

export interface FormState extends LoadingState, ErrorState {
  isSubmitting: boolean;
  isValid: boolean;
}

export const createInitialLoadingState = (): LoadingState => ({
  isLoading: false,
  loadingMessage: undefined,
});

export const createInitialErrorState = (): ErrorState => ({
  hasError: false,
  errorMessage: undefined,
});

export const createInitialFormState = (): FormState => ({
  isLoading: false,
  loadingMessage: undefined,
  hasError: false,
  errorMessage: undefined,
  isSubmitting: false,
  isValid: false,
});

export const setLoading = (message?: string): LoadingState => ({
  isLoading: true,
  loadingMessage: message,
});

export const setError = (message: string): ErrorState => ({
  hasError: true,
  errorMessage: message,
});

export const clearError = (): ErrorState => ({
  hasError: false,
  errorMessage: undefined,
});

export const clearLoading = (): LoadingState => ({
  isLoading: false,
  loadingMessage: undefined,
});
