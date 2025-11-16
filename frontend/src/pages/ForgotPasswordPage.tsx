import { useState } from 'react';
import { Page } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { toast } from 'sonner';
import { Mail, Lock, ArrowLeft, ArrowRight } from 'lucide-react';
import { apiCall, API_ENDPOINTS } from '../lib/api';

interface ForgotPasswordPageProps {
  onNavigate: (page: Page) => void;
}

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    setStep('reset');
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
        body: JSON.stringify({ otp, newPassword, confirmPassword }),
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
              <span className="text-sm text-gray-400 tracking-wider uppercase">Password recovery</span>
            </div>
            <h2 className="text-6xl font-bold mb-4 tracking-tight text-gray-900">
              Reset<span className="text-green-500">.</span>
            </h2>
            <p className="text-lg text-gray-500">
              {step === 'email' && 'Enter your email to receive OTP'}
              {step === 'otp' && 'Enter the OTP sent to your email'}
              {step === 'reset' && 'Create your new password'}
            </p>
          </div>
        </div>

        <Card className="border border-gray-200 shadow-xl rounded-3xl">
          <CardContent className="p-8">
            {step === 'email' && (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-gray-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-12 border-gray-200 rounded-xl focus:border-gray-900"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Send OTP
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>

                <div className="text-center text-sm pt-4">
                  <button
                    type="button"
                    className="text-gray-900 hover:underline font-medium"
                    onClick={() => onNavigate('login')}
                  >
                    Back to login
                  </button>
                </div>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm text-gray-700">OTP Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="h-12 border-gray-200 rounded-xl focus:border-gray-900 text-center text-2xl tracking-widest"
                    maxLength={6}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>

                <div className="text-center text-sm pt-4">
                  <button
                    type="button"
                    className="text-gray-900 hover:underline font-medium"
                    onClick={() => setStep('email')}
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm text-gray-700">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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

                <Button
                  type="submit"
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            )}
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
