import { useState } from 'react';
import { Page } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import { apiCall, API_ENDPOINTS } from '../lib/api';

interface RegisterPageProps {
  onNavigate: (page: Page) => void;
  onLogin: (token: string, user: any) => void;
}

export function RegisterPage({ onNavigate, onLogin }: RegisterPageProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const phonePattern = /^(84|0[35789])[0-9]{8}$/;
    if (!phonePattern.test(phone.trim())) {
      toast.error('Số điện thoại không đúng định dạng');
      return;
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordPattern.test(password)) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!agreedToTerms) {
      toast.error('Bạn phải đồng ý với điều khoản dịch vụ');
      return;
    }

    setIsLoading(true);

    try {
      await apiCall(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        body: JSON.stringify({ fullName, email, phone, password, confirmPassword, agreedToTerms }),
      });

      toast.success('Đăng ký thành công! Vui lòng đăng nhập');
      onNavigate('login');
    } catch (error: any) {
      toast.error(error.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="relative mb-12">
          {/* Background Number */}
          <div className="absolute -left-8 -top-16 text-[200px] font-bold text-gray-100 leading-none select-none pointer-events-none opacity-50">
            01
          </div>

          <div className="relative">
            <h1 className="text-2xl text-gray-900 mb-8">
              EV<span className="font-bold">Rental</span><span className="text-green-500">.</span>
            </h1>

            <div className="mb-4">
              <span className="text-sm text-gray-400 tracking-wider uppercase">Create account</span>
            </div>
            <h1 className="text-8xl font-bold mb-6 tracking-tight text-gray-900">
              Register<span className="text-green-500">.</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-md">
              Bắt đầu hành trình xe điện của bạn ngay hôm nay
            </p>
          </div>
        </div>

        <Card className="border border-gray-200 shadow-xl">
          <CardContent className="p-8">
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm text-gray-700">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Nguyen Van A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-12 h-12 border-gray-200 rounded-xl focus:border-gray-900"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-gray-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 border-gray-200 rounded-xl focus:border-gray-900"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm text-gray-700">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0901234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-12 h-12 border-gray-200 rounded-xl focus:border-gray-900"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-12 border-gray-200 rounded-xl focus:border-gray-900"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm text-gray-700">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-12 h-12 border-gray-200 rounded-xl focus:border-gray-900"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  disabled={isLoading}
                />
                <label htmlFor="terms" className="text-sm leading-tight cursor-pointer text-gray-600">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('terms-of-service')}
                    className="text-[#FF6B00] hover:underline font-medium"
                  >
                    Terms of Service
                  </button>
                  {' '}and{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('privacy-policy')}
                    className="text-[#FF6B00] hover:underline font-medium"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Create account
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>

              <div className="text-center text-sm pt-4">
                <span className="text-gray-600">Already have an account? </span>
                <button
                  type="button"
                  className="text-gray-900 hover:underline font-medium"
                  onClick={() => onNavigate('login')}
                >
                  Sign in
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
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
