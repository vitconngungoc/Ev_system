// Rating and review utilities
export const RATING_LEVELS = {
  EXCELLENT: 5,
  GOOD: 4,
  AVERAGE: 3,
  POOR: 2,
  VERY_POOR: 1,
} as const;

export const getRatingLabel = (rating: number): string => {
  if (rating >= 4.5) return 'Xuất sắc';
  if (rating >= 3.5) return 'Tốt';
  if (rating >= 2.5) return 'Trung bình';
  if (rating >= 1.5) return 'Kém';
  return 'Rất kém';
};

export const getRatingColor = (rating: number): string => {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 3.5) return 'text-blue-600';
  if (rating >= 2.5) return 'text-yellow-600';
  if (rating >= 1.5) return 'text-orange-600';
  return 'text-red-600';
};

export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

export const validateRating = (rating: number): boolean => {
  return rating >= 1 && rating <= 5 && Number.isFinite(rating);
};

export const calculateAverageRating = (ratings: number[]): number => {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return sum / ratings.length;
};

export const getRatingStars = (rating: number): { full: number; half: boolean; empty: number } => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return {
    full: fullStars,
    half: hasHalfStar,
    empty: emptyStars,
  };
};

export const validateReviewText = (text: string): { valid: boolean; error?: string } => {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Vui lòng nhập nội dung đánh giá' };
  }
  
  if (text.length < 10) {
    return { valid: false, error: 'Đánh giá phải có ít nhất 10 ký tự' };
  }
  
  if (text.length > 500) {
    return { valid: false, error: 'Đánh giá không được vượt quá 500 ký tự' };
  }
  
  return { valid: true };
};
