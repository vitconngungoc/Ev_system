import { useState } from 'react';
import { Page } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Lock, KeyRound, Zap } from 'lucide-react';
import { apiCall, API_ENDPOINTS } from '../lib/api';

interface ForgotPasswordPageProps {
  onNavigate: (page: Page) => void;
}

type Step = 'email' | 'otp' | 'password';

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setIsLoading(true);

    try {
      await apiCall(API_ENDPOINTS.FORGOT_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      toast.success('Mã OTP đã được gửi đến email của bạn');
      setStep('otp');
    } catch (error: any) {
      toast.error(error.message || 'Gửi OTP thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp) {
      toast.error('Vui lòng nhập mã OTP');
      return;
    }

    setIsLoading(true);

    try {
      await apiCall(API_ENDPOINTS.VERIFY_OTP, {
        method: 'POST',
        body: JSON.stringify({ otp }),
      });

      toast.success('Xác thực OTP thành công');
      setStep('password');
    } catch (error: any) {
      toast.error(error.message || 'OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error('Vui lòng nhập đầy đủ mật khẩu');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);

    try {
      await apiCall(API_ENDPOINTS.RESET_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({ otp, newPassword }),
      });

      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập');
      onNavigate('login');
    } catch (error: any) {
      toast.error(error.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl gradient-orange flex items-center justify-center shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl text-gradient-orange">EV Rental</h1>
          </div>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('login')}
                className="mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <CardTitle className="text-2xl">Quên mật khẩu</CardTitle>
                <CardDescription className="mt-1">
                  {step === 'email' && 'Nhập email để nhận mã OTP'}
                  {step === 'otp' && 'Nhập mã OTP đã gửi đến email'}
                  {step === 'password' && 'Tạo mật khẩu mới'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Step 1: Email */}
            {step === 'email' && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-orange hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
                </Button>
              </form>
            )}

            {/* Step 2: OTP */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  <p>Mã OTP đã được gửi đến email: <strong>{email}</strong></p>
                  <p className="text-xs mt-1">Mã có hiệu lực trong 1 phút</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Mã OTP</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Nhập 6 số"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="pl-10 text-center tracking-widest"
                      maxLength={6}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-orange hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xác thực...' : 'Xác thực OTP'}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-[#FF6B00] hover:underline"
                    onClick={() => setStep('email')}
                  >
                    Gửi lại mã OTP
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 'password' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Tối thiểu 6 ký tự"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-orange hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Đã nhớ mật khẩu? </span>
              <button
                className="text-[#FF6B00] hover:underline"
                onClick={() => onNavigate('login')}
              >
                Đăng nhập ngay
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
