import { useState, useEffect } from 'react';
import { User, Page } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { toast } from 'sonner';
import {
  Zap,
  LogOut,
  Users,
  FileCheck,
  ClipboardList,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Home,
} from 'lucide-react';
import { VerificationDetailDialog } from './staff/VerificationDetailDialog';
import { BookingManagement } from './staff/BookingManagement';
import { VehicleManagement } from './staff/VehicleManagement';
import { authenticatedApiCall, API_ENDPOINTS } from '../lib/api';

interface StaffDashboardProps {
  user: User;
  authToken: string;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

interface PendingUser {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  cccd: string;
  gplx: string;
  cccdPath1: string;
  cccdPath2: string;
  gplxPath1: string;
  gplxPath2: string;
  selfiePath: string;
  verificationStatus: string;
}

interface VerificationStats {
  pending: number;
  approvedSession: number;
  rejectedSession: number;
}

export function StaffDashboard({ user, authToken, onNavigate, onLogout }: StaffDashboardProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // Track verification statistics from backend
  // Note: Backend không hỗ trợ timestamp cho verify/reject actions
  // Chỉ có thể tracking pending count từ backend và session-based counts cho approved/rejected
  const [verificationStats, setVerificationStats] = useState<VerificationStats>({
    pending: 0,
    approvedSession: 0,
    rejectedSession: 0,
  });

  useEffect(() => {
    fetchVerificationData();
  }, []);

  const fetchVerificationData = async () => {
    setIsLoading(true);
    try {
      // Fetch pending verifications from backend
      const pending = await authenticatedApiCall<PendingUser[]>(
        API_ENDPOINTS.STAFF_VERIFICATIONS_PENDING,
        authToken
      );
      
      setPendingUsers(pending);
      
      // Update pending count từ backend (real-time data)
      // Approved/rejected counts giữ nguyên từ session (không có API backend hỗ trợ)
      setVerificationStats(prev => ({
        ...prev,
        pending: pending.length,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải dữ liệu xác minh';
      toast.error(message);
      setPendingUsers([]);
      setVerificationStats(prev => ({
        ...prev,
        pending: 0,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingVerifications = async () => {
    // Alias for backward compatibility
    await fetchVerificationData();
  };

  const handleViewDetail = (pendingUser: PendingUser) => {
    setSelectedUser(pendingUser);
    setShowDetailDialog(true);
  };

  const handleVerificationComplete = async (action: 'approved' | 'rejected') => {
    // Close dialog first
    setShowDetailDialog(false);
    setSelectedUser(null);
    
    // Increment session counter for approved/rejected
    setVerificationStats(prev => ({
      ...prev,
      approvedSession: action === 'approved' ? prev.approvedSession + 1 : prev.approvedSession,
      rejectedSession: action === 'rejected' ? prev.rejectedSession + 1 : prev.rejectedSession,
    }));
    
    // Re-fetch pending verifications from backend to get updated count
    await fetchVerificationData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-orange flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl">Staff Dashboard</h1>
                <p className="text-xs text-gray-500">EV Rental System</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right mr-3">
                <p className="text-sm font-semibold">{user.fullName}</p>
                <Badge variant="outline" className="text-xs">
                  {user.role.roleName}
                </Badge>
              </div>
              <Avatar>
                <AvatarFallback className="bg-[#FF6B00] text-white">
                  {user.fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('home')}
                className="text-gray-600 hover:text-[#FF6B00]"
                title="Trang chủ"
              >
                <Home className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="text-gray-600 hover:text-red-600"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Chờ xác minh</p>
                  <p className="text-3xl text-[#FF6B00]">{verificationStats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-[#FF6B00]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đã xác minh</p>
                  <p className="text-3xl text-green-600">{verificationStats.approvedSession}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đã từ chối</p>
                  <p className="text-3xl text-red-600">{verificationStats.rejectedSession}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="verifications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="verifications" className="flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              Xác minh khách hàng
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Quản lý Booking
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Quản lý Xe
            </TabsTrigger>
          </TabsList>

          {/* Verifications Tab */}
          <TabsContent value="verifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Danh sách chờ xác minh</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchPendingVerifications}
                  >
                    Làm mới
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải...</p>
                  </div>
                ) : pendingUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Không có yêu cầu xác minh nào</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map((pendingUser) => (
                      <Card key={pendingUser.userId} className="border-2 hover:border-[#FF6B00] transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback className="bg-gray-200 text-gray-700">
                                  {pendingUser.fullName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="mb-1">{pendingUser.fullName}</h4>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>{pendingUser.email}</span>
                                  <span>{pendingUser.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                  <span>CCCD: {pendingUser.cccd || 'N/A'}</span>
                                  <span>•</span>
                                  <span>GPLX: {pendingUser.gplx || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleViewDetail(pendingUser)}
                              className="gradient-orange"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Xác minh
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <BookingManagement authToken={authToken} />
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles">
            <VehicleManagement authToken={authToken} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Verification Detail Dialog */}
      {selectedUser && (
        <VerificationDetailDialog
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          user={selectedUser}
          authToken={authToken}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </div>
  );
}
