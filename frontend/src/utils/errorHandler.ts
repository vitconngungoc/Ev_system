export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: any): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 400:
        return data?.message || 'Invalid request';
      case 401:
        return 'Unauthorized. Please login again';
      case 403:
        return 'Access denied';
      case 404:
        return 'Resource not found';
      case 409:
        return data?.message || 'Conflict error';
      case 422:
        return data?.message || 'Validation error';
      case 500:
        return 'Server error. Please try again later';
      default:
        return data?.message || 'An error occurred';
    }
  }
  
  if (error.request) {
    return 'Network error. Please check your connection';
  }
  
  return error.message || 'An unexpected error occurred';
};

export const isAuthError = (error: any): boolean => {
  return error?.response?.status === 401 || error?.response?.status === 403;
};

export const shouldRetry = (error: any): boolean => {
  const status = error?.response?.status;
  return status >= 500 || status === 408 || status === 429;
};
