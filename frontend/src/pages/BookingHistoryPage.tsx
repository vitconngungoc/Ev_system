import { useState, useEffect } from 'react';
import { Page } from '../App';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  Car,
  Clock,
  MapPin,
  CreditCard,
  AlertCircle,
  Banknote,
  Star,
  Copy,
  Check,
} from 'lucide-react';
import { authenticatedApiCall, API_ENDPOINTS } from '../lib/api';

interface BookingHistoryPageProps {
  authToken: string;
  onNavigate: (page: Page, bookingId?: number, stationId?: number) => void;
}

interface Booking {
  bookingId: number;
  startDate: string;
  endDate: string;
  totalFee?: number;
  finalFee?: number; // From BookingDetailResponse API
  status: string;
  // Fields from BookingSummaryResponse (backend)
  renterName?: string;
  vehicleLicensePlate?: string;
  modelName?: string;
  vehicleStatus?: string;
  batteryLevel?: number;
  currentMileage?: number;
  bookingStatus?: string;
  createdAt?: string;
  // Station info (fetched separately from BookingDetailResponse)
  stationId?: number;
  stationName?: string;
  stationAddress?: string;
  pricePerHour?: number;
  // Legacy fields (for backwards compatibility)
  model?: {
    modelName: string;
    pricePerHour: number;
  };
  station?: {
    stationId?: number;
    name: string;
    address: string;
  };
  vehicle?: {
    licensePlate: string;
    model: {
      modelName: string;
      pricePerHour: number;
    };
  };
  // Bank info (stored in local storage, not from backend)
  refundBankInfo?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800 border-0' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'bg-blue-100 text-blue-800 border-0' },
  RENTING: { label: 'Đang thuê', className: 'bg-green-100 text-green-800 border-0' },
  COMPLETED: { label: 'Hoàn thành', className: 'bg-gray-100 text-gray-800 border-0' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-red-100 text-red-800 border-0' },
  CANCELLED_AWAIT_REFUND: { label: 'Chờ hoàn tiền', className: 'bg-orange-100 text-orange-800 border-0' },
  REFUNDED: { label: 'Đã hoàn tiền', className: 'bg-purple-100 text-purple-800 border-0' },
};

// Helper function để check booking đã được rating chưa
const isBookingRated = (bookingId: number): boolean => {
  const ratedBookings = JSON.parse(localStorage.getItem('ratedBookings') || '[]');
  return ratedBookings.includes(bookingId);
};

// Helper functions để manage bank info trong local storage
const saveBankInfo = (bookingId: number, bankInfo: { bankName: string; accountNumber: string; accountName: string }) => {
  try {
    const stored = JSON.parse(localStorage.getItem('bookingBankInfo') || '{}');
    stored[bookingId] = {
      ...bankInfo,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('bookingBankInfo', JSON.stringify(stored));
  } catch (error) {
    console.error('Error saving bank info to localStorage:', error);
  }
};

const getBankInfo = (bookingId: number): { bankName: string; accountNumber: string; accountName: string } | null => {
  try {
    const stored = JSON.parse(localStorage.getItem('bookingBankInfo') || '{}');
    return stored[bookingId] || null;
  } catch (error) {
    console.error('Error reading bank info from localStorage:', error);
    return null;
  }
};

// Danh sách ngân hàng phổ biến tại Việt Nam
const VIETNAM_BANKS = [
  'Vietcombank',
  'BIDV',
  'VietinBank',
  'Agribank',
  'Techcombank',
  'MB Bank',
  'ACB',
  'VPBank',
  'Sacombank',
  'HDBank',
  'SHB',
  'VIB',
  'TPBank',
  'OCB',
  'MSB',
  'SeABank',
  'PVcomBank',
  'BacABank',
  'VietCapital Bank',
  'Eximbank',
  'SCB',
  'LienVietPostBank',
  'Bản Việt',
  'Ngân hàng khác',
];

export function BookingHistoryPage({ authToken, onNavigate }: BookingHistoryPageProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedAccountNumber, setCopiedAccountNumber] = useState<number | null>(null);
  const [cancellationCount, setCancellationCount] = useState<number>(0);

  // Refund dialog state
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [refundForm, setRefundForm] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  useEffect(() => {
    if (!authToken) {
      console.warn('BookingHistoryPage: No auth token provided');
      setError('Bạn cần đăng nhập để xem lịch sử đặt xe');
      setIsLoading(false);
      return;
    }
    fetchUserProfile();
    fetchBookingHistory();
  }, [authToken]);

  const fetchUserProfile = async () => {
    try {
      const profile = await authenticatedApiCall<{ cancellationCount?: number }>(
        API_ENDPOINTS.PROFILE_ME,
        authToken
      );
      if (profile.cancellationCount !== undefined) {
        setCancellationCount(profile.cancellationCount);
      }
    } catch (error) {
      console.warn('Failed to fetch user profile:', error);
    }
  };

  const fetchBookingHistory = async () => {
    if (!authToken) {
      setError('Bạn cần đăng nhập để xem lịch sử đặt xe');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await authenticatedApiCall<Booking[]>(
        API_ENDPOINTS.RENTER_MY_BOOKINGS,
        authToken
      );
      console.log('📦 Booking History API Response:', data);
      if (data && data.length > 0) {
        console.log('📦 Sample Booking:', data[0]);
        console.log('📦 Sample Booking Status:', {
          status: data[0].status,
          bookingStatus: data[0].bookingStatus,
        });
      }

      // Fetch detailed info for each booking to get station data AND finalFee
      if (Array.isArray(data) && data.length > 0) {
        const enrichedBookings = await Promise.all(
          data.map(async (booking) => {
            try {
              // Fetch booking detail to get station info AND finalFee from backend
              const detail = await authenticatedApiCall<{
                stationName?: string;
                stationAddress?: string;
                pricePerHour?: number;
                finalFee?: number; // IMPORTANT: Backend field for total amount
              }>(
                API_ENDPOINTS.BOOKING_DETAIL(booking.bookingId),
                authToken
              );
              console.log(`📍 Detail for booking ${booking.bookingId}:`, {
                stationName: detail.stationName,
                finalFee: detail.finalFee, // Log finalFee from backend
              });
              // Get bank info from local storage
              const bankInfo = getBankInfo(booking.bookingId);
              return {
                ...booking,
                stationId: booking.stationId, // Keep stationId from BookingSummaryResponse
                stationName: detail.stationName,
                stationAddress: detail.stationAddress,
                pricePerHour: detail.pricePerHour,
                finalFee: detail.finalFee, // Use finalFee from BookingDetailResponse
                refundBankInfo: bankInfo || undefined,
              };
            } catch (error) {
              console.warn(`Failed to fetch detail for booking ${booking.bookingId}:`, error);
              // Still try to get bank info from local storage even if detail fetch fails
              const bankInfo = getBankInfo(booking.bookingId);
              return {
                ...booking,
                refundBankInfo: bankInfo || undefined,
              };
            }
          })
        );
        setBookings(enrichedBookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải lịch sử đặt xe';
      setError(message);
      toast.error(message);
      console.error('Fetch booking history error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    const booking = bookings.find(b => b.bookingId === bookingId);
    if (!booking) return;

    // Debug: Log booking status
    console.log('🔍 Booking to cancel:', {
      bookingId,
      status: booking.status,
      bookingStatus: booking.bookingStatus,
      fullBooking: booking
    });

    // Get actual status from backend (bookingStatus field from BookingSummaryResponse)
    const actualStatus = booking.bookingStatus || booking.status;

    // If PENDING (not yet paid), cancel directly without refund info
    if (actualStatus === 'PENDING') {
      if (!confirm('Bạn có chắc chắn muốn hủy đơn này không?')) {
        return;
      }

      setCancellingId(bookingId);
      try {
        await authenticatedApiCall(
          API_ENDPOINTS.RENTER_CANCEL_BOOKING(bookingId),
          authToken,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            // No body needed for PENDING status
          }
        );
        toast.success('Đã hủy đơn thành công');
        await fetchBookingHistory();
        await fetchUserProfile(); // Cập nhật lại cancellationCount
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Hủy đơn thất bại';
        toast.error(message);
      } finally {
        setCancellingId(null);
      }
      return;
    }

    // If CONFIRMED (already paid deposit), require refund info
    if (actualStatus === 'CONFIRMED') {
      console.log('✅ Status is CONFIRMED - Opening refund dialog');
      setSelectedBookingId(bookingId);
      setRefundForm({
        bankName: '',
        accountNumber: '',
        accountName: '',
      });
      setShowRefundDialog(true);
    } else {
      console.warn('⚠️ Status is not PENDING or CONFIRMED:', actualStatus);
      toast.error(`Không thể hủy đơn ở trạng thái: ${actualStatus}`);
    }
  };

  const handleSubmitRefund = async () => {
    if (!selectedBookingId) return;

    // Validate form
    if (!refundForm.bankName.trim()) {
      toast.error('Vui lòng chọn ngân hàng');
      return;
    }

    if (!refundForm.accountNumber.trim()) {
      toast.error('Vui lòng nhập số tài khoản');
      return;
    }

    if (!refundForm.accountName.trim()) {
      toast.error('Vui lòng nhập tên chủ tài khoản');
      return;
    }

    setCancellingId(selectedBookingId);
    try {
      await authenticatedApiCall(
        API_ENDPOINTS.RENTER_CANCEL_BOOKING(selectedBookingId),
        authToken,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bankName: refundForm.bankName.trim(),
            accountNumber: refundForm.accountNumber.trim(),
            accountName: refundForm.accountName.trim(),
          }),
        }
      );
      // Save bank info to local storage after successful cancellation
      saveBankInfo(selectedBookingId, {
        bankName: refundForm.bankName.trim(),
        accountNumber: refundForm.accountNumber.trim(),
        accountName: refundForm.accountName.trim(),
      });
      toast.success('Đã gửi yêu cầu hủy đơn và hoàn tiền thành công');
      setShowRefundDialog(false);
      await fetchBookingHistory();
      await fetchUserProfile(); // Cập nhật lại cancellationCount
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Hủy đơn thất bại';
      toast.error(message);
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Calculate total from backend finalFee field
  const calculateGrandTotal = (): number => {
    return bookings.reduce((sum, booking) => {
      const fee = booking.finalFee || booking.totalFee || 0;
      return sum + fee;
    }, 0);
  };

  // Copy account number to clipboard
  const handleCopyAccountNumber = async (accountNumber: string, bookingId: number) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopiedAccountNumber(bookingId);
      toast.success('Đã sao chép số tài khoản');
      setTimeout(() => setCopiedAccountNumber(null), 2000);
    } catch (error) {
      toast.error('Không thể sao chép');
    }
  };

  const grandTotal = calculateGrandTotal();

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
                onClick={() => onNavigate('home')}
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
      <div className="max-w-5xl mx-auto px-8 py-20">
        <div className="relative mb-16">
          {/* Background Number */}
          <div className="absolute -left-4 -top-12 text-[200px] font-bold text-gray-100 leading-none select-none pointer-events-none">
            05
          </div>

          <div className="relative">
            <div className="mb-6">
              <span className="text-sm text-gray-400 tracking-wider uppercase">My bookings</span>
            </div>
            <h1 className="text-8xl font-bold mb-6 tracking-tight text-gray-900">
              History<span className="text-green-500">.</span>
            </h1>
            <div className="flex items-center justify-between">
              <p className="text-xl text-gray-500">
                {bookings.length} booking{bookings.length !== 1 ? 's' : ''} found
              </p>
              {/* Grand Total from backend finalFee */}
              {!isLoading && bookings.length > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1 tracking-wider uppercase">Tổng cộng</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {formatCurrency(grandTotal)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    (Tất cả {bookings.length} đơn)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cancellation Warning Banner */}
        {cancellationCount > 0 && (
          <Card className={`border rounded-3xl mb-8 ${
            cancellationCount >= 2 
              ? 'border-red-300 bg-red-50' 
              : 'border-amber-300 bg-amber-50'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className={`w-6 h-6 flex-shrink-0 mt-1 ${
                  cancellationCount >= 2 ? 'text-red-600' : 'text-amber-600'
                }`} />
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-2 ${
                    cancellationCount >= 2 ? 'text-red-900' : 'text-amber-900'
                  }`}>
                    {cancellationCount >= 2 
                      ? '⚠️ Cảnh báo: Tài khoản có nguy cơ bị khóa' 
                      : 'Thông báo về lịch sử hủy đơn'}
                  </h3>
                  <p className={`text-sm ${
                    cancellationCount >= 2 ? 'text-red-800' : 'text-amber-800'
                  }`}>
                    Bạn đã hủy <span className="font-bold">{cancellationCount}</span> lần.
                    {cancellationCount < 3 && (
                      <> Còn <span className="font-bold">{3 - cancellationCount}</span> lần nữa tài khoản của bạn sẽ bị khóa vĩnh viễn.</>
                    )}
                    {cancellationCount >= 3 && (
                      <> <span className="font-bold">Tài khoản của bạn đã đạt giới hạn và sẽ bị khóa.</span></>
                    )}
                  </p>
                  <p className={`text-xs mt-2 ${
                    cancellationCount >= 2 ? 'text-red-700' : 'text-amber-700'
                  }`}>
                    Vui lòng chỉ hủy đơn khi thực sự cần thiết để tránh ảnh hưởng đến tài khoản của bạn.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bookings List */}
        {error ? (
          <Card className="border border-red-200 rounded-3xl bg-red-50">
            <CardContent className="p-16 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Không thể tải dữ liệu</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => onNavigate('login')}
                  className="bg-gray-900 hover:bg-gray-800 text-white h-12 px-8 rounded-xl"
                >
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => fetchBookingHistory()}
                  variant="outline"
                  className="h-12 px-8 rounded-xl border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
                >
                  Thử lại
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border border-gray-200 rounded-3xl animate-pulse">
                <CardContent className="p-8">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <Card className="border border-gray-200 rounded-3xl">
            <CardContent className="p-16 text-center">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-500 mb-6">Start your electric journey today</p>
              <Button
                onClick={() => onNavigate('home')}
                className="bg-gray-900 hover:bg-gray-800 text-white h-12 px-8 rounded-xl"
              >
                Find vehicles
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const statusConfig = STATUS_CONFIG[booking.status || booking.bookingStatus || 'PENDING'] || { 
                label: booking.status || booking.bookingStatus || 'Chưa xác định', 
                className: 'bg-gray-100 text-gray-800 border-0' 
              };
              
              // Extract vehicle info from backend response (BookingSummaryResponse format)
              const vehicleModelName = booking.modelName || booking.vehicle?.model?.modelName || booking.model?.modelName || 'Đang cập nhật';
              const vehicleLicensePlate = booking.vehicleLicensePlate || booking.vehicle?.licensePlate || '';
              const pricePerHour = booking.pricePerHour || booking.vehicle?.model?.pricePerHour || booking.model?.pricePerHour || 0;
              
              // Station info (fetched from booking detail)
              const stationName = booking.stationName || booking.station?.name || 'Đang cập nhật';
              const stationAddress = booking.stationAddress || booking.station?.address || '';
              
              // Fee calculation
              const displayFee = booking.finalFee || booking.totalFee || 0;
              
              return (
                <Card key={booking.bookingId} className="border border-gray-200 rounded-3xl hover:border-gray-900 transition-all group">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-gray-900">
                            Đơn #{booking.bookingId}
                          </h3>
                          <Badge className={statusConfig.className}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-gray-500">
                          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">Tổng tiền</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {(displayFee / 1000).toFixed(0)}K
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Vehicle Info */}
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                          <Car className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500 mb-1">Xe</p>
                          <p className="font-semibold text-gray-900 truncate">
                            {vehicleModelName}
                          </p>
                          {vehicleLicensePlate && vehicleLicensePlate !== 'Chưa nhận xe' && (
                            <p className="text-sm text-gray-600 truncate">{vehicleLicensePlate}</p>
                          )}
                        </div>
                      </div>

                      {/* Station Info */}
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500 mb-1">Trạm</p>
                          <p className="font-semibold text-gray-900 truncate">
                            {stationName}
                          </p>
                          {stationAddress && (
                            <p className="text-sm text-gray-600 truncate" title={stationAddress}>
                              {stationAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bank Info Section - Only show if refund bank info exists */}
                    {booking.refundBankInfo && (
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Banknote className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-blue-600 font-medium mb-2">Thông tin hoàn tiền</p>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-24 flex-shrink-0">Ngân hàng:</span>
                                <span className="text-sm font-semibold text-gray-900 truncate">
                                  {booking.refundBankInfo.bankName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-24 flex-shrink-0">Số TK:</span>
                                <span className="text-sm font-mono font-semibold text-gray-900 truncate flex-1">
                                  {booking.refundBankInfo.accountNumber}
                                </span>
                                <button
                                  onClick={() => handleCopyAccountNumber(booking.refundBankInfo!.accountNumber, booking.bookingId)}
                                  className="ml-2 p-1.5 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
                                  title="Sao chép số tài khoản"
                                >
                                  {copiedAccountNumber === booking.bookingId ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-blue-600" />
                                  )}
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-24 flex-shrink-0">Chủ TK:</span>
                                <span className="text-sm font-semibold text-gray-900 truncate">
                                  {booking.refundBankInfo.accountName}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Summary */}
                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span>Tổng: {formatCurrency(displayFee)}</span>
                        </div>
                        {pricePerHour > 0 && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {pricePerHour.toLocaleString('vi-VN')} đ/giờ
                            </span>
                          </div>
                      )}
                    </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3">
                        {/* Show Cancel Button for PENDING or CONFIRMED status only */}
                        {(booking.bookingStatus === 'PENDING' || booking.bookingStatus === 'CONFIRMED') && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={cancellingId === booking.bookingId}
                            onClick={() => handleCancelBooking(booking.bookingId)}
                            className="border-2 border-red-500 bg-white text-red-600 hover:bg-red-50 hover:border-red-600 font-medium"
                          >
                            {cancellingId === booking.bookingId ? 'Đang hủy...' : 'Hủy đơn'}
                          </Button>
                        )}
                        
                        {/* Show Rating Button for COMPLETED status only and not yet rated */}
                        {booking.bookingStatus === 'COMPLETED' && !isBookingRated(booking.bookingId) && (
                          <Button
                            size="sm"
                            onClick={() => onNavigate('rating', booking.bookingId, booking.stationId)}
                            className="bg-green-500 hover:bg-green-600 text-white font-medium flex items-center gap-2"
                          >
                            <Star className="w-4 h-4" />
                            Đánh giá
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Vertical Navigation */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 hidden xl:block z-40">
        <div className="flex flex-col gap-8 text-xs text-gray-400 uppercase tracking-wider">
          <a 
            href="https://www.instagram.com/evolvesp68/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="rotate-180 hover:text-gray-900 transition-colors" 
            style={{ writingMode: 'vertical-lr' }}
          >
            Instagram
          </a>
          <a 
            href="https://x.com/volve28729" 
            target="_blank" 
            rel="noopener noreferrer"
            className="rotate-180 hover:text-gray-900 transition-colors" 
            style={{ writingMode: 'vertical-lr' }}
          >
            Twitter
          </a>
          <a 
            href="https://www.facebook.com/profile.php?id=61583647976497" 
            target="_blank" 
            rel="noopener noreferrer"
            className="rotate-180 hover:text-gray-900 transition-colors" 
            style={{ writingMode: 'vertical-lr' }}
          >
            Facebook
          </a>
        </div>
      </div>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-blue-600" />
              Thông tin hoàn tiền cọc
            </DialogTitle>
            <DialogDescription>
              Bạn đã thanh toán cọc 500.000đ. Vui lòng cung cấp thông tin tài khoản ngân hàng để nhận hoàn tiền khi hủy đơn (nếu hủy trong vòng 12 giờ kể từ khi đặt).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">
                Ngân hàng <span className="text-red-500">*</span>
              </Label>
              <Select
                value={refundForm.bankName}
                onValueChange={(value: string) =>
                  setRefundForm((prev) => ({ ...prev, bankName: value }))
                }
              >
                <SelectTrigger id="bankName">
                  <SelectValue placeholder="Chọn ngân hàng" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {VIETNAM_BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">
                Số tài khoản <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountNumber"
                placeholder="Nhập số tài khoản"
                value={refundForm.accountNumber}
                onChange={(e) =>
                  setRefundForm((prev) => ({ ...prev, accountNumber: e.target.value }))
                }
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">
                Tên chủ tài khoản <span className="text-red-500">*</span>
              </Label>
              <Input
                id="accountName"
                placeholder="Nhập tên chủ tài khoản (theo CMND/CCCD)"
                value={refundForm.accountName}
                onChange={(e) =>
                  setRefundForm((prev) => ({ ...prev, accountName: e.target.value }))
                }
                maxLength={100}
              />
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-sm text-amber-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Thông tin tài khoản phải chính xác để nhận được tiền hoàn. Vui lòng kiểm tra kỹ trước khi xác nhận.
                </span>
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-between gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRefundDialog(false)}
              disabled={cancellingId !== null}
              className="flex-shrink-0 h-11 px-6 border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg font-medium transition-all"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSubmitRefund}
              disabled={cancellingId !== null}
              className="flex-1 h-12 px-8 border-2 border-red-500 bg-white text-red-600 hover:bg-red-50 hover:border-red-600 font-semibold shadow-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancellingId !== null ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
