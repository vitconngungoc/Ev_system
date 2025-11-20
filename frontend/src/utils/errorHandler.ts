// API error handling utilities
export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    return {
      status: error.response.status,
      message: error.response.data?.message || 'Đã xảy ra lỗi',
      code: error.response.data?.code,
    };
  }
  
  if (error.request) {
    return {
      status: 0,
      message: 'Không thể kết nối đến máy chủ',
    };
  }
  
  return {
    status: 500,
    message: error.message || 'Đã xảy ra lỗi không xác định',
  };
};

export const getErrorMessage = (status: number): string => {
  const messages: Record<number, string> = {
    400: 'Yêu cầu không hợp lệ',
    401: 'Chưa đăng nhập',
    403: 'Không có quyền truy cập',
    404: 'Không tìm thấy',
    500: 'Lỗi máy chủ',
  };
  return messages[status] || 'Đã xảy ra lỗi';
};
