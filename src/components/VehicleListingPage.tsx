import { useState, useEffect } from 'react';
import { Page } from '../App';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Battery,
  Gauge,
  Users,
  Zap,
  Filter,
  MapPin,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { apiCall, API_ENDPOINTS } from '../lib/api';

interface VehicleListingPageProps {
  stationId: number | null;
  onNavigate: (page: Page, vehicleId?: number) => void;
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

export function VehicleListingPage({ stationId, onNavigate, onBack }: VehicleListingPageProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [station, setStation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (stationId) {
      fetchStationAndVehicles();
    }
  }, [stationId, sortBy, sortOrder]);

  const fetchStationAndVehicles = async () => {
    setIsLoading(true);
    try {
      const stationData = await apiCall(API_ENDPOINTS.STATION_DETAIL(stationId!));
      setStation(stationData);

      const vehiclesData = await apiCall<Vehicle[]>(
        API_ENDPOINTS.VEHICLES_BY_STATION(stationId!, sortBy, sortOrder)
      );
      setVehicles(vehiclesData);
    } catch (error) {
      toast.error('Không thể tải danh sách xe');
    } finally {
      setIsLoading(false);
    }
  };

  const getBatteryColor = (level: number) => {
    if (level >= 80) return 'text-green-600';
    if (level >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConditionBadge = (condition: string) => {
    const colors = {
      EXCELLENT: 'bg-green-100 text-green-800',
      GOOD: 'bg-blue-100 text-blue-800',
      MINOR_DAMAGE: 'bg-yellow-100 text-yellow-800',
      MAINTENANCE_REQUIRED: 'bg-red-100 text-red-800',
    };
    return colors[condition as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
              <Zap className="w-8 h-8" />
              <div>
                <h1 className="text-xl">Xe khả dụng</h1>
                {station && (
                  <p className="text-xs opacity-90 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {station.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Station Info */}
        {station && (
          <Card className="mb-6 border-l-4 border-[#FF6B00]">
            <CardContent className="p-4">
              <h3 className="mb-2">{station.name}</h3>
              <p className="text-sm text-gray-600 flex items-start gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {station.address}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm">
              {vehicles.length} xe khả dụng
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Mới nhất</SelectItem>
                <SelectItem value="model.pricePerHour">Giá thuê</SelectItem>
                <SelectItem value="batteryLevel">Mức pin</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Tăng dần</SelectItem>
                <SelectItem value="desc">Giảm dần</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vehicle Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200" />
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="mb-2">Không có xe khả dụng</h3>
              <p className="text-gray-600 mb-4">
                Hiện tại trạm này không có xe nào sẵn sàng cho thuê
              </p>
              <Button onClick={onBack} variant="outline">
                Chọn trạm khác
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <Card
                key={vehicle.vehicleId}
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 hover:border-[#FF6B00]"
                onClick={() => onNavigate('vehicle-detail', vehicle.vehicleId)}
              >
                {/* Vehicle Image */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <ImageWithFallback
                    src={vehicle.model?.imageUrl || 
    'https://images.unsplash.com/photo-1588681192642-2ad4956e40a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMG1vdG9yY3ljbGUlMjBtb2Rlcm58ZW58MXx8fHwxNzYxMDUzMTU2fDA&ixlib=rb-4.1.0&q=80&w=1080'}
                    alt={vehicle.model?.modelName || 'Mẫu xe không rõ'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className={getConditionBadge(vehicle.condition)|| 'Không xác định'}>
                      {vehicle.condition.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-sm">BSX: {vehicle.licensePlate}</p>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h4 className="mb-2 group-hover:text-[#FF6B00] transition-colors">
                    {vehicle.model?.modelName|| 'Mẫu xe không rõ'}
                  </h4>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Battery className={`w-4 h-4 ${getBatteryColor(vehicle.batteryLevel)}`} />
                      <span className="text-gray-600">{vehicle.batteryLevel}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{vehicle.currentMileage} km</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{vehicle.model?.seatCount|| 'Không xác định'} chỗ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{vehicle.model?.rangeKm|| 'Không xác định'} km</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Giá thuê</p>
                      <p className="text-[#FF6B00]">
                        {vehicle.model?.pricePerHour?.toLocaleString('vi-VN') || 0} đ/giờ
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="gradient-orange hover:opacity-90"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('vehicle-detail', vehicle.vehicleId);
                      }}
                    >
                      Chi tiết
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
