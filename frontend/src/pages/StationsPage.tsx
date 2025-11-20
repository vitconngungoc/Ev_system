import { useState, useEffect } from 'react';
import { Page, User } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import {
  Search,
  MapPin,
  Clock,
  Star,
  Phone,
  ArrowRight,
  User as UserIcon,
  History,
  LogOut,
  AlertCircle,
  CheckCircle,
  XCircle,
  Home as HomeIcon,
} from 'lucide-react';
import { apiCall, authenticatedApiCall, API_ENDPOINTS } from '../lib/api';

interface StationsPageProps {
  user: User;
  onNavigate: (page: Page, vehicleId?: number, stationId?: number) => void;
  onLogout: () => void;
}

interface Station {
  stationId: number;
  name: string;
  address: string;
  description: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  rating: number;
  hotline: string;
  status: string;
  actualRating?: number;  // Rating thực tế từ bảng ratings
  ratingCount?: number;   // Số lượng đánh giá
}

export function StationsPage({ user, onNavigate, onLogout }: StationsPageProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedStationForMap, setSelectedStationForMap] = useState<Station | null>(null);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const data = await apiCall<Station[]>(API_ENDPOINTS.STATIONS);
      const activeStations = data.filter((s: Station) => s.status === 'ACTIVE');
      console.log('🏢 Active stations:', activeStations.length);
      
      // Fetch rating thực tế cho mỗi trạm
      const stationsWithRatings = await Promise.all(
        activeStations.map(async (station) => {
          try {
            // Sử dụng apiCall thay vì authenticatedApiCall vì ratings là public data
            const ratings = await apiCall(
              API_ENDPOINTS.STATION_RATINGS(station.stationId)
            );
            
            console.log(`⭐ Station ${station.stationId} (${station.name}):`, ratings);
            
            if (Array.isArray(ratings) && ratings.length > 0) {
              const totalStars = ratings.reduce((sum: number, r: any) => sum + r.stars, 0);
              const avgRating = totalStars / ratings.length;
              console.log(`  → ${ratings.length} ratings, average: ${avgRating.toFixed(1)}`);
              return {
                ...station,
                actualRating: avgRating,
                ratingCount: ratings.length,
              };
            }
            return { ...station, actualRating: 0, ratingCount: 0 };
          } catch (err) {
            console.error(`❌ Error fetching ratings for station ${station.stationId}:`, err);
            return { ...station, actualRating: 0, ratingCount: 0 };
          }
        })
      );
      
      console.log('📊 Final stations with ratings:', stationsWithRatings);
      setStations(stationsWithRatings);
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
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-0">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-0">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
    }
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
              <div className="hidden md:flex items-center gap-8 text-sm">
                <button onClick={() => onNavigate('home')} className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2">
                  <HomeIcon className="w-4 h-4" />
                  Home
                </button>
                <button className="text-green-500 font-medium">Stations</button>
                <button onClick={() => onNavigate('booking-history')} className="text-gray-500 hover:text-gray-900 transition-colors">History</button>
                <button onClick={() => onNavigate('profile')} className="text-gray-500 hover:text-gray-900 transition-colors">Profile</button>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                  <div className="flex items-center justify-end gap-2 mt-0.5">
                    {getVerificationBadge()}
                  </div>
                </div>
                <Avatar className="w-10 h-10 border-2 border-gray-200">
                  <AvatarFallback className="bg-gray-100 text-gray-900 font-bold">
                    {user.fullName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-6 py-5 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-lg">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{user.fullName}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    {getVerificationBadge()}
                  </div>
                  
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('profile');
                      }}
                      className="w-full px-6 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors group"
                    >
                      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                        <UserIcon className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                      </div>
                      <span className="text-sm text-gray-900 font-medium">Profile settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('booking-history');
                      }}
                      className="w-full px-6 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors group"
                    >
                      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                        <History className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                      </div>
                      <span className="text-sm text-gray-900 font-medium">Booking history</span>
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-100 p-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full px-6 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-red-600 transition-colors rounded-xl group"
                    >
                      <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-600 transition-colors">
                        <LogOut className="w-4 h-4 text-red-600 group-hover:text-white transition-colors" />
                      </div>
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="relative mb-12">
          {/* Background Number */}
          <div className="absolute -left-4 -top-12 text-[200px] font-bold text-gray-100 leading-none select-none pointer-events-none">
            01
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-6">
                <span className="text-sm text-gray-400 tracking-wider uppercase">Welcome back, {user.fullName.split(' ')[0]}</span>
              </div>
              <h1 className="text-8xl font-bold mb-6 tracking-tight text-gray-900">
                Stations<span className="text-green-500">.</span>
              </h1>
              <p className="text-xl text-gray-500 max-w-xl mb-8">
                Tìm trạm gần nhất và bắt đầu hành trình xe điện của bạn
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border border-gray-200 rounded-3xl hover:border-gray-900 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-bold text-gray-900 mb-2">{stations.length}</div>
                  <p className="text-sm text-gray-500">Stations available</p>
                </CardContent>
              </Card>
              <Card className="border border-gray-200 rounded-3xl hover:border-gray-900 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-bold text-green-600 mb-2">24/7</div>
                  <p className="text-sm text-gray-500">Always open</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-16 mb-12">
          <div className="relative max-w-2xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search stations by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-14 text-base border-gray-200 rounded-2xl focus:border-gray-900"
            />
          </div>
        </div>

        {/* Verification Alert */}
        {user.verificationStatus !== 'APPROVED' && (
          <Card className="mb-12 border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white rounded-3xl overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {user.verificationStatus === 'PENDING' 
                      ? 'Đang xác minh tài khoản'
                      : 'Cần xác minh tài khoản'}
                  </h3>
                  <p className="text-base text-gray-600 mb-4 leading-relaxed">
                    {user.verificationStatus === 'PENDING'
                      ? 'Giấy tờ của bạn đang được nhân viên kiểm tra. Thường mất 24 giờ. Chúng tôi sẽ thông báo khi được phê duyệt.'
                      : 'Hoàn tất xác minh tài khoản để bắt đầu đặt xe điện. Tải lên giấy tờ của bạn để bắt đầu.'}
                  </p>
                  {user.verificationStatus !== 'PENDING' && (
                    <Button
                      className="bg-gray-900 hover:bg-gray-800 text-white h-11 px-6 rounded-xl"
                      onClick={() => onNavigate('profile')}
                    >
                      {user.verificationStatus === 'REJECTED' ? 'View details' : 'Start verification'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stations Grid */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900">
              {searchQuery ? `Search results (${filteredStations.length})` : 'Available stations'}
            </h2>
            <p className="text-gray-500">
              {filteredStations.length} location{filteredStations.length !== 1 ? 's' : ''}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse border border-gray-200 rounded-3xl">
                  <CardContent className="p-8">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredStations.length === 0 ? (
            <Card className="border border-gray-200 rounded-3xl">
              <CardContent className="p-20 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No stations found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search terms</p>
                <Button
                  onClick={() => setSearchQuery('')}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                >
                  Clear search
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStations.map((station, index) => (
                <Card
                  key={station.stationId}
                  className="group cursor-pointer border border-gray-200 hover:border-gray-900 transition-all duration-300 hover:shadow-2xl rounded-3xl overflow-hidden relative h-full flex flex-col"
                  onClick={() => onNavigate('vehicles', undefined, station.stationId)}
                >
                  {/* Station Number Badge */}
                  <div className="absolute top-6 left-6 z-10">
                    <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>

                  <CardContent className="p-8 pt-20 flex flex-col flex-1">
                    <div className="mb-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-green-500 transition-colors pr-8">
                          {station.name}
                        </h3>
                        <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                      
                      {/* Hiển thị rating thực tế từ database - chỉ hiện khi có đánh giá */}
                      {station.actualRating !== undefined && station.ratingCount !== undefined && station.ratingCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                          <span className="text-gray-900 font-bold text-lg ml-1">
                            {station.actualRating.toFixed(1)}
                          </span>
                          <span className="text-gray-400 text-sm ml-1">
                            /5.0 ({station.ratingCount})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 mb-8 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-sm text-gray-600 line-clamp-2 pt-1">{station.address}</span>
                      </div>

                      {station.openingHours && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="text-sm text-gray-600 pt-1">{station.openingHours}</span>
                        </div>
                      )}

                      {station.hotline && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Phone className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="text-sm text-gray-600 pt-1">{station.hotline}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Button
                        className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl group-hover:bg-green-600 group-hover:shadow-lg transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('vehicles', undefined, station.stationId);
                        }}
                      >
                        <span>View vehicles</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="w-full h-12 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-2xl transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStationForMap(station);
                        }}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>Xem trên bản đồ</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
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

      {/* Map Dialog */}
      <Dialog open={selectedStationForMap !== null} onOpenChange={(open) => !open && setSelectedStationForMap(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden rounded-3xl border-2 border-gray-900">
          {selectedStationForMap && (
            <>
              <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-bold mb-2">
                      {selectedStationForMap.name}
                    </DialogTitle>
                    <p className="text-white/80 text-sm">{selectedStationForMap.address}</p>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="relative w-full h-[600px] bg-gray-100">
                <iframe
                  title="Station Location"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${selectedStationForMap.latitude},${selectedStationForMap.longitude}&zoom=15`}
                />
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <div className="flex gap-3">
                  <Button
                    className="flex-1 h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl transition-all"
                    onClick={() => {
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${selectedStationForMap.latitude},${selectedStationForMap.longitude}`,
                        '_blank'
                      );
                    }}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Chỉ đường trên Google Maps
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-12 px-6 border-2 border-gray-900 text-gray-900 hover:bg-gray-100 rounded-2xl transition-all"
                    onClick={() => setSelectedStationForMap(null)}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
