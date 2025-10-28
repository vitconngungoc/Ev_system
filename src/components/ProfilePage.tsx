import { useState } from 'react';
import { Page, User } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  CreditCard,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Zap,
} from 'lucide-react';
import { authenticatedApiCall, uploadFiles, API_ENDPOINTS } from '../lib/api';

interface ProfilePageProps {
  user: User;
  authToken: string;
  onNavigate: (page: Page) => void;
  onUserUpdate: (user: User) => void;
}

export function ProfilePage({ user, authToken, onNavigate, onUserUpdate }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Profile form
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);

  // Verification form
  const [cccdNumber, setCccdNumber] = useState('');
  const [gplxNumber, setGplxNumber] = useState('');
  const [cccdFile1, setCccdFile1] = useState<File | null>(null);
  const [cccdFile2, setCccdFile2] = useState<File | null>(null);
  const [gplxFile1, setGplxFile1] = useState<File | null>(null);
  const [gplxFile2, setGplxFile2] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const handleUpdateProfile = async () => {
    if (!fullName || !phone) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsUpdating(true);

    try {
      const data = await authenticatedApiCall(
        API_ENDPOINTS.PROFILE_UPDATE,
        authToken,
        {
          method: 'PUT',
          body: JSON.stringify({ fullName, phone }),
        }
      );

      toast.success('Cập nhật thông tin thành công');
      onUserUpdate(data.user);
    } catch (error: any) {
      toast.error(error.message || 'Cập nhật thất bại');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUploadVerification = async () => {
    if (!cccdNumber || !gplxNumber) {
      toast.error('Vui lòng nhập số CCCD và GPLX');
      return;
    }

    if (!cccdFile1 || !cccdFile2 || !gplxFile1 || !gplxFile2 || !selfieFile) {
      toast.error('Vui lòng tải lên đầy đủ 5 ảnh');
      return;
    }

    setIsUploading(true);

    try {
      await uploadFiles(
        API_ENDPOINTS.PROFILE_VERIFICATION_UPLOAD, 
        authToken, 
        {
          cccdFile1,
          cccdFile2,
          gplxFile1,
          gplxFile2,
          selfieFile,
        },
        {
          cccd: cccdNumber,
          gplx: gplxNumber,
        }
      );

      toast.success('Tải lên thành công! Vui lòng chờ xác minh trong 24 giờ');
      
      const updatedUser = await authenticatedApiCall<User>(
        API_ENDPOINTS.PROFILE_ME,
        authToken
      );
      onUserUpdate(updatedUser);
      
      setCccdNumber('');
      setGplxNumber('');
      setCccdFile1(null);
      setCccdFile2(null);
      setGplxFile1(null);
      setGplxFile2(null);
      setSelfieFile(null);
    } catch (error: any) {
      toast.error(error.message || 'Tải lên thất bại');
    } finally {
      setIsUploading(false);
    }
  };

  const getVerificationStatusBadge = () => {
    switch (user.verificationStatus) {
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Đã xác minh
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-4 h-4 mr-1" />
            Chờ xác minh
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-4 h-4 mr-1" />
            Bị từ chối
          </Badge>
        );
    }
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
              onClick={() => onNavigate('home')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8" />
              <div>
                <h1 className="text-xl">Thông tin cá nhân</h1>
                <p className="text-xs opacity-90">Quản lý tài khoản của bạn</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* User Summary Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full gradient-orange flex items-center justify-center text-white text-2xl">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="mb-1">{user.fullName}</h2>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              <div>{getVerificationStatusBadge()}</div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
            <TabsTrigger value="verification">Xác minh tài khoản</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Cập nhật thông tin</CardTitle>
                <CardDescription>
                  Thay đổi thông tin cá nhân của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      value={user.email}
                      className="pl-10 bg-gray-50"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-gray-500">Email không thể thay đổi</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {user.cccd && (
                  <div className="space-y-2">
                    <Label>Số CCCD</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        value={user.cccd}
                        className="pl-10 bg-gray-50"
                        disabled
                      />
                    </div>
                  </div>
                )}

                {user.gplx && (
                  <div className="space-y-2">
                    <Label>Số GPLX</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        value={user.gplx}
                        className="pl-10 bg-gray-50"
                        disabled
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleUpdateProfile}
                  disabled={isUpdating}
                  className="w-full gradient-orange hover:opacity-90"
                >
                  {isUpdating ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Hồ Sơ & Xác Thực</CardTitle>
                <CardDescription>
                  Quản lý thông tin và xác minh tài khoản
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Thông tin và Cập nhật */}
                  <div className="space-y-6">
                    {/* Thông tin của bạn */}
                    <div>
                      <h3 className="mb-4">Thông tin của bạn</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-gray-600">Họ tên: </span>
                          <span>{user.fullName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Email: </span>
                          <span>{user.email}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">SĐT: </span>
                          <span>{user.phone}</span>
                        </div>
                        {user.cccd && (
                          <div>
                            <span className="text-gray-600">CCCD: </span>
                            <span>{user.cccd}</span>
                          </div>
                        )}
                        {user.gplx && (
                          <div>
                            <span className="text-gray-600">GPLX: </span>
                            <span>{user.gplx}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="mb-4">Cập nhật thông tin</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="updateFullName">Họ và tên</Label>
                          <Input
                            id="updateFullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Nguyễn Văn A"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="updatePhone">Số điện thoại</Label>
                          <Input
                            id="updatePhone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0123456789"
                          />
                        </div>

                        {user.cccd && (
                          <div className="space-y-2">
                            <Label>Số CCCD</Label>
                            <Input
                              value={user.cccd}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                        )}

                        {user.gplx && (
                          <div className="space-y-2">
                            <Label>Số GPLX</Label>
                            <Input
                              value={user.gplx}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                        )}

                        <Button
                          onClick={handleUpdateProfile}
                          disabled={isUpdating}
                          className="w-full gradient-orange hover:opacity-90"
                        >
                          {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Trạng thái xác thực và Upload */}
                  <div className="space-y-6">
                    {/* Trạng thái xác thực */}
                    <div>
                      <h3 className="mb-4">Trạng thái xác thực</h3>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <p className="text-sm text-gray-600 mb-2">Trạng thái:</p>
                        <div className="flex items-center gap-2">
                          {user.verificationStatus === 'APPROVED' && (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="text-green-600">APPROVED</span>
                            </>
                          )}
                          {user.verificationStatus === 'PENDING' && (
                            <>
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                              <span className="text-yellow-600">PENDING</span>
                            </>
                          )}
                          {user.verificationStatus === 'REJECTED' && (
                            <>
                              <XCircle className="w-5 h-5 text-red-600" />
                              <span className="text-red-600">REJECTED</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Upload giấy tờ */}
                    <div className="border-t pt-6">
                      <h3 className="mb-4">Tải lên giấy tờ</h3>
                      
                      {user.verificationStatus === 'APPROVED' ? (
                        <div className="p-6 text-center bg-green-50 rounded-lg border border-green-200">
                          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                          <p className="text-sm text-green-800">
                            Tài khoản đã được xác minh
                          </p>
                        </div>
                      ) : user.verificationStatus === 'PENDING' ? (
                        <div className="p-6 text-center bg-yellow-50 rounded-lg border border-yellow-200">
                          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                          <p className="text-sm text-yellow-800 mb-1">
                            Hồ sơ đang được xác minh
                          </p>
                          <p className="text-xs text-yellow-700">
                            Vui lòng chờ trong 24 giờ
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {user.verificationStatus === 'REJECTED' && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                              <XCircle className="w-4 h-4 inline mr-2" />
                              Hồ sơ bị từ chối. Vui lòng tải lại.
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label>Số CCCD</Label>
                            <Input 
                              placeholder="Nhập số CCCD" 
                              value={cccdNumber}
                              onChange={(e) => setCccdNumber(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Số GPLX</Label>
                            <Input 
                              placeholder="Nhập số GPLX" 
                              value={gplxNumber}
                              onChange={(e) => setGplxNumber(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>CCCD mặt trước</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setCccdFile1(e.target.files?.[0] || null)}
                              className="cursor-pointer"
                            />
                            {cccdFile1 && (
                              <p className="text-xs text-green-600">
                                ✓ {cccdFile1.name}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>CCCD mặt sau</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setCccdFile2(e.target.files?.[0] || null)}
                              className="cursor-pointer"
                            />
                            {cccdFile2 && (
                              <p className="text-xs text-green-600">
                                ✓ {cccdFile2.name}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>GPLX mặt trước</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setGplxFile1(e.target.files?.[0] || null)}
                              className="cursor-pointer"
                            />
                            {gplxFile1 && (
                              <p className="text-xs text-green-600">
                                ✓ {gplxFile1.name}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>GPLX mặt sau</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setGplxFile2(e.target.files?.[0] || null)}
                              className="cursor-pointer"
                            />
                            {gplxFile2 && (
                              <p className="text-xs text-green-600">
                                ✓ {gplxFile2.name}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Ảnh selfie</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                              className="cursor-pointer"
                            />
                            {selfieFile && (
                              <p className="text-xs text-green-600">
                                ✓ {selfieFile.name}
                              </p>
                            )}
                          </div>

                          <Button
                            onClick={handleUploadVerification}
                            disabled={isUploading || !cccdNumber || !gplxNumber || !cccdFile1 || !cccdFile2 || !gplxFile1 || !gplxFile2 || !selfieFile}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {isUploading ? 'Đang gửi...' : 'Gửi yêu cầu xác thực'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


