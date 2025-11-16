import { useState, useEffect } from 'react';
import { Page } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { authenticatedApiCall, API_ENDPOINTS } from '../lib/api';
import {
  ArrowLeft,
  Zap,
  Calendar,
  MapPin,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Copy,
} from 'lucide-react';

interface PaymentPageProps {
  bookingId: number;
  authToken: string;
  onNavigate: (page: Page) => void;
  onBack: () => void;
}

interface Booking {
  bookingId: number;
  startDate: string;
  endDate: string;
  downpay: number;
  finalFee: number;
  status: string;
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
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchBookingDetail();
  }, [bookingId]);

  const fetchBookingDetail = async () => {
    setIsLoading(true);
    try {
      const data = await authenticatedApiCall<Booking>(
        API_ENDPOINTS.BOOKING_DETAIL(bookingId),
        authToken
      );
      setBooking(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải thông tin booking';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayDeposit = async () => {
    setIsProcessing(true);
    try {
      // Try to open saved paymentUrl (created during booking) in a new tab
      const storageKey = `paymentUrl_${bookingId}`;
      const paymentUrl = localStorage.getItem(storageKey);

      if (paymentUrl) {
        window.open(paymentUrl, '_blank');
        toast.success('Đã mở trang thanh toán. Vui lòng hoàn tất giao dịch.');
      } else {
        // If no paymentUrl available, just refresh booking detail to get latest status (webhook may update it)
        await fetchBookingDetail();
        toast.success('Đã cập nhật trạng thái booking.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Thanh toán thất bại';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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

  // Bank info (TPBank - from backend)
  const bankInfo = {
    bankName: 'TPBank',
    accountNumber: '88303062005',
    accountName: 'CONG TY TNHH CONG NGHE EVOLVE',
    amount: booking.downpay,
    content: `TT BOOKING ${booking.bookingId}`,
  };

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
              <CreditCard className="w-8 h-8" />
              <div>
                <h1 className="text-xl">Thanh toán đặt cọc</h1>
                <p className="text-xs opacity-90">Booking #{booking.bookingId}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Booking Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Thông tin đặt xe
                  <Badge className="bg-blue-100 text-blue-800">
                    Chờ thanh toán
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Xe</p>
                  <p className="font-semibold">{booking.vehicle.model.modelName}</p>
                  <p className="text-sm text-gray-600">BSX: {booking.vehicle.licensePlate}</p>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Trạm</p>
                    <p className="font-semibold">{booking.station.name}</p>
                    <p className="text-sm text-gray-600">{booking.station.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Thời gian thuê</p>
                    <p className="text-sm">{formatDate(booking.startDate)}</p>
                    <p className="text-sm text-gray-600">đến</p>
                    <p className="text-sm">{formatDate(booking.endDate)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Tổng phí thuê (dự kiến):</span>
                    <span>{booking.finalFee.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-[#FF6B00]">Đặt cọc (10%):</span>
                    <span className="text-[#FF6B00]">
                      {booking.downpay.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Lưu ý:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Xe sẽ được giữ trong 24 giờ sau khi thanh toán</li>
                    <li>Vui lòng đến trạm đúng giờ để nhận xe</li>
                    <li>Tiền cọc sẽ được hoàn lại sau khi trả xe</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-6">
            {/* QR Code Payment */}
            <Card>
              <CardHeader>
                <CardTitle>Thanh toán qua chuyển khoản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* QR Code */}
                <div className="p-6 bg-white border-2 border-gray-200 rounded-lg text-center">
                  <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="w-16 h-16 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">Quét mã QR để thanh toán</p>
                  <p className="text-xs text-gray-400 mt-1">(Tính năng đang phát triển)</p>
                </div>

                {/* Bank Info */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm mb-3">Hoặc chuyển khoản thủ công:</h4>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ngân hàng:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{bankInfo.bankName}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(bankInfo.bankName)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Số tài khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold font-mono">{bankInfo.accountNumber}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(bankInfo.accountNumber)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Chủ tài khoản:</span>
                    <span className="text-sm font-semibold">{bankInfo.accountName}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">Số tiền:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-[#FF6B00]">
                        {bankInfo.amount.toLocaleString('vi-VN')} đ
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(bankInfo.amount.toString())}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Nội dung:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold font-mono">{bankInfo.content}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(bankInfo.content)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    💡 Vui lòng ghi chính xác nội dung chuyển khoản để hệ thống tự động xác nhận
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Confirm Payment Button (For Demo) */}
            <Button
              onClick={handlePayDeposit}
              disabled={isProcessing}
              className="w-full gradient-orange hover:opacity-90 h-12"
            >
              {isProcessing ? 'Đang xử lý...' : 'Xác nhận đã thanh toán'}
            </Button>

            <p className="text-xs text-center text-gray-500">
              Trong thực tế, hệ thống sẽ tự động xác nhận sau khi nhận được tiền
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
