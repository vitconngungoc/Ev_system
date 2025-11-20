import { useState, useEffect } from 'react';
import { Page, User } from '../App';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { getConditionLabel } from '../lib/vehicleUtils';
import {
  ArrowLeft,
  Battery,
  Gauge,
  Users,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  Info,
  ArrowRight,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Car,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { apiCall, authenticatedApiCall, API_ENDPOINTS, resolveAssetUrl } from '../lib/api';

interface VehicleDetailPageProps {
  modelId: number;
  stationId: number | null;
  authToken: string;
  user: User;
  onNavigate: (page: Page) => void;
  onBookingCreated: (bookingId: number) => void;
  onBack: () => void;
}

interface Model {
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
  imagePaths?: string[] | null;
}

interface StationDetail {
  stationId: number;
  name: string;
  address: string;
  description?: string;
  hotline?: string;
  openingHours?: string;
}

interface BookingResponse {
  message: string;
  bookingId: number;
  paymentUrl?: string;
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

interface AvailabilityResponse {
  available: boolean;
  message?: string;
}

interface QRCodeData {
  bookingId: number;
  qrCode: string;
}

const MIN_RENTAL_HOURS = 1;
// TODO: Deposit should come from backend API in the future
// For now using a fixed default value
const DEFAULT_DEPOSIT = 500000;

export function VehicleDetailPage({ modelId, stationId, authToken, user, onNavigate, onBookingCreated, onBack }: VehicleDetailPageProps) {
  const [model, setModel] = useState<Model | null>(null);
  const [station, setStation] = useState<StationDetail | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null);
  
  // Image gallery states
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    initializeDates();
    fetchData();
  }, [modelId, stationId]);

  const initializeDates = () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    setStartDate(now.toISOString().split('T')[0]);
    setStartTime('09:00');
    setEndDate(tomorrow.toISOString().split('T')[0]);
    setEndTime('09:00');
  };

  const fetchData = async () => {
    if (!stationId) {
      toast.error('Vui lòng chọn trạm trước');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get models for this station and vehicles for this model
      const [modelsData, stationData, vehiclesData] = await Promise.all([
        apiCall<Model[]>(API_ENDPOINTS.STATION_MODELS(stationId)),
        apiCall<StationDetail>(API_ENDPOINTS.STATION_DETAIL(stationId)),
        apiCall<Vehicle[]>(API_ENDPOINTS.STATION_MODEL_VEHICLES(stationId, modelId)),
      ]);

      // Find the specific model by ID
      const foundModel = modelsData.find(m => m.modelId === modelId);
      
      if (!foundModel) {
        toast.error('Không tìm thấy thông tin xe');
        setIsLoading(false);
        return;
      }

      setModel(foundModel);
      setStation(stationData);
      setVehicles(vehiclesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải thông tin xe');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRentalCost = () => {
    if (!model || !startDate || !startTime || !endDate || !endTime) return null;

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    
    if (hours < MIN_RENTAL_HOURS) return null;

    const totalCost = hours * model.pricePerHour;
    const deposit = DEFAULT_DEPOSIT;

    return { hours, totalCost, deposit };
  };

  const getModelImage = () => {
    if (model?.imagePaths && model.imagePaths.length > 0) {
      return resolveAssetUrl(model.imagePaths[0]) || 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800';
    }
    return 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800';
  };

  const getAllImages = () => {
    if (model?.imagePaths && model.imagePaths.length > 0) {
      return model.imagePaths.map(path => resolveAssetUrl(path) || 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800');
    }
    return ['https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800'];
  };

  const getCurrentImage = () => {
    const images = getAllImages();
    return images[currentImageIndex];
  };

  const handleNextImage = () => {
    const images = getAllImages();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const handlePrevImage = () => {
    const images = getAllImages();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    if (vehicle.status !== 'AVAILABLE') {
      toast.error('Xe này không khả dụng');
      return;
    }
    setSelectedVehicle(vehicle);
    setShowTimeModal(true);
  };

  const handleCloseTimeModal = () => {
    setShowTimeModal(false);
    setSelectedVehicle(null);
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setAgreedToTerms(false);
  };

  // API 2: Check vehicle availability for selected time
  const handleCheckAvailability = async () => {
    if (!selectedVehicle) {
      toast.error('Vui lòng chọn xe');
      return;
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      toast.error('Vui lòng chọn đầy đủ thời gian thuê');
      return;
    }

    const rental = calculateRentalCost();
    if (!rental) {
      toast.error(`Thời gian thuê tối thiểu là ${MIN_RENTAL_HOURS} giờ`);
      return;
    }

    setIsCheckingAvailability(true);
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
      const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();

      // Call API 2: Check if vehicle is available for this time range
      const availabilityData = await apiCall<AvailabilityResponse>(
        API_ENDPOINTS.VEHICLE_AVAILABILITY(
          selectedVehicle.vehicleId,
          startDateTime,
          endDateTime
        )
      );

      if (!availabilityData.available) {
        toast.error(availabilityData.message || 'Xe đã có người đặt trong khung giờ này');
        return;
      }

      toast.success('Xe khả dụng! Bạn có thể đặt xe.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể kiểm tra lịch xe';
      toast.error(message);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // API 3: Create booking with selected vehicle
  const handleBooking = async () => {
    if (!model || !stationId || !selectedVehicle) {
      toast.error('Không tìm thấy thông tin xe hoặc trạm');
      return;
    }

    if (user.verificationStatus !== 'APPROVED') {
      toast.error('Tài khoản của bạn chưa được xác minh');
      return;
    }

    if (!agreedToTerms) {
      toast.error('Bạn phải đồng ý với điều khoản thuê xe');
      return;
    }

    const rental = calculateRentalCost();
    if (!rental) {
      toast.error(`Thời gian thuê tối thiểu là ${MIN_RENTAL_HOURS} giờ`);
      return;
    }

    setIsBooking(true);

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
      const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();

      // API 3: Create booking with vehicleId
      // Backend will:
      // - Create booking with status = PENDING
      // - Change vehicle.status to RESERVED immediately
      // - Return QR code
      const data = await authenticatedApiCall<BookingResponse>(
        API_ENDPOINTS.BOOKINGS,
        authToken,
        {
          method: 'POST',
          body: JSON.stringify({
            vehicleId: selectedVehicle.vehicleId,
            modelId,
            stationId,
            startTime: startDateTime,
            endTime: endDateTime,
            agreedToTerms: true,
          }),
        }
      );

      toast.success(data.message || 'Đặt xe thành công!');

      // If backend returned a paymentUrl (PayOS checkout), open it and store for the payment page
      if (data.paymentUrl) {
        try {
          const storageKey = `paymentUrl_${data.bookingId}`;
          localStorage.setItem(storageKey, data.paymentUrl);
          window.open(data.paymentUrl, '_blank');
        } catch (e) {
          // ignore storage/open errors
        }
      }

      // Close modal and show success
      setShowTimeModal(false);
      onBookingCreated(data.bookingId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đặt xe thất bại';
      toast.error(message);
    } finally {
      setIsBooking(false);
    }
  };

  const getVehicleStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      AVAILABLE: { label: 'Sẵn sàng', className: 'bg-green-100 text-green-800 border-green-200' },
      RESERVED: { label: 'Đã đặt', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      CONFIRMED: { label: 'Đã xác nhận', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      MAINTENANCE: { label: 'Bảo trì', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      IN_USE: { label: 'Đang thuê', className: 'bg-purple-100 text-purple-800 border-purple-200' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={`${config.className} hover:${config.className} border`}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!model || !station) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <Card className="max-w-md border-gray-200">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="mb-4 text-gray-900">Không tìm thấy thông tin xe</h3>
            <Button onClick={onBack} className="bg-gray-900 hover:bg-gray-800">Quay lại</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rental = calculateRentalCost();

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
                onClick={onBack}
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
      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Vehicle Info */}
          <div className="lg:col-span-7 space-y-8">
            <div className="relative">
              {/* Background Number */}
              <div className="absolute -left-4 -top-12 text-[200px] font-bold text-gray-100 leading-none select-none pointer-events-none">
                03
              </div>

              <div className="relative">
                <div className="mb-4">
                  <span className="text-sm text-gray-400 tracking-wider uppercase">Chi tiết xe</span>
                </div>
                <h1 className="text-7xl font-bold mb-4 tracking-tight text-gray-900">
                  {model.modelName}<span className="text-green-500">.</span>
                </h1>
                <p className="text-xl text-gray-500">{model.vehicleType}</p>
              </div>
            </div>

            {/* Image with Navigation */}
            <Card className="overflow-hidden border border-gray-200 rounded-3xl">
              <div className="relative h-[500px] group">
                <ImageWithFallback
                  src={getCurrentImage()}
                  alt={`${model.modelName} - Ảnh ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Vehicle Type Badge */}
                <div className="absolute top-6 right-6">
                  <Badge className="bg-white/90 backdrop-blur-sm text-gray-900 border-0 px-4 py-2">
                    {model.vehicleType}
                  </Badge>
                </div>

                {/* Image Counter Badge */}
                {model.imagePaths && model.imagePaths.length > 1 && (
                  <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-medium">
                    {currentImageIndex + 1} / {model.imagePaths.length}
                  </div>
                )}

                {/* Navigation Arrows - Only show if multiple images */}
                {model.imagePaths && model.imagePaths.length > 1 && (
                  <>
                    {/* Previous Button */}
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-900" />
                    </button>

                    {/* Next Button */}
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-900" />
                    </button>

                    {/* Dot Indicators */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                      {model.imagePaths.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`transition-all ${
                            idx === currentImageIndex
                              ? 'w-8 h-2 bg-white'
                              : 'w-2 h-2 bg-white/50 hover:bg-white/75'
                          } rounded-full`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Users, label: 'Chỗ ngồi', value: `${model.seatCount}`, color: 'text-gray-600' },
                { icon: Battery, label: 'Pin', value: `${model.batteryCapacity} kWh`, color: 'text-green-600' },
                { icon: MapPin, label: 'Phạm vi', value: `${model.rangeKm} km`, color: 'text-blue-600' },
                { icon: Gauge, label: 'Giá/giờ', value: `${(model.pricePerHour / 1000).toFixed(0)}K`, color: 'text-gray-600' },
              ].map((spec, idx) => (
                <Card key={idx} className="border border-gray-200 rounded-2xl hover:border-gray-900 transition-colors">
                  <CardContent className="p-6 text-center">
                    <spec.icon className={`w-6 h-6 ${spec.color} mx-auto mb-3`} />
                    <p className="text-xs text-gray-500 mb-1">{spec.label}</p>
                    <p className="text-lg font-bold text-gray-900">{spec.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Description */}
            <Card className="border border-gray-200 rounded-3xl">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Mô tả</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {model.description || 'Xe điện hiện đại, thân thiện với môi trường'}
                </p>

                {model.features && (
                  <>
                    <h4 className="font-semibold text-gray-900 mb-3">Tính năng</h4>
                    <p className="text-gray-600">{model.features}</p>
                  </>
                )}

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin className="w-5 h-5" />
                    <div>
                      <p className="font-semibold text-gray-900">{station.name}</p>
                      <p className="text-sm">{station.address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Vehicles List */}
            <Card className="border border-gray-200 rounded-3xl mt-8">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Xe khả dụng</h3>
                  {vehicles.length > 0 && (
                    <Badge className="bg-gray-100 text-gray-900 border-gray-200 px-3 py-1 font-bold">
                      {vehicles.filter(v => v.status === 'AVAILABLE').length} xe
                    </Badge>
                  )}
                </div>
                
                {vehicles.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Hiện chưa có xe nào cho model này</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vehicles.map((vehicle) => {
                      const isAvailable = vehicle.status === 'AVAILABLE';
                      const batteryLow = vehicle.batteryLevel < 20;
                      const batteryMedium = vehicle.batteryLevel >= 20 && vehicle.batteryLevel < 80;
                      const batteryHigh = vehicle.batteryLevel >= 80;
                      
                      return (
                        <div
                          key={vehicle.vehicleId}
                          className={`relative p-6 rounded-2xl border-2 transition-all ${
                            isAvailable
                              ? 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-lg'
                              : 'border-gray-200 bg-gray-50 opacity-75'
                          }`}
                        >
                          {/* Header with License Plate and Status */}
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                <Car className="w-5 h-5 text-gray-900" />
                              </div>
                              <h4 className="text-xl font-bold text-gray-900">
                                {vehicle.licensePlate}
                              </h4>
                            </div>
                            {isAvailable && (
                              <Badge className="bg-gray-900 text-white border-0 px-3 py-1.5 font-bold">
                                Khả dụng
                              </Badge>
                            )}
                          </div>

                          {/* Vehicle Details */}
                          <div className="space-y-3.5">
                            {/* Battery Level */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <Battery className={`w-4 h-4 ${
                                  batteryLow ? 'text-red-500' : 
                                  batteryMedium ? 'text-amber-500' : 
                                  'text-gray-900'
                                }`} />
                                <span className="text-sm text-gray-600">Mức pin</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-base ${
                                  batteryLow ? 'text-red-600' : 
                                  batteryMedium ? 'text-amber-600' : 
                                  'text-gray-900'
                                }`}>
                                  {vehicle.batteryLevel}%
                                </span>
                                {batteryLow && (
                                  <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md font-medium">
                                    Yếu
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Mileage */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <Gauge className="w-4 h-4 text-gray-900" />
                                <span className="text-sm text-gray-600">Số km</span>
                              </div>
                              <span className="font-bold text-base text-gray-900">
                                {vehicle.currentMileage.toLocaleString()} km
                              </span>
                            </div>

                            {/* Condition */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-gray-900" />
                                <span className="text-sm text-gray-600">Tình trạng</span>
                              </div>
                              <span className="font-bold text-base text-gray-900">
                                {vehicle.condition ? getConditionLabel(vehicle.condition) : 'Tốt'}
                              </span>
                            </div>
                          </div>

                          {/* Warning Banner if not available */}
                          {!isAvailable && (
                            <div className="mt-5 pt-5 border-t border-gray-200">
                              <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 px-3 py-2.5 rounded-xl border border-amber-200">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span className="font-medium">Xe không khả dụng trong khung giờ này</span>
                              </div>
                            </div>
                          )}

                          {/* Select Button */}
                          {isAvailable && (
                            <div className="mt-5 pt-5 border-t border-gray-100">
                              <button
                                onClick={() => handleVehicleSelect(vehicle)}
                                className="w-full bg-gray-900 hover:bg-black text-white text-center py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                              >
                                <span>Chọn xe này</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Info Only (Booking moved to modal) */}
          <div className="lg:col-span-5">
            <div className="sticky top-32">
              <Card className="border border-gray-200 rounded-3xl overflow-hidden">
                <div className="bg-black text-white p-8">
                  <p className="text-gray-400 text-sm mb-2">Giá thuê</p>
                  <p className="text-5xl font-bold tracking-tight">
                    {(model.pricePerHour / 1000).toFixed(0)}K
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {model.pricePerHour.toLocaleString('vi-VN')} đ/giờ
                  </p>
                </div>

                <CardContent className="p-8 space-y-4">
                  <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                    <div className="flex gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-2">Hướng dẫn đặt xe:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Chọn xe khả dụng từ danh sách bên trái</li>
                          <li>Chọn thời gian thuê xe</li>
                          <li>Kiểm tra lịch xe có trống không</li>
                          <li>Xác nhận đặt xe</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thời gian thuê tối thiểu:</span>
                      <span className="font-semibold text-gray-900">{MIN_RENTAL_HOURS} giờ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tiền đặt cọc:</span>
                      <span className="font-semibold text-gray-900">
                        {DEFAULT_DEPOSIT.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Time Selection Modal */}
      {showTimeModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-0 rounded-3xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Chọn thời gian thuê</h3>
                  <p className="text-gray-600 mt-1">
                    Xe: <span className="font-semibold">{selectedVehicle.licensePlate}</span>
                  </p>
                </div>
                <button
                  onClick={handleCloseTimeModal}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Start Date/Time */}
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">Thời gian nhận xe</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-gray-900 outline-none"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-gray-900 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* End Date/Time */}
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">Thời gian trả xe</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-gray-900 outline-none"
                        min={startDate}
                      />
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-gray-900 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Cost Summary */}
                {(() => {
                  const rental = calculateRentalCost();
                  if (rental && rental.hours >= MIN_RENTAL_HOURS) {
                    return (
                      <div className="p-6 bg-gray-50 rounded-2xl space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Thời gian thuê:</span>
                          <span className="text-gray-900 font-medium">{rental.hours} giờ</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Phí thuê xe:</span>
                          <span className="text-gray-900 font-medium">
                            {rental.totalCost.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                        <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                          <span className="text-gray-600">Tiền đặt cọc:</span>
                          <span className="text-gray-900 font-semibold">
                            {rental.deposit.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>
                    );
                  } else if (startDate && startTime && endDate && endTime) {
                    return (
                      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-2xl flex gap-3">
                        <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                          Thời gian thuê tối thiểu là {MIN_RENTAL_HOURS} giờ
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Check Availability Button */}
                <Button
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl"
                  disabled={isCheckingAvailability || !startDate || !startTime || !endDate || !endTime}
                  onClick={handleCheckAvailability}
                >
                  {isCheckingAvailability ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang kiểm tra...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Kiểm tra lịch xe
                    </div>
                  )}
                </Button>

                {/* Terms */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms-modal"
                    checked={agreedToTerms}
                    onCheckedChange={(checked: boolean) => setAgreedToTerms(checked)}
                  />
                  <label htmlFor="terms-modal" className="text-sm leading-tight cursor-pointer text-gray-600">
                    Tôi đồng ý với{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('terms-of-service')}
                      className="text-[#FF6B00] hover:underline font-medium"
                    >
                      điều khoản thuê xe
                    </button>
                  </label>
                </div>

                {/* Verification Check */}
                {user.verificationStatus !== 'APPROVED' ? (
                  <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-red-800 mb-3">
                          Tài khoản chưa được xác minh
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onNavigate('profile')}
                          className="border-red-300 text-red-700 hover:bg-red-100"
                        >
                          Xác minh ngay
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-base"
                    disabled={
                      isBooking ||
                      !calculateRentalCost() ||
                      (calculateRentalCost()?.hours || 0) < MIN_RENTAL_HOURS ||
                      !agreedToTerms
                    }
                    onClick={handleBooking}
                  >
                    {isBooking ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang xử lý...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Đặt xe ngay
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vertical Navigation */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 hidden xl:block">
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


    </div>
  );
}
