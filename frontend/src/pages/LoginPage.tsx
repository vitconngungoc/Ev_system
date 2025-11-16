import { useState, useEffect } from 'react';
import { Page } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { apiCall, authenticatedApiCall, API_ENDPOINTS } from '../lib/api';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface LoginPageProps {
  onNavigate: (page: Page) => void;
  onLogin: (token: string, user: any) => void;
}

export function LoginPage({ onNavigate, onLogin }: LoginPageProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Clear redirect flag when component mounts
  useEffect(() => {
    sessionStorage.removeItem('isRedirecting');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier || !password) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsLoading(true);

    try {
      // Call real API
      const data = await apiCall(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });

      // Get user profile
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

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setIsGoogleLoading(true);
    try {
      if (!credentialResponse.credential) {
        throw new Error('Không nhận được thông tin từ Google');
      }

      // Send the ID token to backend
      const data = await apiCall(API_ENDPOINTS.GOOGLE_LOGIN, {
        method: 'POST',
        body: JSON.stringify({ 
          idToken: credentialResponse.credential 
        }),
      });

      // Get user profile
      const user = await authenticatedApiCall(
        API_ENDPOINTS.PROFILE_ME,
        data.token
      );

      toast.success(`Chào mừng, ${user.fullName}!`);
      onLogin(data.token, user);
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Không thể kết nối với Google. Vui lòng thử lại.');
    setIsGoogleLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Hero */}
        <div className="relative">
          {/* Background Number */}
          <div className="absolute -left-8 -top-16 text-[200px] font-bold text-gray-100 leading-none select-none pointer-events-none">
            01
          </div>

          <div className="relative">
            <h1 className="text-2xl text-gray-900 mb-8">
              EV<span className="font-bold">Rental</span><span className="text-green-500">.</span>
            </h1>

            <div className="mb-6">
              <span className="text-sm text-gray-400 tracking-wider uppercase">Sign in</span>
            </div>
            <h2 className="text-7xl font-bold mb-6 tracking-tight text-gray-900">
              Welcome<span className="text-green-500">.</span>
            </h2>
            <p className="text-xl text-gray-500 max-w-lg mb-8">
              Electric vehicle rental made easy and environmentally friendly
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div>
          <Card className="border border-gray-200 shadow-xl">
            <CardContent className="p-10">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sign in to continue</h3>
                <p className="text-sm text-gray-500">Enter your email or phone number</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-sm text-gray-700">Email or Phone</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="example@email.com or 0123456789"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="pl-12 h-12 border-gray-200 rounded-xl focus:border-gray-900"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm text-gray-700">Password</Label>
                    <button
                      type="button"
                      onClick={() => onNavigate('forgot-password')}
                      className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 h-12 border-gray-200 rounded-xl focus:border-gray-900"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-base"
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Sign in
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-4 text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    size="large"
                    width="100%"
                    text="continue_with"
                    shape="rectangular"
                    logo_alignment="left"
                  />
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-4 text-gray-500">New to EVRental?</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-gray-200 hover:border-gray-900 rounded-xl text-base"
                  onClick={() => onNavigate('register')}
                  disabled={isLoading || isGoogleLoading}
                >
                  Create an account
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
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
