import { useState, useEffect } from 'react';
import { Page } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Zap,
  CheckCircle,
  Clock,
  QrCode,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { authenticatedApiCall, API_ENDPOINTS } from '../lib/api';

interface PaymentPageProps {
  bookingId: number;
  authToken: string;
  onNavigate: (page: Page) => void;
  onBack: () => void;
}

interface BookingDetail {
  bookingId: number;
  downpay: number;
  finalFee: number;
  status: string;
  startDate: string;
  endDate: string;
  vehicle: {
    licensePlate: string;
    model: {
      modelName: string;
      pricePerHour: number;
    };
  };
  station: {
    name: string;
    address: string;
  };
}

export function PaymentPage({ bookingId, authToken, onNavigate, onBack }: PaymentPageProps) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'counter'>('qr');

  useEffect(() => {
    fetchBookingDetail();
  }, []);

  const fetchBookingDetail = async () => {
    try {
      const data = await authenticatedApiCall<BookingDetail>(
        API_ENDPOINTS.BOOKING_DETAIL(bookingId),
        authToken
      );
      setBooking(data);
    } catch (error: any) {
      toast.error('Không thể tải thông tin booking');
      onBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayDeposit = async () => {
    if (!booking) return;

    setIsPaying(true);

    try {
      await authenticatedApiCall(
        API_ENDPOINTS.BOOKING_PAY_DEPOSIT(bookingId),
        authToken,
        { method: 'POST' }
      );

      toast.success('Thanh toán đặt cọc thành công!');
      setTimeout(() => {
        onNavigate('history');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Thanh toán thất bại');
    } finally {
      setIsPaying(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="mb-2">Không tìm thấy booking</h3>
            <Button onClick={onBack}>Quay lại</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="gradient-orange text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8" />
              <div>
                <h1 className="text-xl">Thanh toán đặt cọc</h1>
                <p className="text-xs opacity-90">Booking #{bookingId}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Summary */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin đơn thuê</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <h4>{booking.vehicle.model.modelName}</h4>
                    <p className="text-sm text-gray-600">BSX: {booking.vehicle.licensePlate}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    <Clock className="w-3 h-3 mr-1" />
                    {booking.status === 'PENDING' ? 'Chờ thanh toán' : booking.status}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Trạm nhận xe</p>
                  <p className="font-semibold">{booking.station.name}</p>
                  <p className="text-sm text-gray-500">{booking.station.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Thời gian nhận</p>
                    <p className="text-sm">{formatDate(booking.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Thời gian trả</p>
                    <p className="text-sm">{formatDate(booking.endDate)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí thuê dự kiến:</span>
                    <span>{booking.finalFee.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span>Cần đặt cọc (10%):</span>
                    <span className="text-2xl text-[#FF6B00]">
                      {booking.downpay.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Phương thức thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  onClick={() => setPaymentMethod('qr')}
                  className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                    paymentMethod === 'qr'
                      ? 'border-[#FF6B00] bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <QrCode className={`w-6 h-6 ${paymentMethod === 'qr' ? 'text-[#FF6B00]' : 'text-gray-400'}`} />
                  <div className="flex-1 text-left">
                    <p className="font-semibold">Quét mã QR (Khuyến nghị)</p>
                    <p className="text-sm text-gray-600">Thanh toán qua VietQR/Banking App</p>
                  </div>
                  {paymentMethod === 'qr' && (
                    <CheckCircle className="w-5 h-5 text-[#FF6B00]" />
                  )}
                </button>

                <button
                  onClick={() => setPaymentMethod('counter')}
                  className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                    paymentMethod === 'counter'
                      ? 'border-[#FF6B00] bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className={`w-6 h-6 ${paymentMethod === 'counter' ? 'text-[#FF6B00]' : 'text-gray-400'}`} />
                  <div className="flex-1 text-left">
                    <p className="font-semibold">Thanh toán tại quầy</p>
                    <p className="text-sm text-gray-600">Thanh toán khi nhận xe</p>
                  </div>
                  {paymentMethod === 'counter' && (
                    <CheckCircle className="w-5 h-5 text-[#FF6B00]" />
                  )}
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Payment Action */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                {paymentMethod === 'qr' ? (
                  <div className="text-center space-y-4">
                    <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Quét mã QR để thanh toán
                    </p>
                    <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                      <p className="mb-1">Hướng dẫn:</p>
                      <ol className="list-decimal list-inside space-y-1 text-left">
                        <li>Mở app ngân hàng</li>
                        <li>Quét mã QR</li>
                        <li>Xác nhận thanh toán</li>
                      </ol>
                    </div>
                    <Button
                      onClick={handlePayDeposit}
                      disabled={isPaying}
                      className="w-full gradient-orange hover:opacity-90"
                    >
                      {isPaying ? 'Đang xử lý...' : 'Đã thanh toán'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mb-2" />
                      <p className="text-sm text-yellow-800">
                        Bạn sẽ thanh toán đặt cọc khi đến nhận xe tại trạm
                      </p>
                    </div>
                    <Button
                      onClick={handlePayDeposit}
                      disabled={isPaying}
                      className="w-full gradient-orange hover:opacity-90"
                    >
                      {isPaying ? 'Đang xác nhận...' : 'Xác nhận'}
                    </Button>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t text-center">
                  <p className="text-xs text-gray-500">
                    Sau khi thanh toán, xe sẽ được giữ trong vòng 24 giờ
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
