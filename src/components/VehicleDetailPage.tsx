import { useState, useEffect } from 'react';
import { Page, User } from '../App';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Battery,
  Gauge,
  Users,
  Zap,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { apiCall, authenticatedApiCall, API_ENDPOINTS } from '../lib/api';

interface VehicleDetailPageProps {
  vehicleId: number;
  authToken: string;
  user: User;
  onNavigate: (page: Page) => void;
  onBack: () => void;
}

interface Vehicle {
  vehicleId: number;
  licensePlate: string;
  batteryLevel: number;
  currentMileage: number;
  status: string;
  condition: string;
  model: {
    modelId: number;
    modelName: string;
    vehicleType: string;
    seatCount: number;
    batteryCapacity: number;
    rangeKm: number;
    features: string;
    pricePerHour: number;
    initialValue: number;
    description: string;
    imageUrl: string;
  };
  station: {
    stationId: number;
    name: string;
    address: string;
  };
}

export function VehicleDetailPage({ vehicleId, authToken, user, onNavigate, onBack }: VehicleDetailPageProps) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Booking dates
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    fetchVehicleDetail();
    initializeDates();
  }, [vehicleId]);

  const initializeDates = () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    setStartDate(now.toISOString().split('T')[0]);
    setStartTime('09:00');
    setEndDate(tomorrow.toISOString().split('T')[0]);
    setEndTime('09:00');
  };

  const fetchVehicleDetail = async () => {
    try {
      const data = await apiCall<Vehicle>(API_ENDPOINTS.VEHICLE_DETAIL(vehicleId));
      setVehicle(data);
    } catch (error) {
      toast.error('Không thể tải thông tin xe');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRentalCost = () => {
    if (!vehicle || !startDate || !startTime || !endDate || !endTime) return null;

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    
    if (hours < 8) return null;

    const totalCost = hours * vehicle.model.pricePerHour;
    const deposit = vehicle.model.initialValue * 0.1;

    return { hours, totalCost, deposit };
  };

  const handleBooking = async () => {
    if (!vehicle || user.verificationStatus !== 'APPROVED') {
      toast.error('Tài khoản của bạn chưa được xác minh');
      return;
    }

    if (!agreedToTerms) {
      toast.error('Bạn phải đồng ý với điều khoản thuê xe');
      return;
    }

    const rental = calculateRentalCost();
    if (!rental || rental.hours < 8) {
      toast.error('Thời gian thuê tối thiểu là 8 giờ');
      return;
    }

    setIsBooking(true);

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
      const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();

      const data = await authenticatedApiCall(
        API_ENDPOINTS.BOOKINGS,
        authToken,
        {
          method: 'POST',
          body: JSON.stringify({
            vehicleId: vehicle.vehicleId,
            stationId: vehicle.station.stationId,
            startTime: startDateTime,
            endTime: endDateTime,
            agreedToTerms: true,
          }),
        }
      );

      toast.success('Đặt xe thành công! Chuyển đến thanh toán...');
      setTimeout(() => {
        onNavigate('payment', data.bookingId);
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || 'Đặt xe thất bại');
    } finally {
      setIsBooking(false);
    }
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

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="mb-2">Không tìm thấy xe</h3>
            <Button onClick={onBack}>Quay lại</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rental = calculateRentalCost();

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
            <div>
              <h1 className="text-xl">Chi tiết xe</h1>
              <p className="text-xs opacity-90">{vehicle.model.modelName}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicle Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <Card className="overflow-hidden">
              <div className="relative h-96">
                <ImageWithFallback
                  src={vehicle.model.imageUrl || 'https://images.unsplash.com/photo-1588681192642-2ad4956e40a7'}
                  alt={vehicle.model.modelName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white text-[#FF6B00]">
                    BSX: {vehicle.licensePlate}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Details */}
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4">{vehicle.model.modelName}</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Battery className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Pin</p>
                      <p>{vehicle.batteryLevel}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Km đã đi</p>
                      <p>{vehicle.currentMileage} km</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Số chỗ</p>
                      <p>{vehicle.model.seatCount} người</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Tầm xa</p>
                      <p>{vehicle.model.rangeKm} km</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="mb-2">Mô tả</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {vehicle.model.description || 'Xe điện hiện đại, thân thiện với môi trường'}
                  </p>
                </div>

                {vehicle.model.features && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="mb-2">Tính năng</h4>
                    <p className="text-gray-600 text-sm">{vehicle.model.features}</p>
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  <h4 className="mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#FF6B00]" />
                    Địa điểm nhận xe
                  </h4>
                  <p className="font-semibold">{vehicle.station.name}</p>
                  <p className="text-sm text-gray-600">{vehicle.station.address}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm text-gray-600 mb-1">Giá thuê</p>
                  <p className="text-2xl text-[#FF6B00]">
                    {vehicle.model.pricePerHour.toLocaleString('vi-VN')} đ<span className="text-sm">/giờ</span>
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Start Date/Time */}
                  <div>
                    <Label>Thời gian nhận xe</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border rounded-md"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* End Date/Time */}
                  <div>
                    <Label>Thời gian trả xe</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border rounded-md"
                          min={startDate}
                        />
                      </div>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cost Summary */}
                  {rental && rental.hours >= 8 ? (
                    <div className="p-4 bg-orange-50 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Thời gian thuê:</span>
                        <span>{rental.hours} giờ</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Phí thuê:</span>
                        <span>{rental.totalCost.toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-orange-200">
                        <span className="text-gray-600">Đặt cọc (10%):</span>
                        <span className="text-[#FF6B00]">{rental.deposit.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
                      <Info className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">
                        Thời gian thuê tối thiểu là 8 giờ
                      </p>
                    </div>
                  )}

                  {/* Terms */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    />
                    <label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                      Tôi đã đọc và đồng ý với{' '}
                      <span className="text-[#FF6B00] hover:underline">
                        Điều khoản thuê xe
                      </span>
                    </label>
                  </div>

                  {/* Verification Check */}
                  {user.verificationStatus !== 'APPROVED' ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-red-800 mb-2">
                            Tài khoản chưa được xác minh
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onNavigate('profile')}
                          >
                            Xác minh ngay
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="w-full gradient-orange hover:opacity-90 h-11"
                      disabled={isBooking || !rental || rental.hours < 8 || !agreedToTerms}
                      onClick={handleBooking}
                    >
                      {isBooking ? 'Đang xử lý...' : 'Đặt xe ngay'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
