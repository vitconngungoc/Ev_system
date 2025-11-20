import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import {
  Calendar,
  MapPin,
  Car,
  Search,
  Eye,
  RefreshCw,
  ClipboardList,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { BookingDetailDialog } from './BookingDetailDialog';
import { authenticatedApiCall, API_ENDPOINTS } from '../../lib/api';

// Debug logger - disabled in production builds
const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const debugLog = (...args: any[]) => {
  if (IS_DEV) {
    console.log(...args);
  }
};

interface Booking {
  bookingId: number;
  startDate: string;
  endDate: string;
  downpay?: number; // Deprecated field, use rentalDeposit instead
  finalFee?: number;
  status: string;  // This maps to 'bookingStatus' from backend
  bookingStatus?: string;  // Support both field names
  createdAt?: string;
  
  // Payment fields from backend
  rentalDeposit?: number;  // Tiền cọc thuê xe (rental_deposit)
  rentalDepositPaid?: boolean;  // Đã trả cọc thuê chưa
  reservationDepositPaid?: boolean;  // Đã trả cọc đặt chỗ chưa
  refund?: number;  // Tiền hoàn lại
  refundNote?: string;  // Ghi chú hoàn tiền
  invoicePdfPath?: string;  // Đường dẫn hóa đơn PDF
  checkInPhotoPaths?: string | string[];  // Ảnh check-in
  
  vehicle: {
    vehicleId: number;
    licensePlate: string;
    batteryLevel?: number;
    condition?: string;
    currentMileage?: number;
    damageReportPhotos?: string | string[];
    model: {
      modelId?: number;
      modelName: string;
      pricePerHour: number;
      vehicleType?: string;
      seatCount?: number;
      rangeKm?: number;
      batteryCapacity?: number;
      features?: string;
      description?: string;
      imagePaths?: string | string[];
    };
  };
  station: {
    stationId: number;
    name: string;
    address: string;
    hotline?: string;
    openingHours?: string;
    latitude?: number;
    longitude?: number;
  };
  renter?: {
    userId?: number;
    fullName: string;
    email: string;
    phone: string;
    cccd?: string;
    gplx?: string;
    verificationStatus?: string;
  };
}

interface BookingManagementProps {
  authToken: string;
}

/**
 * MAPPING LOGIC - Backend Status → UI Tabs
 * 
 * Backend trả về field `status` (BookingStatus enum):
 * - CONFIRMED: Đã thanh toán cọc 500k (reservationDepositPaid=true), xe RESERVED → Tab "Đã xác nhận"
 * - RENTING: Đã check-in, xe đang được thuê → Tab "Đang thuê"
 * - COMPLETED: Đã trả xe, hoàn tất → Tab "Hoàn thành"
 * - CANCELLED: Đã hủy (staff/customer cancel) → Tab "Đã hủy"
 * 
 * Flow chuyển trạng thái:
 * 1. Customer tạo booking → PENDING
 * 2. Customer thanh toán cọc 500k (webhook/staff confirm) → CONFIRMED
 * 3. Staff bấm "Duyệt Booking (Cọc 2%)" → Tạo QR cọc 2% → Customer quét → RENTING
 * 4. Trả xe và thanh toán → COMPLETED
 * 5. Staff/Customer hủy booking → CANCELLED
 * 
 * Frontend KHÔNG tự thay đổi status, CHỈ đọc từ backend và hiển thị.
 */

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  ALL: { label: 'Tất cả', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  PENDING: { label: 'Chờ thanh toán', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  RENTING: { label: 'Đang thuê', color: 'text-green-700', bgColor: 'bg-green-100' },
  COMPLETED: { label: 'Hoàn thành', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  CANCELLED: { label: 'Đã hủy', color: 'text-red-700', bgColor: 'bg-red-100' },
  CANCELLED_AWAIT_REFUND: { label: 'Chờ hoàn tiền', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  PENDING_REFUND: { label: 'Chờ hoàn tiền (Legacy)', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'text-purple-700', bgColor: 'bg-purple-100' },
};

export function BookingManagement({ authToken }: BookingManagementProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refundBookings, setRefundBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>(() => {
    // Initialize from URL query params if present
    const params = new URLSearchParams(window.location.search);
    return params.get('status') || 'ALL';
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('search') || '';
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [confirmingRefundId, setConfirmingRefundId] = useState<number | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  
  // Refs for cleanup
  const isMountedRef = useRef(true);
  const refreshIntervalRef = useRef<number | null>(null);

  // Update URL when filter/search changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
    if (searchQuery) params.set('search', searchQuery);
    
    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    
    window.history.replaceState({}, '', newUrl);
  }, [selectedStatus, searchQuery]);

  // Fetch data on mount and setup auto-refresh
  useEffect(() => {
    isMountedRef.current = true;
    
    const loadData = async () => {
      await fetchBookings();
      await fetchRefundRequests();
    };
    
    loadData();

    // Set up auto-refresh interval (30 seconds)
    refreshIntervalRef.current = setInterval(() => {
      debugLog('🔄 Auto-refreshing bookings...');
      if (isMountedRef.current) {
        fetchBookings(true); // Silent refresh
        fetchRefundRequests();
      }
    }, 30000) as unknown as number;

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter bookings when dependencies change
  useEffect(() => {
    filterBookings();
  }, [bookings, refundBookings, selectedStatus, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBookings = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    
    try {
      // Fetch ALL bookings without status filter to get complete dataset
      const response = await authenticatedApiCall<Booking[]>(
        API_ENDPOINTS.STAFF_BOOKINGS(),
        authToken
      );
      
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      // ALWAYS log for debugging booking visibility issues
      console.log('📋 [STAFF BOOKINGS] API Response:', response);
      console.log('📋 [STAFF BOOKINGS] Total received:', response.length);
      console.log('📋 [STAFF BOOKINGS] All booking IDs:', response.map((b: any) => b.bookingId).sort((a, b) => b - a));
      
      debugLog('📋 API Response - Staff Bookings:', {
        total: response.length,
        ids: response.map((b: any) => b.bookingId).sort((a, b) => b - a)
      });
      
      // Normalize backend response to match frontend interface
      // Backend: bookingStatus, renterName, vehicleLicensePlate, modelName (flat structure)
      // Frontend: status, renter{}, vehicle{}, station{} (nested structure)
      const normalizedBookings = response.map((b: any) => ({
        ...b,
        status: b.bookingStatus || b.status, // Use bookingStatus from backend
        renter: {
          fullName: b.renterName || 'Khách hàng',
          phone: b.renterPhone || '',
          email: b.renterEmail || '',
        },
        vehicle: {
          vehicleId: b.vehicleId || 0,
          licensePlate: b.vehicleLicensePlate || '—',
          batteryLevel: b.batteryLevel,
          currentMileage: b.currentMileage,
          model: {
            modelName: b.modelName || '—',
            pricePerHour: b.pricePerHour || 0,
          },
        },
        station: {
          stationId: b.stationId || 0,
          name: b.stationName || 'Trạm',
          address: b.stationAddress || '',
        },
      }));
      
      if (isMountedRef.current) {
        setBookings(normalizedBookings);
        setLastRefreshTime(new Date());
        
        // ALWAYS log status distribution
        const statusDist = normalizedBookings.reduce((acc: any, b: any) => {
          acc[b.status] = (acc[b.status] || 0) + 1;
          return acc;
        }, {});
        console.log('📊 [STATUS DISTRIBUTION]:', statusDist);
        console.log('📊 [PENDING bookings]:', normalizedBookings.filter(b => b.status === 'PENDING').map(b => `#${b.bookingId}`));
        
        debugLog('📊 Status Distribution:', statusDist);
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      
      const message = error instanceof Error ? error.message : 'Không thể tải danh sách booking';
      
      if (!silent) {
        setError(message);
        toast.error(message);
      } else {
        debugLog('❌ Silent refresh failed:', message);
      }
      
      setBookings([]);
    } finally {
      if (!silent && isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const fetchRefundRequests = async () => {
    try {
      const response = await authenticatedApiCall<any[]>(
        API_ENDPOINTS.STAFF_REFUND_REQUESTS,
        authToken
      );
      
      if (!isMountedRef.current) return;
      
      console.log('💰 Refund Requests RAW RESPONSE:', response);
      console.log('💰 First item detail:', response[0]);
      
      debugLog('💰 Refund Requests:', {
        total: response.length,
        ids: response.map((r: any) => r.bookingId)
      });
      
      // Map refund response to Booking interface
      // Use actual status from backend instead of hardcoding
      const refunds: Booking[] = response.map((item: any) => ({
        bookingId: item.bookingId,
        startDate: item.startDate,
        endDate: item.endDate || item.startDate,
        status: item.status || item.bookingStatus || 'CANCELLED_AWAIT_REFUND',
        bookingStatus: item.status || item.bookingStatus || 'CANCELLED_AWAIT_REFUND',
        createdAt: item.createdAt,
        finalFee: item.refundAmount || 0,
        refund: item.refundAmount,
        refundNote: item.refundInfo || item.refundNote, // Backend uses 'refundInfo' field
        vehicle: {
          vehicleId: item.vehicleId || 0,
          licensePlate: item.vehicleLicensePlate || '—',
          batteryLevel: item.batteryLevel,
          currentMileage: item.currentMileage,
          model: {
            modelName: item.modelName || '—',
            pricePerHour: 0,
          },
        },
        station: {
          stationId: item.stationId || 0,
          name: item.stationName || 'Trạm',
          address: '',
        },
        renter: {
          fullName: item.renterName || 'Khách hàng',
          email: item.renterEmail || '',
          phone: item.renterPhone || '',
        },
      }));
      
      if (isMountedRef.current) {
        setRefundBookings(refunds);
        
        debugLog('💰 Refund Status Distribution:', 
          refunds.reduce((acc: any, b: any) => {
            acc[b.status] = (acc[b.status] || 0) + 1;
            return acc;
          }, {})
        );
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      
      debugLog('❌ Failed to fetch refund requests:', error);
      // Don't show error toast for refund requests (optional data)
      setRefundBookings([]);
    }
  };

  const filterBookings = useCallback(() => {
    // Merge bookings from multiple sources based on selected tab
    let allBookings: Booking[] = [];
    
    console.log('🔍 [FILTER START] Selected Status:', selectedStatus);
    console.log('🔍 [FILTER START] Regular bookings:', bookings.length);
    console.log('🔍 [FILTER START] Refund bookings:', refundBookings.length);
    
    if (selectedStatus === 'PENDING_REFUND') {
      // Legacy status - only show refund bookings with PENDING_REFUND
      allBookings = refundBookings.filter(b => b.status === 'PENDING_REFUND');
    } else if (selectedStatus === 'CANCELLED_AWAIT_REFUND') {
      // Merge from both regular and refund sources
      const bookingMap = new Map<number, Booking>();
      
      bookings.filter(b => b.status === 'CANCELLED_AWAIT_REFUND')
        .forEach(b => bookingMap.set(b.bookingId, b));
      
      refundBookings.filter(b => b.status === 'CANCELLED_AWAIT_REFUND')
        .forEach(b => {
          if (!bookingMap.has(b.bookingId)) {
            bookingMap.set(b.bookingId, b);
          }
        });
      
      allBookings = Array.from(bookingMap.values());
    } else if (selectedStatus === 'ALL') {
      // Combine all bookings, deduplicate by bookingId
      const bookingMap = new Map<number, Booking>();
      
      bookings.forEach(b => bookingMap.set(b.bookingId, b));
      refundBookings.forEach(b => {
        if (!bookingMap.has(b.bookingId)) {
          bookingMap.set(b.bookingId, b);
        }
      });
      
      allBookings = Array.from(bookingMap.values());
    } else {
      // For specific status tabs, use regular bookings only
      allBookings = bookings;
    }

    let filtered = allBookings;

    debugLog('🔍 Filter state:', {
      total: allBookings.length,
      selectedStatus,
      searchQuery,
      regularBookings: bookings.length,
      refundBookings: refundBookings.length
    });

    // Apply status filter (except for tabs already filtered above)
    if (selectedStatus !== 'ALL' && 
        selectedStatus !== 'PENDING_REFUND' && 
        selectedStatus !== 'CANCELLED_AWAIT_REFUND') {
      filtered = filtered.filter(b => b.status === selectedStatus);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.bookingId?.toString().includes(query) ||
        b.vehicle?.licensePlate?.toLowerCase().includes(query) ||
        b.vehicle?.model?.modelName?.toLowerCase().includes(query) ||
        b.station?.name?.toLowerCase().includes(query) ||
        b.renter?.fullName?.toLowerCase().includes(query)
      );
    }

    // Sort: newest first (by createdAt DESC, fallback to bookingId DESC)
    filtered.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return b.bookingId - a.bookingId;
    });

    console.log('✅ [FILTER RESULT] Total filtered:', filtered.length);
    console.log('✅ [FILTER RESULT] Top 10 IDs:', filtered.slice(0, 10).map(b => `#${b.bookingId} (${b.status})`));
    
    debugLog('✅ Filtered result:', {
      count: filtered.length,
      topIds: filtered.slice(0, 5).map(b => `#${b.bookingId} (${b.status})`)
    });
    
    if (isMountedRef.current) {
      setFilteredBookings(filtered);
    }
  }, [bookings, refundBookings, selectedStatus, searchQuery]);

  const handleViewDetail = (booking: Booking) => {
    debugLog('🔍 Opening booking detail:', {
      id: booking.bookingId,
      status: booking.status,
      vehicle: booking.vehicle.licensePlate
    });
    setSelectedBooking(booking);
    setShowDetailDialog(true);
  };

  const handleStatusUpdate = async (bookingId: number, newStatus: string, note?: string) => {
    try {
      debugLog(`🔄 Updating booking ${bookingId} to ${newStatus}`);
      
      // Handle cancellation via API
      if (newStatus === 'CANCELLED') {
        await authenticatedApiCall(
          `${API_ENDPOINTS.STAFF_BOOKINGS()}/${bookingId}/cancel`,
          authToken,
          { method: 'POST' }
        );
        toast.success('Đã hủy booking thành công');
      }

      // Optimistic UI update
      if (isMountedRef.current) {
        setBookings(prev =>
          prev.map(b =>
            b.bookingId === bookingId ? { ...b, status: newStatus } : b
          )
        );
      }

      // Show toast for non-silent updates
      if (note && note.trim() !== '') {
        const statusLabel = STATUS_CONFIG[newStatus]?.label || newStatus;
        toast.success(`Đã cập nhật trạng thái: "${statusLabel}"`);
      }
      
      // Reload data to sync with backend
      await fetchBookings();
      debugLog(`✅ Booking ${bookingId} updated successfully`);
    } catch (error) {
      debugLog(`❌ Failed to update booking ${bookingId}:`, error);
      toast.error('Không thể cập nhật trạng thái booking');
      throw error;
    }
  };

  const getStatusCount = useCallback((status: string) => {
    // Deduplicate bookings from multiple sources
    const bookingMap = new Map<number, Booking>();
    
    bookings.forEach(b => bookingMap.set(b.bookingId, b));
    refundBookings.forEach(b => {
      if (!bookingMap.has(b.bookingId)) {
        bookingMap.set(b.bookingId, b);
      }
    });
    
    const allBookings = Array.from(bookingMap.values());
    
    if (status === 'ALL') return allBookings.length;
    return allBookings.filter(b => b.status === status).length;
  }, [bookings, refundBookings]);

  const handleConfirmRefund = async (bookingId: number) => {
    if (!window.confirm('Xác nhận đã hoàn tiền cho khách hàng?')) {
      return;
    }

    setConfirmingRefundId(bookingId);
    try {
      await authenticatedApiCall(
        API_ENDPOINTS.STAFF_CONFIRM_REFUND(bookingId),
        authToken,
        { method: 'POST' }
      );
      
      toast.success('Đã xác nhận hoàn tiền thành công');
      
      if (isMountedRef.current) {
        await fetchBookings();
        await fetchRefundRequests();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể xác nhận hoàn tiền';
      toast.error(message);
    } finally {
      if (isMountedRef.current) {
        setConfirmingRefundId(null);
      }
    }
  };

  const handleManualRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchBookings(), fetchRefundRequests()]);
      toast.success('Đã cập nhật danh sách booking');
    } catch (error) {
      // Errors are already handled in fetch functions
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const isNewBooking = (createdAt?: string) => {
    if (!createdAt) return false;
    const bookingTime = new Date(createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - bookingTime.getTime()) / (1000 * 60);
    return diffMinutes <= 5; // Booking mới nếu tạo trong vòng 5 phút
  };

  const formatLastRefreshTime = () => {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - lastRefreshTime.getTime()) / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds} giây trước`;
    }
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes} phút trước`;
    }
    return lastRefreshTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchBookings(false), fetchRefundRequests()]);
      toast.success('Đã cập nhật danh sách booking mới nhất');
    } catch (error) {
      toast.error('Không thể làm mới danh sách');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {['ALL', 'PENDING', 'CONFIRMED', 'RENTING', 'CANCELLED', 'CANCELLED_AWAIT_REFUND'].map((status) => {
          const config = STATUS_CONFIG[status];
          const count = getStatusCount(status);
          return (
            <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus(status)}>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">{config.label}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
          <TabsList>
            <TabsTrigger value="ALL">Tất cả</TabsTrigger>
            <TabsTrigger value="PENDING">Chờ thanh toán</TabsTrigger>
            <TabsTrigger value="CONFIRMED">Đã xác nhận</TabsTrigger>
            <TabsTrigger value="RENTING">Đang thuê</TabsTrigger>
            <TabsTrigger value="COMPLETED">Hoàn thành</TabsTrigger>
            <TabsTrigger value="CANCELLED">Đã hủy</TabsTrigger>
            <TabsTrigger value="CANCELLED_AWAIT_REFUND">Chờ hoàn tiền</TabsTrigger>
            <TabsTrigger value="REFUNDED">Đã hoàn tiền</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm booking, xe, khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleManualRefresh}
            disabled={isLoading}
            title={`Cập nhật lần cuối: ${formatLastRefreshTime()}`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Last refresh time */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>Hiển thị {filteredBookings.length} booking</span>
        <span className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3" />
          Cập nhật: {formatLastRefreshTime()}
        </span>
      </div>

      {/* Bookings List */}
      <Card>
        <CardContent className="p-6">
          {error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-gray-900 font-semibold mb-2">Không thể tải dữ liệu</p>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={handleManualRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Thử lại
              </Button>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Đang tải danh sách booking...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900 font-semibold mb-2">Không có booking nào</p>
              <p className="text-gray-600">
                {searchQuery.trim() 
                  ? `Không tìm thấy kết quả cho "${searchQuery}"`
                  : `Chưa có booking nào ở trạng thái "${STATUS_CONFIG[selectedStatus]?.label}"`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
                const isNew = isNewBooking(booking.createdAt);
                return (
                  <Card
                    key={booking.bookingId}
                    className={`border-2 hover:border-[#FF6B00] transition-colors ${
                      isNew ? 'border-green-400 bg-green-50/30' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Left: Booking Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg ${
                                isNew ? 'bg-green-600' : 'bg-[#FF6B00]'
                              } flex items-center justify-center text-white font-bold`}>
                                #{booking.bookingId}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">
                                    {booking.renter?.fullName || 'Khách hàng'}
                                  </h4>
                                  {isNew && (
                                    <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-0.5">
                                      MỚI
                                    </Badge>
                                  )}
                                </div>
                                {booking.renter?.phone && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>{booking.renter.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                              {statusConfig.label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-xs text-gray-500">Xe</p>
                                <p>{booking.vehicle?.model?.modelName || '—'}</p>
                                <p className="text-xs text-gray-600">{booking.vehicle?.licensePlate || '—'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-xs text-gray-500">Trạm</p>
                                <p>{booking.station?.name || '—'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-xs text-gray-500">Thời gian</p>
                                <p>{formatDate(booking.startDate)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Tổng tiền đã được ẩn */}
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex items-center gap-2">
                          {booking.status === 'PENDING_REFUND' && (
                            <Button
                              onClick={() => handleConfirmRefund(booking.bookingId)}
                              disabled={confirmingRefundId === booking.bookingId}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {confirmingRefundId === booking.bookingId ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  Đang xử lý...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Xác nhận hoàn tiền
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            onClick={() => handleViewDetail(booking)}
                            variant={booking.status === 'PENDING_REFUND' ? 'outline' : 'default'}
                            className={booking.status === 'PENDING_REFUND' ? '' : 'gradient-orange'}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Chi tiết
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedBooking && (
        <BookingDetailDialog
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          booking={selectedBooking}
          authToken={authToken}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
