import { useState, useEffect } from 'react';
import { Page } from '../App';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Zap,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  History as HistoryIcon,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface BookingHistoryPageProps {
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
  refund: number;
  status: 'PENDING' | 'CONFIRMED' | 'RENTING' | 'COMPLETED' | 'CANCELLED';
  vehicle: {
    licensePlate: string;
    model: {
      modelName: string;
      imageUrl: string;
      pricePerHour: number;
    };
  };
  station: {
    name: string;
    address: string;
  };
}

export function BookingHistoryPage({ authToken, onNavigate, onBack }: BookingHistoryPageProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchBookingHistory();
  }, []);

  const fetchBookingHistory = async () => {
    try {
      // Note: This endpoint doesn't exist in backend yet
      // For demo, we'll show empty state
      // const response = await fetch('http://localhost:8080/api/bookings/my-history', {
      //   headers: { 'Authorization': `Bearer ${authToken}` },
      // });
      // const data = await response.json();
      // setBookings(data);
      
      setBookings([]);
    } catch (error) {
      toast.error('Không thể tải lịch sử đặt xe');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: { bg: 'bg-gray-100 text-gray-800', icon: AlertCircle },
      CONFIRMED: { bg: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      RENTING: { bg: 'bg-green-100 text-green-800', icon: Clock },
      COMPLETED: { bg: 'bg-green-100 text-green-800', icon: CheckCircle },
      CANCELLED: { bg: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const style = styles[status as keyof typeof styles] || styles.PENDING;
    const Icon = style.icon;

    return (
      <Badge className={style.bg}>
        <Icon className="w-3 h-3 mr-1" />
        {getStatusText(status)}
      </Badge>
    );
  };

  const getStatusText = (status: string) => {
    const texts = {
      PENDING: 'Chờ thanh toán',
      CONFIRMED: 'Đã xác nhận',
      RENTING: 'Đang thuê',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
    };
    return texts[status as keyof typeof texts] || status;
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

  const filterBookings = (status?: string) => {
    if (!status || status === 'all') return bookings;
    return bookings.filter(b => b.status === status);
  };

  const renderBookingCard = (booking: Booking) => (
    <Card key={booking.bookingId} className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4>{booking.vehicle.model.modelName}</h4>
              {getStatusBadge(booking.status)}
            </div>
            <p className="text-sm text-gray-600">
              Mã đơn: #{booking.bookingId}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-gray-700">{booking.station.name}</p>
              <p className="text-gray-500 text-xs">{booking.station.address}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              BSX: {booking.vehicle.licensePlate}
            </span>
          </div>

          <div className="pt-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <div className="text-sm">
                <p className="text-gray-500">Tổng chi phí</p>
                <p className="text-[#FF6B00]">
                  {(booking.finalFee || 0).toLocaleString('vi-VN')} đ
                </p>
              </div>
            </div>

            {booking.status === 'PENDING' && (
              <Button
                size="sm"
                className="gradient-orange"
                onClick={() => toast.info('Chức năng thanh toán đang phát triển')}
              >
                Thanh toán
              </Button>
            )}

            {booking.status === 'COMPLETED' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.info('Xem hóa đơn chi tiết')}
              >
                Xem hóa đơn
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
              <HistoryIcon className="w-8 h-8" />
              <div>
                <h1 className="text-xl">Lịch sử thuê xe</h1>
                <p className="text-xs opacity-90">Quản lý các chuyến đi của bạn</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="PENDING">Chờ TT</TabsTrigger>
            <TabsTrigger value="CONFIRMED">Đã xác nhận</TabsTrigger>
            <TabsTrigger value="RENTING">Đang thuê</TabsTrigger>
            <TabsTrigger value="COMPLETED">Hoàn thành</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                      <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filterBookings().length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <HistoryIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="mb-2">Chưa có lịch sử thuê xe</h3>
                  <p className="text-gray-600 mb-6">
                    Bắt đầu thuê xe điện để trải nghiệm dịch vụ của chúng tôi
                  </p>
                  <Button
                    onClick={() => onNavigate('home')}
                    className="gradient-orange"
                  >
                    Tìm xe ngay
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filterBookings().map(renderBookingCard)}
              </div>
            )}
          </TabsContent>

          {['PENDING', 'CONFIRMED', 'RENTING', 'COMPLETED'].map((status) => (
            <TabsContent key={status} value={status}>
              {filterBookings(status).length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-gray-600">
                      Không có đơn hàng nào ở trạng thái này
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filterBookings(status).map(renderBookingCard)}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
