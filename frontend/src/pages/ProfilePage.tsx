import { useState, useEffect, useMemo } from 'react';
import { Page, User } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  Upload,
  CheckCircle,
  AlertCircle,
  XCircle,
  CreditCard,
  FileText,
} from 'lucide-react';
import { authenticatedApiCall, uploadFiles, API_ENDPOINTS, API_BASE_URL } from '../lib/api';

interface ProfilePageProps {
  user: User;
  authToken: string;
  onNavigate: (page: Page) => void;
  onUserUpdate: (user: User) => void;
}

// Helper function to build document URL
function buildDocumentUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}

export function ProfilePage({ user, authToken, onNavigate, onUserUpdate }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [cccdNumber, setCccdNumber] = useState(user.cccd ?? '');
  const [gplxNumber, setGplxNumber] = useState(user.gplx ?? '');

  const [cccdFile1, setCccdFile1] = useState<File | null>(null);
  const [cccdFile2, setCccdFile2] = useState<File | null>(null);
  const [gplxFile1, setGplxFile1] = useState<File | null>(null);
  const [gplxFile2, setGplxFile2] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  // Check if documents have been submitted
  const hasSubmittedDocuments = Boolean(
    user.cccdPath1 &&
    user.cccdPath2 &&
    user.gplxPath1 &&
    user.gplxPath2 &&
    user.selfiePath
  );

  // Build submitted documents list
  const submittedDocuments = useMemo(
    () => [
      { label: 'CCCD mặt trước', url: buildDocumentUrl(user.cccdPath1) },
      { label: 'CCCD mặt sau', url: buildDocumentUrl(user.cccdPath2) },
      { label: 'GPLX mặt trước', url: buildDocumentUrl(user.gplxPath1) },
      { label: 'GPLX mặt sau', url: buildDocumentUrl(user.gplxPath2) },
      { label: 'Ảnh selfie', url: buildDocumentUrl(user.selfiePath) },
    ],
    [user.cccdPath1, user.cccdPath2, user.gplxPath1, user.gplxPath2, user.selfiePath]
  );

  const isAwaitingReview = user.verificationStatus === 'PENDING' && hasSubmittedDocuments;

  // Sync state with user prop
  useEffect(() => {
    setFullName(user.fullName);
    setPhone(user.phone);
    setCccdNumber(user.cccd ?? '');
    setGplxNumber(user.gplx ?? '');
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!fullName || !phone) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsUpdating(true);
    try {
      const data = await authenticatedApiCall<{ user: User }>(
        API_ENDPOINTS.PROFILE_UPDATE,
        authToken,
        {
          method: 'PUT',
          body: JSON.stringify({ fullName, phone }),
        }
      );

      toast.success('Cập nhật thông tin thành công');
      onUserUpdate(data.user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cập nhật thất bại';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUploadVerification = async () => {
    if (!cccdNumber.trim() || !gplxNumber.trim()) {
      toast.error('Vui lòng nhập đầy đủ số CCCD và số GPLX');
      return;
    }

    if (!cccdFile1 || !cccdFile2 || !gplxFile1 || !gplxFile2 || !selfieFile) {
      toast.error('Vui lòng tải lên đầy đủ 5 ảnh');
      return;
    }

    setIsUploading(true);

    try {
      await uploadFiles(API_ENDPOINTS.PROFILE_VERIFICATION_UPLOAD, authToken, {
        cccd: cccdNumber.trim(),
        gplx: gplxNumber.trim(),
        cccdFile1,
        cccdFile2,
        gplxFile1,
        gplxFile2,
        selfieFile,
      });

      toast.success('Tải lên thành công! Vui lòng chờ xác minh trong 24 giờ');
      
      const updatedUser = await authenticatedApiCall<User>(
        API_ENDPOINTS.PROFILE_ME,
        authToken
      );
      onUserUpdate(updatedUser);
      
      setCccdFile1(null);
      setCccdFile2(null);
      setGplxFile1(null);
      setGplxFile2(null);
      setSelfieFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tải lên thất bại';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = () => {
    switch (user.verificationStatus) {
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800 border-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            Đã xác minh
          </Badge>
        );
      case 'PENDING':
        return hasSubmittedDocuments ? (
          <Badge className="bg-yellow-100 text-yellow-800 border-0">
            <AlertCircle className="w-3 h-3 mr-1" />
            Chờ xác minh
          </Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-700 border-0">
            <Upload className="w-4 h-4 mr-1" />
            Chưa gửi hồ sơ
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800 border-0">
            <XCircle className="w-3 h-3 mr-1" />
            Bị từ chối
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-0">Chưa xác minh</Badge>;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (file: File | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must not exceed 5MB');
        return;
      }
      setter(file);
      toast.success(`${file.name} selected`);
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
              <button
                onClick={() => onNavigate('home')}
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
      <div className="max-w-5xl mx-auto px-8 py-20">
        <div className="relative mb-16">
          {/* Background Number */}
          <div className="absolute -left-4 -top-12 text-[200px] font-bold text-gray-100 leading-none select-none pointer-events-none">
            04
          </div>

          <div className="relative">
            <div className="mb-6">
              <span className="text-sm text-gray-400 tracking-wider uppercase">Account settings</span>
            </div>
            <h1 className="text-8xl font-bold mb-6 tracking-tight text-gray-900">
              Profile<span className="text-green-500">.</span>
            </h1>
          </div>
        </div>

        {/* Profile Header Card */}
        <Card className="border border-gray-200 rounded-3xl mb-8">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center text-white text-3xl font-bold">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{user.fullName}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {user.phone}
                  </div>
                </div>
              </div>
              {getStatusBadge()}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 p-1 rounded-2xl h-14">
            <TabsTrigger value="profile" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Personal Information
            </TabsTrigger>
            <TabsTrigger value="verification" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Verification
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="border border-gray-200 rounded-3xl">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm text-gray-700">Full Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-12 h-12 border-gray-200 rounded-xl focus:border-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-gray-700">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      className="pl-12 h-12 border-gray-200 rounded-xl bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm text-gray-700">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-12 h-12 border-gray-200 rounded-xl focus:border-gray-900"
                    />
                  </div>
                </div>

                {user.cccd && (
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">Số CCCD</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        value={user.cccd}
                        disabled
                        className="pl-12 h-12 border-gray-200 rounded-xl bg-gray-50"
                      />
                    </div>
                  </div>
                )}

                {user.gplx && (
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">Số GPLX</Label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        value={user.gplx}
                        disabled
                        className="pl-12 h-12 border-gray-200 rounded-xl bg-gray-50"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleUpdateProfile}
                  disabled={isUpdating}
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                >
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification">
            <Card className="border border-gray-200 rounded-3xl">
              <CardContent className="p-8 space-y-8">
                {user.verificationStatus === 'APPROVED' ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Tài khoản đã xác minh</h3>
                    <p className="text-gray-600">Bạn có thể đặt xe và sử dụng tất cả tính năng</p>
                  </div>
                ) : isAwaitingReview ? (
                  <div>
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-10 h-10 text-yellow-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Hồ sơ đang được xác minh</h3>
                      <p className="text-gray-600">Nhân viên đang kiểm tra hồ sơ của bạn. Vui lòng chờ trong vòng 24 giờ.</p>
                    </div>

                    {/* Display Submitted Documents */}
                    <div className="mt-8">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4">Giấy tờ đã gửi</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {submittedDocuments.map((doc) => (
                          <div key={doc.label} className="border border-gray-200 rounded-xl p-4">
                            <p className="font-medium text-sm text-gray-700 mb-2">{doc.label}</p>
                            {doc.url ? (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 hover:underline font-medium"
                              >
                                Xem ảnh
                              </a>
                            ) : (
                              <span className="text-xs text-gray-500">Đang xử lý</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Not submitted yet warning */}
                    {user.verificationStatus === 'PENDING' && !hasSubmittedDocuments && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-amber-800 mb-1 font-medium">Bạn chưa gửi hồ sơ xác minh</p>
                            <p className="text-xs text-amber-700">
                              Hoàn tất biểu mẫu bên dưới để nhân viên có thể xác minh tài khoản của bạn.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rejection warning */}
                    {user.verificationStatus === 'REJECTED' && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex gap-3">
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-red-800 mb-1 font-medium">Hồ sơ bị từ chối</p>
                            <p className="text-sm text-red-700">
                              Vui lòng tải lại giấy tờ hợp lệ
                            </p>
                            {user.rejectionReason && (
                              <p className="text-xs text-red-600 mt-2">
                                Lý do: {user.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-900">Tải lên tài liệu</h3>
                      <p className="text-gray-600">Vui lòng tải lên ảnh rõ ràng các giấy tờ của bạn</p>
                    </div>

                    {/* CCCD Number */}
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-700">Số CCCD *</Label>
                      <Input
                        value={cccdNumber}
                        onChange={(e) => setCccdNumber(e.target.value)}
                        placeholder="Nhập số CCCD"
                        className="h-12 border-gray-200 rounded-xl"
                      />
                    </div>

                    {/* ID Card Front */}
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-700">CCCD (Mặt trước) *</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setCccdFile1)}
                          className="flex-1 border-gray-200 rounded-xl"
                        />
                        {cccdFile1 && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                    </div>

                    {/* ID Card Back */}
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-700">CCCD (Mặt sau) *</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setCccdFile2)}
                          className="flex-1 border-gray-200 rounded-xl"
                        />
                        {cccdFile2 && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                    </div>

                    {/* GPLX Number */}
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-700">Số GPLX *</Label>
                      <Input
                        value={gplxNumber}
                        onChange={(e) => setGplxNumber(e.target.value)}
                        placeholder="Nhập số GPLX"
                        className="h-12 border-gray-200 rounded-xl"
                      />
                    </div>

                    {/* Driver License Front */}
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-700">GPLX (Mặt trước) *</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setGplxFile1)}
                          className="flex-1 border-gray-200 rounded-xl"
                        />
                        {gplxFile1 && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                    </div>

                    {/* Driver License Back */}
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-700">GPLX (Mặt sau) *</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setGplxFile2)}
                          className="flex-1 border-gray-200 rounded-xl"
                        />
                        {gplxFile2 && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                    </div>

                    {/* Selfie */}
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-700">Ảnh selfie *</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setSelfieFile)}
                          className="flex-1 border-gray-200 rounded-xl"
                        />
                        {selfieFile && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                    </div>

                    <Button
                      onClick={handleUploadVerification}
                      disabled={isUploading || !cccdNumber || !gplxNumber || !cccdFile1 || !cccdFile2 || !gplxFile1 || !gplxFile2 || !selfieFile}
                      className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                    >
                      {isUploading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Đang tải lên...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Gửi tài liệu
                        </div>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
    </div>
  );
}
