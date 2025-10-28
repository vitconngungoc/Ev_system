import { useState } from 'react';
import { Page } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { Zap, Mail, Lock } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { apiCall, authenticatedApiCall, API_ENDPOINTS } from '../lib/api';

interface LoginPageProps {
  onNavigate: (page: Page) => void;
  onLogin: (token: string, user: any) => void;
}

export function LoginPage({ onNavigate, onLogin }: LoginPageProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier || !password) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiCall(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });

      const user = await authenticatedApiCall(
        API_ENDPOINTS.PROFILE_ME,
        data.token
      );

      toast.success(`Chào mừng, ${user.fullName}!`);
      onLogin(data.token, user);
    } catch (error: any) {
      toast.error(error.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B00] to-[#FF8A3D] opacity-90 z-10" />
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1760538978585-f82dc257ec15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZyUyMG1vZGVybnxlbnwxfHx8fDE3NjEwNTMwNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Electric Vehicle"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-white p-12">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-12 h-12" />
            <h1 className="text-5xl">EV Rental</h1>
          </div>
          <p className="text-xl text-center max-w-md opacity-90">
            Thuê xe điện dễ dàng, tiện lợi và thân thiện với môi trường
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-orange flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl text-gradient-orange">EV Rental</h1>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Đăng nhập</CardTitle>
              <CardDescription>
                Nhập email hoặc số điện thoại để đăng nhập
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email hoặc Số điện thoại</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="example@email.com hoặc 0123456789"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-orange hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-[#FF6B00] hover:underline"
                    onClick={() => onNavigate('forgot-password')}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">
                      Hoặc
                    </span>
                  </div>
                </div>

                {/* Google Login - Uncomment when Google OAuth is configured */}
                {/* <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleGoogleLogin}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Đăng nhập với Google
                </Button> */}
              </div>

              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">Chưa có tài khoản? </span>
                <button
                  className="text-[#FF6B00] hover:underline"
                  onClick={() => onNavigate('register')}
                >
                  Đăng ký ngay
                </button>
              </div>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  );
}
