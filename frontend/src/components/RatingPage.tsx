import { useState, useEffect } from 'react';
import { Page } from '../App';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Star, Send, CheckCircle2 } from 'lucide-react';
import { authenticatedApiCall, API_ENDPOINTS } from '../lib/api';

interface RatingPageProps {
  authToken: string;
  onNavigate: (page: Page) => void;
  bookingId?: number;
  stationId?: number;
}

export function RatingPage({ authToken, onNavigate, bookingId, stationId }: RatingPageProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingDetail, setBookingDetail] = useState<any>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);

  // Debug log on mount
  useEffect(() => {
    console.log('🎯 RatingPage mounted with props:', {
      bookingId,
      stationId,
      authToken: authToken ? 'exists' : 'missing'
    });
  }, []);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetail();
    }
  }, [bookingId]);

  const fetchBookingDetail = async () => {
    if (!bookingId) return;
    
    setLoadingBooking(true);
    try {
      const data = await authenticatedApiCall(
        API_ENDPOINTS.BOOKING_DETAIL(bookingId),
        authToken
      );
      console.log('📦 Fetched booking detail:', data);
      setBookingDetail(data);
      
      // If we don't have stationId from props, try to find it by fetching all stations
      if (!stationId && data.stationName) {
        try {
          const stations = await authenticatedApiCall(
            API_ENDPOINTS.STATIONS,
            authToken
          );
          const matchingStation = stations.find((s: any) => s.name === data.stationName);
          if (matchingStation) {
            console.log('✅ Found stationId from station list:', matchingStation.stationId);
            // Store it in booking detail for later use
            setBookingDetail((prev: any) => ({
              ...prev,
              stationId: matchingStation.stationId
            }));
          }
        } catch (error) {
          console.error('Failed to fetch stations:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching booking detail:', error);
      toast.error('Không thể tải thông tin booking');
    } finally {
      setLoadingBooking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Vui lòng chọn số sao đánh giá');
      return;
    }

    // Use stationId from props if available, otherwise try to get from bookingDetail
    const targetStationId = stationId || bookingDetail?.stationId;
    
    console.log('📍 Rating submission debug:', {
      stationId,
      bookingDetail,
      targetStationId,
      bookingId,
    });
    
    if (!targetStationId) {
      toast.error('Không tìm thấy thông tin trạm');
      console.error('Missing stationId:', { stationId, bookingDetail });
      return;
    }

    setIsSubmitting(true);
    try {
      await authenticatedApiCall(
        API_ENDPOINTS.STATION_ADD_RATING,
        authToken,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stationId: targetStationId,
            stars: rating,
            comment: comment.trim() || null,
          }),
        }
      );

      setIsSuccess(true);
      toast.success('Cảm ơn bạn đã đánh giá!');
      
      // Lưu vào localStorage để tracking đã rating
      const ratedBookings = JSON.parse(localStorage.getItem('ratedBookings') || '[]');
      if (!ratedBookings.includes(bookingId)) {
        ratedBookings.push(bookingId);
        localStorage.setItem('ratedBookings', JSON.stringify(ratedBookings));
      }
      
      // Redirect after 2 seconds
      setTimeout(() => {
        onNavigate('booking-history');
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gửi đánh giá thất bại';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
        <Card className="border border-green-200 rounded-3xl max-w-md w-full mx-4">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Đánh giá thành công!
            </h2>
            <p className="text-gray-600 mb-6">
              Cảm ơn bạn đã chia sẻ trải nghiệm của mình
            </p>
            <div className="flex justify-center gap-1 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 ${
                    star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <Button
              onClick={() => onNavigate('booking-history')}
              className="bg-gray-900 hover:bg-gray-800 text-white h-12 px-8 rounded-xl"
            >
              Quay lại lịch sử
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-12">
              <h1 className="text-2xl text-gray-900">
                EV<span className="font-bold">Rental</span><span className="text-green-500">.</span>
              </h1>
              <button
                onClick={() => onNavigate('booking-history')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full border border-gray-200 group-hover:border-gray-900 flex items-center justify-center transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="text-sm">Back</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-20">
        <div className="relative mb-16">
          {/* Background Number */}
          <div className="absolute -left-4 -top-12 text-[200px] font-bold text-gray-100 leading-none select-none pointer-events-none">
            06
          </div>

          <div className="relative">
            <div className="mb-6">
              <span className="text-sm text-gray-400 tracking-wider uppercase">Share your experience</span>
            </div>
            <h1 className="text-8xl font-bold mb-6 tracking-tight text-gray-900">
              Rating<span className="text-green-500">.</span>
            </h1>
            <p className="text-xl text-gray-500">
              Đánh giá của bạn giúp chúng tôi cải thiện dịch vụ tốt hơn
            </p>
          </div>
        </div>

        {/* Rating Form */}
        <Card className="border border-gray-200 rounded-3xl">
          <CardContent className="p-12">
            {bookingDetail && (
              <div className="mb-8 p-6 bg-gray-50 rounded-2xl">
                <h3 className="text-sm text-gray-500 mb-2 uppercase tracking-wider">Thông tin chuyến đi</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {bookingDetail.stationName || 'Trạm thuê xe'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Đơn #{bookingId}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Star Rating */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold text-gray-900">
                  Đánh giá của bạn <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center justify-center gap-4 py-8">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-full"
                    >
                      <Star
                        className={`w-16 h-16 transition-all duration-200 ${
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-400 text-yellow-400 drop-shadow-lg'
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {rating === 0 && 'Chọn số sao'}
                    {rating === 1 && 'Rất tệ'}
                    {rating === 2 && 'Tệ'}
                    {rating === 3 && 'Bình thường'}
                    {rating === 4 && 'Tốt'}
                    {rating === 5 && 'Xuất sắc'}
                  </p>
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-4">
                <Label htmlFor="comment" className="text-lg font-semibold text-gray-900">
                  Nhận xét của bạn <span className="text-gray-400 text-sm font-normal">(Tùy chọn)</span>
                </Label>
                <Textarea
                  id="comment"
                  placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ, xe, trạm..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[160px] resize-none rounded-2xl border-2 border-gray-200 focus:border-gray-900 text-base p-4"
                  maxLength={500}
                />
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Tối đa 500 ký tự</span>
                  <span>{comment.length}/500</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                  className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Gửi đánh giá
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
          <p className="text-sm text-blue-800 text-center">
            💡 Đánh giá của bạn sẽ được hiển thị công khai và giúp người dùng khác đưa ra quyết định tốt hơn
          </p>
        </div>
      </div>

      {/* Vertical Navigation */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 hidden xl:block">
        <div className="flex flex-col gap-8 text-xs text-gray-400 uppercase tracking-wider">
          <button className="rotate-180 hover:text-gray-900 transition-colors" style={{ writingMode: 'vertical-lr' }}>
            Instagram
          </button>
          <button className="rotate-180 hover:text-gray-900 transition-colors" style={{ writingMode: 'vertical-lr' }}>
            Twitter
          </button>
          <button className="rotate-180 hover:text-gray-900 transition-colors" style={{ writingMode: 'vertical-lr' }}>
            Facebook
          </button>
        </div>
      </div>
    </div>
  );
}
