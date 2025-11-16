import { Page, User } from '../App';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  ArrowRight,
  Zap,
  Shield,
  Clock,
  MapPin,
  Star,
  CheckCircle,
  User as UserIcon,
  History,
  LogOut,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState, useEffect } from 'react';
import { authenticatedApiCall, API_ENDPOINTS } from '../lib/api';

interface HomePageProps {
  user: User | null;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export function HomePage({ user, onNavigate, onLogout }: HomePageProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState<number>(0);

  // Fetch rating trung bình của tất cả các trạm
  useEffect(() => {
    const fetchGlobalRating = async () => {
      try {
        // Lấy danh sách tất cả các trạm
        const stations = await authenticatedApiCall(API_ENDPOINTS.STATIONS, null);
        console.log('📈 Total stations:', stations.length);
        
        let totalStars = 0;
        let totalCount = 0;
        
        // Lấy rating của từng trạm
        for (const station of stations) {
          try {
            const ratings = await authenticatedApiCall(
              API_ENDPOINTS.STATION_RATINGS(station.stationId),
              null
            );
            
            if (Array.isArray(ratings) && ratings.length > 0) {
              const stationTotal = ratings.reduce((sum: number, r: any) => sum + r.stars, 0);
              totalStars += stationTotal;
              totalCount += ratings.length;
              console.log(`⭐ Station ${station.stationId}: ${ratings.length} ratings`);
            }
          } catch (err) {
            // Bỏ qua trạm không có rating
          }
        }
        
        console.log('📊 Total ratings:', totalCount, 'Average:', totalCount > 0 ? (totalStars / totalCount).toFixed(1) : 'N/A');
        
        if (totalCount > 0) {
          setAverageRating(totalStars / totalCount);
          setTotalRatings(totalCount);
        } else {
          // Nếu chưa có rating nào, set mặc định
          setAverageRating(5.0);
          setTotalRatings(0);
        }
      } catch (error) {
        console.error('Failed to fetch global rating:', error);
        // Fallback nếu lỗi
        setAverageRating(5.0);
        setTotalRatings(0);
      }
    };
    
    fetchGlobalRating();
  }, []);

  const getVerificationBadge = () => {
    if (!user) return null;
    switch (user.verificationStatus) {
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            Đã xác minh
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-0">
            <AlertCircle className="w-3 h-3 mr-1" />
            Chờ xác minh
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-0">
            <XCircle className="w-3 h-3 mr-1" />
            Bị từ chối
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl text-gray-900">
              EV<span className="font-bold">Rental</span><span className="text-green-500">.</span>
            </h1>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6 text-sm">
                <button className="text-gray-900 font-medium hover:text-green-500 transition-colors">Home</button>
                <button onClick={() => onNavigate('stations')} className="text-gray-500 hover:text-gray-900 transition-colors">Stations</button>
                {user && (
                  <button onClick={() => onNavigate('booking-history')} className="text-gray-500 hover:text-gray-900 transition-colors">History</button>
                )}
              </div>

              {user ? (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <div className="hidden sm:block text-right">
                        <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                        <div className="flex items-center justify-end gap-2 mt-0.5">
                          {getVerificationBadge()}
                        </div>
                      </div>
                      <Avatar className="w-9 h-9 border-2 border-gray-200">
                        <AvatarFallback className="bg-gray-100 text-gray-900 font-bold">
                          {user.fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-5 py-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold">
                              {user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-900 text-sm">{user.fullName}</p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
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
                            className="w-full px-5 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors group"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                              <UserIcon className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-sm text-gray-900 font-medium">Cài đặt tài khoản</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              onNavigate('booking-history');
                            }}
                            className="w-full px-5 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors group"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                              <History className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-sm text-gray-900 font-medium">Lịch sử đặt xe</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Logout button - moved to top right */}
                  <Button
                    onClick={onLogout}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 font-medium"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng xuất
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => onNavigate('login')}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Đăng nhập
                  </Button>
                  <Button
                    onClick={() => onNavigate('register')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Đăng ký
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-screen flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1651688730796-151972ba8f87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXNsYSUyMGVsZWN0cmljJTIwdmVoaWNsZXxlbnwxfHx8fDE3NjI1MjA0NzN8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Electric Vehicle"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-8 py-20 w-full">
          <div className="max-w-2xl">
            {/* Background Number */}
            <div className="absolute -left-8 -top-12 text-[200px] font-bold text-white/5 leading-none select-none pointer-events-none">
              01
            </div>

            <div className="relative space-y-6">
              <div>
                <span className="text-xs text-green-400 tracking-wider uppercase font-medium">
                  Electric Vehicle Rental
                </span>
              </div>

              <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-white leading-none">
                Drive<br />
                Electric<span className="text-green-500">.</span>
              </h1>

              <p className="text-lg text-gray-300 leading-relaxed max-w-xl">
                Experience the future of transportation with our premium electric vehicle rental service. 
                Clean, sustainable, and effortless.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-6">
                <Button
                  onClick={() => onNavigate('stations')}
                  className="h-14 px-8 bg-green-600 hover:bg-green-700 text-white rounded-xl text-base shadow-2xl shadow-green-600/20 transition-all"
                >
                  <span>Explore stations</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                {user && (
                  <Button
                    onClick={() => onNavigate('profile')}
                    variant="outline"
                    className="h-14 px-8 bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-base backdrop-blur-sm"
                  >
                    My account
                  </Button>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-6 pt-12 max-w-xl">
                {[
                  { value: '50+', label: 'Vehicles' },
                  { value: '10+', label: 'Stations' },
                  { value: '24/7', label: 'Support' },
                ].map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce z-10">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/60 rounded-full" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-br from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <span className="text-xs text-gray-400 tracking-wider uppercase">Why choose us</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-4">
              Features<span className="text-green-500">.</span>
            </h2>
            <p className="text-base text-gray-500 max-w-2xl mx-auto">
              Everything you need for a seamless electric vehicle rental experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Zap,
                title: 'Instant Booking',
                description: 'Reserve your vehicle in seconds with our streamlined booking process',
                color: 'bg-green-100 text-green-600',
              },
              {
                icon: Shield,
                title: 'Fully Insured',
                description: 'All vehicles covered with comprehensive insurance for your peace of mind',
                color: 'bg-blue-100 text-blue-600',
              },
              {
                icon: Clock,
                title: '24/7 Availability',
                description: 'Pick up and drop off anytime at our automated stations',
                color: 'bg-purple-100 text-purple-600',
              },
              {
                icon: MapPin,
                title: 'Multiple Locations',
                description: 'Convenient stations across the city for easy access',
                color: 'bg-orange-100 text-orange-600',
              },
            ].map((feature, idx) => (
              <Card key={idx} className="border border-gray-200 rounded-2xl hover:border-gray-900 hover:shadow-xl transition-all group">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1760538978585-f82dc257ec15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMGNhciUyMGNoYXJnaW5nJTIwbW9kZXJufGVufDF8fHx8MTc2MjUyMDQ3MHww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Charging"
            className="w-full h-full object-cover opacity-20"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to go<br />electric<span className="text-green-500">?</span>
            </h2>
            <p className="text-base text-gray-300 mb-8 leading-relaxed">
              Join thousands of satisfied customers who have made the switch to electric. 
              Find a station near you and start your journey today.
            </p>

            <Button
              onClick={() => onNavigate('stations')}
              className="h-14 px-10 bg-green-600 hover:bg-green-700 text-white rounded-xl text-base shadow-2xl shadow-green-600/30 transition-all"
            >
              <span>Browse stations</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 mt-16 text-white/60">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                <span className="text-sm">
                  {averageRating !== null 
                    ? totalRatings > 0 
                      ? `${averageRating.toFixed(1)}/5.0 (${totalRatings} đánh giá)`
                      : '5.0/5.0 (Chưa có đánh giá)'
                    : 'Loading...'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">1000+ rentals</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Fully insured</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl text-gray-900">
                EV<span className="font-bold">Rental</span><span className="text-green-500">.</span>
              </h1>
              <p className="text-sm text-gray-500 mt-2">Drive the future, today.</p>
            </div>

            <div className="flex items-center gap-8 text-sm text-gray-600">
              <button className="hover:text-gray-900 transition-colors">Privacy</button>
              <button className="hover:text-gray-900 transition-colors">Terms</button>
              <button className="hover:text-gray-900 transition-colors">Support</button>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-500">
            © 2024 EVRental. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Vertical Navigation */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 hidden xl:block z-40">
        <div className="flex flex-col gap-8 text-xs text-white/60 uppercase tracking-wider">
          <a 
            href="https://www.instagram.com/evolvesp68/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="rotate-180 hover:text-white transition-colors" 
            style={{ writingMode: 'vertical-lr' }}
          >
            Instagram
          </a>
          <a 
            href="https://x.com/volve28729" 
            target="_blank" 
            rel="noopener noreferrer"
            className="rotate-180 hover:text-white transition-colors" 
            style={{ writingMode: 'vertical-lr' }}
          >
            Twitter
          </a>
          <a 
            href="https://www.facebook.com/profile.php?id=61583647976497" 
            target="_blank" 
            rel="noopener noreferrer"
            className="rotate-180 hover:text-white transition-colors" 
            style={{ writingMode: 'vertical-lr' }}
          >
            Facebook
          </a>
        </div>
      </div>
    </div>
  );
}
