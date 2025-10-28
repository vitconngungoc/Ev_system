import { useState, useEffect } from 'react';
import { Page, User } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { toast } from 'sonner';
import {
  Zap,
  Search,
  MapPin,
  Clock,
  Star,
  Phone,
  ChevronRight,
  User as UserIcon,
  History,
  LogOut,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { apiCall, API_ENDPOINTS } from '../lib/api';

interface HomePageProps {
  user: User;
  onNavigate: (page: Page, vehicleId?: number, stationId?: number) => void;
  onLogout: () => void;
}

interface Station {
  stationId: number;
  name: string;
  address: string;
  description: string;
  openingHours: string;
  rating: number;
  hotline: string;
  status: string;
}

export function HomePage({ user, onNavigate, onLogout }: HomePageProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const data = await apiCall<Station[]>(API_ENDPOINTS.STATIONS);
      setStations(data.filter((s: Station) => s.status === 'ACTIVE'));
    } catch (error) {
      toast.error('Không thể tải danh sách trạm');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStations = stations.filter(
    (station) =>
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getVerificationBadge = () => {
    switch (user.verificationStatus) {
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Đã xác minh
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Chờ xác minh
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Bị từ chối
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="gradient-orange text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8" />
              <div>
                <h1 className="text-xl">EV Rental</h1>
                <p className="text-xs opacity-90">Thuê xe điện thông minh</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => onNavigate('history')}
              >
                <History className="w-5 h-5" />
              </Button>
              
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-white text-[#FF6B00]">
                      {user.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{user.fullName}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border py-2 text-gray-700">
                    <div className="px-4 py-3 border-b">
                      <p className="font-semibold">{user.fullName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <div className="mt-2">{getVerificationBadge()}</div>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('profile');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                    >
                      <UserIcon className="w-4 h-4" />
                      Thông tin cá nhân
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B00] to-[#FF8A3D] opacity-20" />
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1713254249770-7e9a688064d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHNjb290ZXIlMjBjaXR5fGVufDF8fHx8MTc2MTA0Nzc4N3ww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Electric Vehicles"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl mb-2">Chào mừng trở lại!</h2>
            <p className="text-lg opacity-90">Tìm trạm gần bạn để bắt đầu thuê xe</p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        <Card className="shadow-xl border-0">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm trạm theo tên hoặc địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Verification Alert */}
        {user.verificationStatus !== 'APPROVED' && (
          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800 mb-1">
                  {user.verificationStatus === 'PENDING' 
                    ? 'Tài khoản đang chờ xác minh'
                    : 'Tài khoản chưa được xác minh'}
                </p>
                <p className="text-sm text-yellow-700">
                  {user.verificationStatus === 'PENDING'
                    ? 'Hồ sơ của bạn đang được nhân viên xác minh. Vui lòng chờ trong vòng 24 giờ.'
                    : 'Bạn cần xác minh tài khoản để có thể đặt xe.'}
                </p>
                {user.verificationStatus === 'REJECTED' && (
                  <Button
                    size="sm"
                    className="mt-2 gradient-orange"
                    onClick={() => onNavigate('profile')}
                  >
                    Xem chi tiết và tải lại
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stations List */}
        <div className="mt-8 mb-8">
          <h3 className="text-xl mb-4">
            {searchQuery ? `Kết quả tìm kiếm (${filteredStations.length})` : 'Tất cả trạm'}
          </h3>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                    <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredStations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Không tìm thấy trạm nào</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStations.map((station) => (
                <Card
                  key={station.stationId}
                  className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-[#FF6B00]"
                  onClick={() => onNavigate('vehicles', undefined, station.stationId)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="mb-1 group-hover:text-[#FF6B00] transition-colors">
                          {station.name}
                        </h4>
                        {station.rating && (
                          <div className="flex items-center gap-1 text-yellow-500 text-sm">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-gray-700">{station.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#FF6B00] group-hover:translate-x-1 transition-all" />
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#FF6B00]" />
                        <span className="line-clamp-2">{station.address}</span>
                      </div>

                      {station.openingHours && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#FF6B00]" />
                          <span>{station.openingHours}</span>
                        </div>
                      )}

                      {station.hotline && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-[#FF6B00]" />
                          <span>{station.hotline}</span>
                        </div>
                      )}
                    </div>

                    {station.description && (
                      <p className="mt-3 text-xs text-gray-500 line-clamp-2">
                        {station.description}
                      </p>
                    )}

                    <Button
                      className="w-full mt-4 gradient-orange hover:opacity-90"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('vehicles', undefined, station.stationId);
                      }}
                    >
                      Xem xe khả dụng
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
