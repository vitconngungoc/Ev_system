import { useState, useEffect } from 'react';
import { Page } from '../App';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Battery,
  Gauge,
  Users,
  Filter,
  MapPin,
  ArrowRight,
  Calendar,
  Clock,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { apiCall, API_ENDPOINTS, resolveAssetUrl } from '../lib/api';

interface VehicleListingPageProps {
  stationId: number | null;
  onNavigate: (page: Page, vehicleId?: number) => void;
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
  // New fields from backend
  availableVehicleCount?: number;
  totalVehicleCount?: number;
  rentalCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface StationDetail {
  stationId: number;
  name: string;
  address: string;
  description?: string;
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
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [station, setStation] = useState<StationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [seatFilter, setSeatFilter] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('DESC');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (stationId) {
      fetchStationAndVehicles();
    }
  }, [stationId]);

  // Auto-apply filters when criteria change (only for local filters, not time-based)
  useEffect(() => {
    // Only apply local filters if we haven't done a time-based search
    // This prevents conflicts between server-side and client-side filtering
    if (!startDate && !startTime && !endDate && !endTime && models.length > 0) {
      applyLocalFilters();
    }
  }, [models, seatFilter, minPrice, maxPrice, vehicleTypeFilter, sortBy, sortOrder]);

  // Helper function to find max rental count
  const getMaxRentalCount = (modelList: Model[]) => {
    if (modelList.length === 0) return 0;
    return Math.max(...modelList.map(m => typeof m.rentalCount === 'number' ? m.rentalCount : 0));
  };

  const fetchStationAndVehicles = async () => {
    if (!stationId) return;
    
    setIsLoading(true);
    try {
      const stationData = await apiCall<StationDetail>(API_ENDPOINTS.STATION_DETAIL(stationId));
      setStation(stationData);
      
      // Initially load all models without filters
      const modelsData = await apiCall<Model[]>(API_ENDPOINTS.STATION_MODELS(stationId));
      console.log('=== DEBUG RENTAL COUNT ===');
      console.log('Full API Response:', modelsData);
      console.log('Sample model:', modelsData[0]);
      console.log('RentalCount values:', modelsData.map(m => ({ 
        name: m.modelName, 
        rentalCount: m.rentalCount,
        type: typeof m.rentalCount 
      })));
      console.log('========================');
      setModels(modelsData);
      setFilteredModels(modelsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải danh sách xe');
    } finally {
      setIsLoading(false);
    }
  };

  const applyLocalFilters = () => {
    let filtered = [...models];

    // Filter by seat count
    if (seatFilter !== 'all') {
      const seats = parseInt(seatFilter);
      if (!isNaN(seats)) {
        filtered = filtered.filter(m => m.seatCount === seats);
      }
    }

    // Filter by vehicle type
    if (vehicleTypeFilter !== 'all') {
      filtered = filtered.filter(m => m.vehicleType === vehicleTypeFilter);
    }

    // Filter by min price
    if (minPrice && !isNaN(parseFloat(minPrice))) {
      const price = parseFloat(minPrice);
      filtered = filtered.filter(m => m.pricePerHour >= price);
    }

    // Filter by max price
    if (maxPrice && !isNaN(parseFloat(maxPrice))) {
      const price = parseFloat(maxPrice);
      filtered = filtered.filter(m => m.pricePerHour <= price);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'pricePerHour':
          aValue = a.pricePerHour || 0;
          bValue = b.pricePerHour || 0;
          break;
        case 'seatCount':
          aValue = a.seatCount || 0;
          bValue = b.seatCount || 0;
          break;
        case 'rangeKm':
          aValue = a.rangeKm || 0;
          bValue = b.rangeKm || 0;
          break;
        case 'modelName':
          aValue = a.modelName || '';
          bValue = b.modelName || '';
          return sortOrder === 'ASC' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        case 'createdAt':
        default:
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'ASC' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

    setFilteredModels(filtered);
  };

  const handleSearchAvailability = async () => {
    if (!stationId) {
      toast.error('Vui lòng chọn trạm trước');
      return;
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      toast.error('Vui lòng chọn đầy đủ thời gian bắt đầu và kết thúc');
      return;
    }

    // Validate dates
    try {
      const startDateTime = new Date(`${startDate}T${startTime}:00`);
      const endDateTime = new Date(`${endDate}T${endTime}:00`);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        toast.error('Định dạng ngày giờ không hợp lệ');
        return;
      }

      if (startDateTime >= endDateTime) {
        toast.error('Thời gian kết thúc phải sau thời gian bắt đầu');
        return;
      }

      setIsLoading(true);
      
      // Build query params for backend API
      const params = new URLSearchParams();
      params.append('startTime', startDateTime.toISOString());
      params.append('endTime', endDateTime.toISOString());
      
      if (seatFilter !== 'all') {
        params.append('seatCount', seatFilter);
      }
      
      if (vehicleTypeFilter !== 'all') {
        params.append('vehicleType', vehicleTypeFilter);
      }
      
      if (minPrice && !isNaN(parseFloat(minPrice))) {
        params.append('minPrice', minPrice);
      }
      
      if (maxPrice && !isNaN(parseFloat(maxPrice))) {
        params.append('maxPrice', maxPrice);
      }
      
      params.append('sortBy', sortBy);
      params.append('order', sortOrder);

      const endpoint = `${API_ENDPOINTS.STATION_SEARCH_AVAILABLE(stationId)}?${params.toString()}`;
      const availableModels = await apiCall<Model[]>(endpoint);
      
      setModels(availableModels);
      setFilteredModels(availableModels);
      
      if (availableModels.length === 0) {
        toast.info('Không tìm thấy xe khả dụng trong khung giờ này');
      } else {
        toast.success(`Tìm thấy ${availableModels.length} model xe khả dụng`);
      }
    } catch (error) {
      console.error('Error searching available vehicles:', error);
      let errorMessage = 'Không thể tìm kiếm xe khả dụng';
      
      if (error instanceof Error) {
        // Clean up error message - remove timestamp if present
        errorMessage = error.message.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+\d{2}:\d{2}/, 'Lỗi server');
      }
      
      toast.error(errorMessage);
      
      // If search fails, keep showing current models
      // Don't clear the models to maintain user experience
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setSeatFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setVehicleTypeFilter('all');
    setSortBy('createdAt');
    setSortOrder('DESC');
    
    // Reload original models
    if (stationId) {
      fetchStationAndVehicles();
    }
  };

  const getBatteryColor = (level: number) => {
    if (level >= 80) return 'text-green-600';
    if (level >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getModelImage = (model: Model) => {
    if (model.imagePaths && model.imagePaths.length > 0) {
      return resolveAssetUrl(model.imagePaths[0]) || 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800';
    }
    return 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800';
  };

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
        <div className="relative mb-16">
          {/* Background Number */}
          <div className="absolute -left-4 -top-12 text-[200px] font-bold text-gray-100 leading-none select-none pointer-events-none">
            02
          </div>

          <div className="relative">
            <div className="mb-6">
              <span className="text-sm text-gray-400 tracking-wider uppercase">Available vehicles</span>
            </div>
            <h1 className="text-8xl font-bold mb-6 tracking-tight text-gray-900">
              Vehicles<span className="text-green-500">.</span>
            </h1>
            {station && (
              <div className="flex items-start gap-4 text-gray-500 max-w-2xl">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xl text-gray-900 font-medium mb-1">{station.name}</p>
                  <p className="text-base">{station.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-gray-400 uppercase tracking-wider">
              {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''} available
            </p>
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">{showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}</span>
            </Button>
          </div>

          {showFilters && (
            <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-8 shadow-sm">
              {/* Time Filter Section */}
              <div className="mb-8 pb-8 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-gray-700" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Lọc theo thời gian</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Start DateTime */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày bắt đầu</Label>
                    <div className="flex gap-3">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border-gray-200 rounded-2xl h-12 flex-1 text-sm focus:border-gray-900 transition-colors"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="border-gray-200 rounded-2xl h-12 w-32 text-sm focus:border-gray-900 transition-colors"
                      />
                    </div>
                  </div>

                  {/* End DateTime */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày kết thúc</Label>
                    <div className="flex gap-3">
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border-gray-200 rounded-2xl h-12 flex-1 text-sm focus:border-gray-900 transition-colors"
                        min={startDate || new Date().toISOString().split('T')[0]}
                      />
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="border-gray-200 rounded-2xl h-12 w-32 text-sm focus:border-gray-900 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSearchAvailability}
                  disabled={isLoading}
                  className="w-full mt-6 h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-medium transition-all shadow-sm hover:shadow-md"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Tìm xe khả dụng
                </Button>
              </div>

              {/* Other Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Seat Filter */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Số chỗ ngồi
                  </Label>
                  <Select value={seatFilter} onValueChange={setSeatFilter}>
                    <SelectTrigger className="border-gray-200 rounded-2xl h-12 text-sm hover:border-gray-900 transition-colors">
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="2">2 chỗ</SelectItem>
                      <SelectItem value="4">4 chỗ</SelectItem>
                      <SelectItem value="5">5 chỗ</SelectItem>
                      <SelectItem value="7">7 chỗ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Vehicle Type */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Loại xe</Label>
                  <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
                    <SelectTrigger className="border-gray-200 rounded-2xl h-12 text-sm hover:border-gray-900 transition-colors">
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="MOTORCYCLE">Xe máy</SelectItem>
                      <SelectItem value="CAR">Ô tô</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Min Price */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Giá tối thiểu (đ/giờ)</Label>
                  <Input
                    type="number"
                    placeholder="Ví dụ: 20000"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="border-gray-200 rounded-2xl h-12 text-sm focus:border-gray-900 transition-colors"
                    min="0"
                    step="1000"
                  />
                </div>

                {/* Max Price */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Giá tối đa (đ/giờ)</Label>
                  <Input
                    type="number"
                    placeholder="Ví dụ: 50000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="border-gray-200 rounded-2xl h-12 text-sm focus:border-gray-900 transition-colors"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>

              {/* Sort Section */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sắp xếp theo</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="border-gray-200 rounded-2xl h-12 text-sm hover:border-gray-900 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Mới nhất</SelectItem>
                        <SelectItem value="pricePerHour">Giá</SelectItem>
                        <SelectItem value="seatCount">Số chỗ</SelectItem>
                        <SelectItem value="rangeKm">Quãng đường</SelectItem>
                        <SelectItem value="modelName">Tên</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Thứ tự</Label>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                      <SelectTrigger className="border-gray-200 rounded-2xl h-12 text-sm hover:border-gray-900 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ASC">Tăng dần</SelectItem>
                        <SelectItem value="DESC">Giảm dần</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-end mt-6">
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Vehicles Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-gray-200">
                <CardContent className="p-0">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                    <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredModels.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="p-16 text-center">
              <p className="text-gray-500">Không tìm thấy xe phù hợp với bộ lọc</p>
              <Button
                onClick={clearFilters}
                variant="outline"
                className="mt-6 border-gray-200 hover:border-gray-900"
              >
                Xóa bộ lọc
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((model) => {
              const maxRentalCount = getMaxRentalCount(filteredModels);
              // Only show "top rented" badge if at least one vehicle has been rented
              const isTopRented = typeof model.rentalCount === 'number' && 
                                  model.rentalCount > 0 && 
                                  maxRentalCount > 0 &&
                                  model.rentalCount === maxRentalCount;
              
              return (
              <Card
                key={model.modelId}
                className="group overflow-hidden cursor-pointer border border-gray-200 hover:border-gray-900 transition-all duration-300 hover:shadow-xl"
                onClick={() => onNavigate('vehicle-detail', model.modelId)}
              >
                <CardContent className="p-0">
                  <div className="relative h-52 bg-gray-50 overflow-hidden">
                    <ImageWithFallback
                      src={getModelImage(model)}
                      alt={model.modelName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white/90 backdrop-blur-sm text-gray-900 border-0">
                        {model.vehicleType}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-500 transition-colors mb-1">
                          {model.modelName}
                        </h3>
                        <p className="text-sm text-gray-500">{model.description || model.vehicleType}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                    </div>
                    
                    {/* Show rental count and availability - moved below model name */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {isTopRented ? (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 border-2 border-yellow-600 font-bold text-xs shadow-lg">
                          ⭐ Được thuê nhiều nhất ({typeof model.rentalCount === 'number' ? model.rentalCount : 0} lần)
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-50 text-orange-700 border border-orange-200 font-semibold text-xs">
                          🔥 Thuê {typeof model.rentalCount === 'number' ? model.rentalCount : 0} lần
                        </Badge>
                      )}
                      {/* Show availability count if available */}
                      {model.availableVehicleCount !== undefined && model.totalVehicleCount !== undefined && (
                        <Badge className="bg-green-50 text-green-700 border border-green-200 font-semibold text-xs">
                          ✓ {model.availableVehicleCount}/{model.totalVehicleCount} xe khả dụng
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{model.seatCount} seats</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-gray-400" />
                        <span>{model.rangeKm} km</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Price per hour</p>
                        <p className="text-xl font-bold text-gray-900">
                          {model.pricePerHour.toLocaleString('vi-VN')} đ
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gray-900 hover:bg-gray-800 text-white"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          onNavigate('vehicle-detail', model.modelId);
                        }}
                      >
                        View details
                      </Button>
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
