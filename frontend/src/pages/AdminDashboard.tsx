import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Page, User as AppUser } from '../App';
import { authenticatedApiCall, API_ENDPOINTS, apiCall, resolveAssetUrl, uploadFiles } from '../lib/api';
import { getConditionLabel } from '../lib/vehicleUtils';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import {
  BarChart3,
  Building2,
  Car,
  History as HistoryIcon,
  Home,
  Loader2,
  LogOut,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  Users,
  AlertCircle,
} from 'lucide-react';
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Line,
  LineChart,
  Tooltip
} from 'recharts';

const STATION_STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] as const;
type StationStatus = (typeof STATION_STATUS_OPTIONS)[number];

const VEHICLE_STATUS_OPTIONS = ['AVAILABLE', 'RESERVED', 'RENTED', 'UNAVAILABLE'] as const;
type VehicleStatusOption = (typeof VEHICLE_STATUS_OPTIONS)[number];

const VEHICLE_CONDITION_OPTIONS = ['EXCELLENT', 'GOOD', 'MINOR_DAMAGE', 'MAINTENANCE_REQUIRED'] as const;
type VehicleConditionOption = (typeof VEHICLE_CONDITION_OPTIONS)[number];

// Backend chỉ hỗ trợ 2 trạng thái account: ACTIVE, INACTIVE (không có BANNED)
const ACCOUNT_STATUS_OPTIONS = ['ACTIVE', 'INACTIVE'] as const;
type AccountStatusOption = (typeof ACCOUNT_STATUS_OPTIONS)[number];

type VerificationStatusOption = 'PENDING' | 'APPROVED' | 'REJECTED';

interface AdminStation {
  stationId: number;
  name: string;
  address: string;
  description?: string | null;
  openingHours?: string | null;
  hotline?: string | null;
  status: StationStatus;
}

interface StationFormState {
  name: string;
  address: string;
  description: string;
  openingHours: string;
  hotline: string;
  status: StationStatus;
}

interface AdminVehicle {
  vehicleId: number;
  licensePlate: string;
  batteryLevel?: number | null;
  modelName?: string | null;
  stationName?: string | null;
  stationId?: number | null;
  currentMileage?: number | null;
  status?: string | null;
  condition?: string | null;
}

interface VehicleFormState {
  licensePlate: string;
  batteryLevel: string;
  modelId: string;
  stationId: string;
  currentMileage: string;
  status: VehicleStatusOption;
  condition: VehicleConditionOption;
}

type AdminModelImage = {
  imageUrl?: string | null;
  url?: string | null;
  path?: string | null;
};

interface AdminModel {
  modelId: number;
  modelName: string;
  vehicleType?: string | null;
  seatCount?: number | null;
  batteryCapacity?: number | null;
  rangeKm?: number | null;
  features?: string | null;
  pricePerHour?: number | null;
  initialValue?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  images?: Array<AdminModelImage | string | null> | null;
}

interface ModelFormState {
  modelName: string;
  vehicleType: string;
  seatCount: string;
  batteryCapacity: string;
  rangeKm: string;
  features: string;
  pricePerHour: string;
  initialValue: string;
  description: string;
  existingImageUrls: string[];
  imageFiles: File[];
}

interface AdminUser {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  status: AccountStatusOption;
  verificationStatus: VerificationStatusOption;
  role: {
    roleId?: number;
    roleName: string;
  };
  station?: {
    stationId: number;
    name: string;
  } | null;
  cccd?: string | null;
  gplx?: string | null;
  cccdPath1?: string | null;
  cccdPath2?: string | null;
  gplxPath1?: string | null;
  gplxPath2?: string | null;
  selfiePath?: string | null;
  rejectionReason?: string | null;
}

interface RoleOption {
  roleId: number;
  roleName: string;
}

interface VehicleHistoryRecord {
  historyId: number;
  vehicleType?: string | null;  // Backend trả về VehicleType enum
  licensePlate?: string | null;
  staffName?: string | null;
  renterName?: string | null;
  stationName?: string | null;
  actionType: string;
  note?: string | null;
  batteryLevel?: number | null;
  mileage?: number | null;
  actionTime: string; // LocalDateTime từ backend
  conditionBefore?: string | null;
  conditionAfter?: string | null;
  photoPath?: string | null; // JSON string của array paths
}

interface RevenueReport {
  stationName: string;
  stationId?: number | null;
  totalBookingRevenue: number;
  totalPenaltyRevenue: number;
  totalRevenue: number;
  fromDate: string | { year: number; month: number; day: number };
  toDate: string | { year: number; month: number; day: number };
  totalTransactions: number;
}

// Backend response from /admin/statistics/peak-hour
interface PeakHourStatistics {
  scope: string;
  fromDate: { year: number; month: number; day: number };
  toDate: { year: number; month: number; day: number };
  totalRentals: number;
  peakHour: string;
  data: Array<{
    hourRange: string;
    rentedVehicles: number;
    percentOfPeak: number;
  }>;
}

// Backend response from /admin/stations/report (vehicle stats)
interface StationReport {
  stationId: number;
  stationName: string;
  AVAILABLE: number;
  RENTED: number;
  RESERVED: number;
  UNAVAILABLE: number;
  rentedRate: number;
  demandLevel: string;
}

interface RevenueFilters {
  stationId: string;
  from: string;
  to: string;
}

interface AdminDashboardProps {
  user: AppUser;
  authToken: string;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const initialStationForm: StationFormState = {
  name: '',
  address: '',
  description: '',
  openingHours: '',
  hotline: '',
  status: 'ACTIVE',
};

const initialVehicleForm: VehicleFormState = {
  licensePlate: '',
  batteryLevel: '',
  modelId: '',
  stationId: '',
  currentMileage: '',
  status: 'AVAILABLE',
  condition: 'GOOD',
};

const createInitialModelForm = (): ModelFormState => ({
  modelName: '',
  vehicleType: '',
  seatCount: '',
  batteryCapacity: '',
  rangeKm: '',
  features: '',
  pricePerHour: '',
  initialValue: '',
  description: '',
  existingImageUrls: [],
  imageFiles: [],
});

const initialRevenueFilters: RevenueFilters = {
  stationId: 'ALL',
  from: '',
  to: '',
};

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

function formatLocalDate(value?: string | { year: number; month: number; day: number } | null): string {
  if (!value) {
    return '—';
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  // Handle LocalDate object from backend
  if (typeof value === 'object' && 'year' in value && 'month' in value && 'day' in value) {
    const { year, month, day } = value;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  
  return '—';
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('vi-VN');
}

export function AdminDashboard({ user, authToken, onNavigate, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('stations');

  const [stations, setStations] = useState<AdminStation[]>([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationForm, setStationForm] = useState<StationFormState>(initialStationForm);
  const [editingStationId, setEditingStationId] = useState<number | null>(null);
  const [stationSubmitting, setStationSubmitting] = useState(false);

  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehicleForm, setVehicleForm] = useState<VehicleFormState>(initialVehicleForm);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');

  const [models, setModels] = useState<AdminModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelForm, setModelForm] = useState<ModelFormState>(() => createInitialModelForm());
  const [modelImagesInputKey, setModelImagesInputKey] = useState(0);
  const [editingModelId, setEditingModelId] = useState<number | null>(null);
  const [modelSubmitting, setModelSubmitting] = useState(false);
  const stationFormRef = useRef<HTMLDivElement>(null);
  const vehicleFormRef = useRef<HTMLDivElement>(null);
  const modelFormRef = useRef<HTMLDivElement>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [userStatusUpdating, setUserStatusUpdating] = useState(false);
  const [userRoleUpdating, setUserRoleUpdating] = useState(false);
  const [userStationUpdating, setUserStationUpdating] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userTabType, setUserTabType] = useState<'customers' | 'staff'>('customers');

  const [historyRecords, setHistoryRecords] = useState<VehicleHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    stationId: '',
    from: '',
    to: '',
    vehicleType: '',
    licensePlate: '',
  });

  // Damage reports state
  const [damageReports, setDamageReports] = useState<VehicleHistoryRecord[]>([]);
  const [damageReportsLoading, setDamageReportsLoading] = useState(false);
  const [selectedDamageReport, setSelectedDamageReport] = useState<VehicleHistoryRecord | null>(null);
  const [showDamageReportModal, setShowDamageReportModal] = useState(false);

  const [revenueFilters, setRevenueFilters] = useState<RevenueFilters>(initialRevenueFilters);
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [peakHourStats, setPeakHourStats] = useState<PeakHourStatistics | null>(null);
  const [stationReports, setStationReports] = useState<StationReport[]>([]);
  const [stationRevenueData, setStationRevenueData] = useState<Array<{
    stationName: string;
    totalRevenue: number;
    totalBookingRevenue: number;
    totalPenaltyRevenue: number;
  }>>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedUser = useMemo(() => {
    if (selectedUserId == null) {
      return null;
    }
    return users.find((candidate) => candidate.userId === selectedUserId) ?? null;
  }, [selectedUserId, users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Filter by search query
      const matchesSearch = userSearchQuery === '' || 
        user.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.fullName.toLowerCase().includes(userSearchQuery.toLowerCase());
      
      // Filter by user type (staff vs customers)
      const roleName = user.role?.roleName?.toUpperCase();
      const isStaff = roleName === 'STATION_STAFF' || roleName === 'ADMIN' || roleName === 'EV_ADMIN';
      const matchesType = userTabType === 'staff' ? isStaff : !isStaff;
      
      return matchesSearch && matchesType;
    });
  }, [users, userSearchQuery, userTabType]);

  // Check if selected user is staff (for station assignment)
  const isSelectedUserStaff = useMemo(() => {
    if (!selectedUser?.role?.roleName) return false;
    const roleName = selectedUser.role.roleName.toUpperCase();
    return roleName === 'STATION_STAFF';
  }, [selectedUser]);

  // Check if selected user is customer (for verification documents and rejection reason)
  const isSelectedUserCustomer = useMemo(() => {
    if (!selectedUser?.role?.roleName) return false;
    const roleName = selectedUser.role.roleName.toUpperCase();
    return roleName === 'CUSTOMER' || roleName === 'EV_RENTER';
  }, [selectedUser]);

  // Check if selected user is admin (to prevent role change)
  const isSelectedUserAdmin = useMemo(() => {
    if (!selectedUser?.role?.roleName) return false;
    const roleName = selectedUser.role.roleName.toUpperCase();
    return roleName === 'ADMIN' || roleName === 'EV_ADMIN';
  }, [selectedUser]);

  const loadStations = useCallback(async () => {
    setStationsLoading(true);
    try {
      const data = await authenticatedApiCall<AdminStation[]>(API_ENDPOINTS.ADMIN_STATIONS, authToken);
      const mapped = data.map((station) => ({
        stationId: station.stationId,
        name: station.name,
        address: station.address,
        description: station.description ?? '',
        openingHours: station.openingHours ?? '',
        hotline: station.hotline ?? '',
        status: (station.status ?? 'ACTIVE') as StationStatus,
      }));
      setStations(mapped);
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách trạm:', error);
      // Only show toast if it's not a network/connection error
      if (error?.message && !error.message.includes('Failed to fetch')) {
        toast.error(error.message);
      }
    } finally {
      setStationsLoading(false);
    }
  }, [authToken]);

  const loadVehicles = useCallback(async () => {
    setVehiclesLoading(true);
    try {
      const data = await authenticatedApiCall<AdminVehicle[]>(API_ENDPOINTS.ADMIN_VEHICLES, authToken);
      setVehicles(data);
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách xe:', error);
      if (error?.message && !error.message.includes('Failed to fetch')) {
        toast.error(error.message);
      }
    } finally {
      setVehiclesLoading(false);
    }
  }, [authToken]);

  const loadModels = useCallback(async () => {
    setModelsLoading(true);
    try {
      const data = await authenticatedApiCall<AdminModel[]>(API_ENDPOINTS.ADMIN_MODELS, authToken);
      setModels(data);
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách mẫu xe:', error);
      if (error?.message && !error.message.includes('Failed to fetch')) {
        toast.error(error.message);
      }
    } finally {
      setModelsLoading(false);
    }
  }, [authToken]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await authenticatedApiCall<AdminUser[]>(API_ENDPOINTS.ADMIN_USERS, authToken);
      setUsers(data);

      const uniqueRoles = new Map<number, string>();
      data.forEach((item) => {
        if (item.role?.roleId != null) {
          uniqueRoles.set(item.role.roleId, item.role.roleName);
        }
      });
      setRoleOptions(Array.from(uniqueRoles.entries()).map(([roleId, roleName]) => ({ roleId, roleName })));
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách người dùng:', error);
      if (error?.message && !error.message.includes('Failed to fetch')) {
        toast.error(error.message);
      }
    } finally {
      setUsersLoading(false);
    }
  }, [authToken]);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([loadStations(), loadVehicles(), loadModels(), loadUsers()]);
      toast.success('Đã làm mới dữ liệu quản trị');
    } catch (error: any) {
      console.error('Lỗi khi làm mới dữ liệu:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadStations, loadVehicles, loadModels, loadUsers]);

  const loadDamageReports = useCallback(async () => {
    setDamageReportsLoading(true);
    try {
      const data = await authenticatedApiCall<VehicleHistoryRecord[]>(
        API_ENDPOINTS.ADMIN_VEHICLE_HISTORY, 
        authToken
      );
      // Filter MAINTENANCE records with photos (damage reports from staff)
      const damageOnly = Array.isArray(data) 
        ? data.filter(record => 
            record.actionType === 'MAINTENANCE' && 
            record.photoPath != null && 
            record.photoPath.trim() !== ''
          ) 
        : [];
      setDamageReports(damageOnly);
    } catch (error: any) {
      toast.error(error?.message ?? 'Không thể tải báo cáo hư hỏng');
      setDamageReports([]);
    } finally {
      setDamageReportsLoading(false);
    }
  }, [authToken]);

  // Helper function to parse photo paths from JSON string
  const parsePhotoPaths = (photoPathJson: string | null | undefined): string[] => {
    if (!photoPathJson) return [];
    try {
      const parsed = JSON.parse(photoPathJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    refreshAll().catch(() => {
      // silent, toast handled inside refreshAll
    });
  }, [refreshAll]);

  const resetStationForm = () => {
    setStationForm(initialStationForm);
    setEditingStationId(null);
  };

  const handleStationSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate required fields
    if (!stationForm.name.trim()) {
      toast.error('Tên trạm không được để trống');
      return;
    }

    if (!stationForm.address.trim()) {
      toast.error('Địa chỉ không được để trống');
      return;
    }

    setStationSubmitting(true);
    try {
      if (editingStationId == null) {
        // Create new station
        await authenticatedApiCall(API_ENDPOINTS.ADMIN_STATIONS, authToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: stationForm.name.trim(),
            address: stationForm.address.trim(),
            description: stationForm.description.trim() || null,
            openingHours: stationForm.openingHours.trim() || null,
            hotline: stationForm.hotline.trim() || null,
          }),
        });
        toast.success('Đã tạo trạm mới');
        await loadStations();
      } else {
        // Update existing station
        const updatedStation = await authenticatedApiCall<AdminStation>(
          API_ENDPOINTS.ADMIN_STATION_DETAIL(editingStationId), 
          authToken, 
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: stationForm.name.trim(),
              address: stationForm.address.trim(),
              description: stationForm.description.trim() || null,
              openingHours: stationForm.openingHours.trim() || null,
              hotline: stationForm.hotline.trim() || null,
              status: stationForm.status,
            }),
          }
        );
        
        // Update local state immediately
        setStations(prev => prev.map(s => 
          s.stationId === editingStationId 
            ? {
                stationId: updatedStation.stationId,
                name: updatedStation.name,
                address: updatedStation.address,
                description: updatedStation.description ?? '',
                openingHours: updatedStation.openingHours ?? '',
                hotline: updatedStation.hotline ?? '',
                status: (updatedStation.status ?? 'ACTIVE') as StationStatus,
              }
            : s
        ));
        
        toast.success('Đã cập nhật thông tin trạm');
      }

      resetStationForm();
    } catch (error: any) {
      console.error('[Station Submit Error]:', error);
      toast.error(error?.message ?? 'Không thể lưu thông tin trạm');
    } finally {
      setStationSubmitting(false);
    }
  };

  const handleStationEdit = (station: AdminStation) => {
    setStationForm({
      name: station.name ?? '',
      address: station.address ?? '',
      description: station.description ?? '',
      openingHours: station.openingHours ?? '',
      hotline: station.hotline ?? '',
      status: (station.status ?? 'ACTIVE') as StationStatus,
    });
    setEditingStationId(station.stationId);
    
    // Scroll to top of page to see the form
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleStationDelete = async (stationId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa trạm này?')) {
      return;
    }

    try {
      await authenticatedApiCall(API_ENDPOINTS.ADMIN_STATION_DETAIL(stationId), authToken, {
        method: 'DELETE',
      });
      toast.success('Đã xóa trạm');
      await loadStations();
    } catch (error: any) {
      toast.error(error?.message ?? 'Không thể xóa trạm');
    }
  };

  const resetVehicleForm = () => {
    setVehicleForm(initialVehicleForm);
    setEditingVehicleId(null);
  };

  const handleVehicleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!vehicleForm.licensePlate.trim()) {
      toast.error('Biển số xe là bắt buộc');
      return;
    }
    if (!vehicleForm.modelId) {
      toast.error('Vui lòng chọn model');
      return;
    }
    if (!vehicleForm.stationId) {
      toast.error('Vui lòng chọn trạm');
      return;
    }

    const payload: Record<string, unknown> = {};
    if (vehicleForm.licensePlate.trim()) {
      payload.licensePlate = vehicleForm.licensePlate.trim();
    }
    if (vehicleForm.batteryLevel) {
      payload.batteryLevel = Number(vehicleForm.batteryLevel);
    }
    if (vehicleForm.currentMileage) {
      payload.currentMileage = Number(vehicleForm.currentMileage);
    }
    if (vehicleForm.modelId) {
      payload.modelId = Number(vehicleForm.modelId);
    }
    if (vehicleForm.stationId) {
      payload.stationId = Number(vehicleForm.stationId);
    }
    if (vehicleForm.status) {
      payload.status = vehicleForm.status;
    }
    if (vehicleForm.condition) {
      if (editingVehicleId == null) {
        payload.condition = vehicleForm.condition;
      } else {
        payload.newCondition = vehicleForm.condition;
      }
    }

    setVehicleSubmitting(true);
    try {
      if (editingVehicleId == null) {
        await authenticatedApiCall(API_ENDPOINTS.ADMIN_VEHICLES, authToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        toast.success('Đã tạo xe mới');
      } else {
        await authenticatedApiCall(API_ENDPOINTS.ADMIN_VEHICLE_DETAIL(editingVehicleId), authToken, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        toast.success('Đã cập nhật thông tin xe');
      }

      await loadVehicles();
      resetVehicleForm();
    } catch (error: any) {
      toast.error(error?.message ?? 'Không thể lưu thông tin xe');
    } finally {
      setVehicleSubmitting(false);
    }
  };

  const handleVehicleEdit = async (vehicleId: number) => {
    try {
      const detail = await authenticatedApiCall<AdminVehicle>(API_ENDPOINTS.ADMIN_VEHICLE_DETAIL(vehicleId), authToken);
      setVehicleForm({
        licensePlate: detail.licensePlate ?? '',
        batteryLevel: detail.batteryLevel != null ? String(detail.batteryLevel) : '',
        modelId: '',
        stationId: detail.stationId != null ? String(detail.stationId) : '',
        currentMileage: detail.currentMileage != null ? String(detail.currentMileage) : '',
        status: (detail.status ?? 'AVAILABLE') as VehicleStatusOption,
        condition: (detail.condition ?? 'GOOD') as VehicleConditionOption,
      });
      if (detail.modelName) {
        const matchedModel = models.find((model) => model.modelName === detail.modelName);
        if (matchedModel) {
          setVehicleForm((prev) => ({ ...prev, modelId: String(matchedModel.modelId) }));
        }
      }
      setEditingVehicleId(vehicleId);
      
      // Scroll to top of page to see the form
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch (error: any) {
      toast.error(error?.message ?? 'Không thể tải chi tiết xe');
    }
  };

  const handleVehicleDelete = async (vehicleId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa xe này?')) {
      return;
    }

    try {
      await authenticatedApiCall(API_ENDPOINTS.ADMIN_VEHICLE_DETAIL(vehicleId), authToken, {
        method: 'DELETE',
      });
      toast.success('Đã xóa xe');
      await loadVehicles();
    } catch (error: any) {
      toast.error(error?.message ?? 'Không thể xóa xe');
    }
  };

  const resetModelForm = () => {
    setModelForm(createInitialModelForm());
    setEditingModelId(null);
    setModelImagesInputKey((prev) => prev + 1);
  };

  const handleModelSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const modelName = modelForm.modelName.trim();
    if (!modelName) {
      toast.error('Tên model là bắt buộc');
      return;
    }

    const formEntries: Record<string, any> = {
      modelName,
    };

    if (modelForm.vehicleType.trim()) formEntries.vehicleType = modelForm.vehicleType.trim();
    if (modelForm.seatCount) formEntries.seatCount = Number(modelForm.seatCount);
    if (modelForm.batteryCapacity) formEntries.batteryCapacity = Number(modelForm.batteryCapacity);
    if (modelForm.rangeKm) formEntries.rangeKm = Number(modelForm.rangeKm);
    if (modelForm.features.trim()) formEntries.features = modelForm.features.trim();
    if (modelForm.pricePerHour) formEntries.pricePerHour = Number(modelForm.pricePerHour);
    if (modelForm.initialValue) formEntries.initialValue = Number(modelForm.initialValue);
    if (modelForm.description.trim()) formEntries.description = modelForm.description.trim();
    if (modelForm.imageFiles.length > 0) formEntries.images = modelForm.imageFiles;

    setModelSubmitting(true);
    try {
      if (editingModelId == null) {
        await uploadFiles(API_ENDPOINTS.ADMIN_MODELS, authToken, formEntries, 'POST');
        toast.success('Đã tạo model mới');
      } else {
        await uploadFiles(API_ENDPOINTS.ADMIN_MODEL_DETAIL(editingModelId), authToken, formEntries, 'PUT');
        toast.success('Đã cập nhật model');
      }

      await loadModels();
      resetModelForm();
    } catch (error: any) {
      toast.error(error?.message ?? 'Không thể lưu thông tin model');
    } finally {
      setModelSubmitting(false);
    }
  };

  const handleModelEdit = (model: AdminModel) => {
    const imageSet = new Set<string>();

    if (Array.isArray(model.images)) {
      model.images.forEach((entry) => {
        if (!entry) {
          return;
        }

        if (typeof entry === 'string') {
          const normalized = entry.trim();
          if (normalized) {
            imageSet.add(normalized);
          }
          return;
        }

        if (typeof entry === 'object') {
          const candidate = [
            (entry as AdminModelImage).imageUrl,
            (entry as AdminModelImage).url,
            (entry as AdminModelImage).path,
          ].find((value): value is string => typeof value === 'string' && value.trim().length > 0);

          if (candidate) {
            imageSet.add(candidate.trim());
          }
        }
      });
    }

    if (typeof model.imageUrl === 'string' && model.imageUrl.trim()) {
      imageSet.add(model.imageUrl.trim());
    }

    setModelForm({
      modelName: model.modelName ?? '',
      vehicleType: model.vehicleType ?? '',
      seatCount: model.seatCount != null ? String(model.seatCount) : '',
      batteryCapacity: model.batteryCapacity != null ? String(model.batteryCapacity) : '',
      rangeKm: model.rangeKm != null ? String(model.rangeKm) : '',
      features: model.features ?? '',
      pricePerHour: model.pricePerHour != null ? String(model.pricePerHour) : '',
      initialValue: model.initialValue != null ? String(model.initialValue) : '',
      description: model.description ?? '',
      existingImageUrls: Array.from(imageSet),
      imageFiles: [],
    });
    setEditingModelId(model.modelId);
    setModelImagesInputKey((prev) => prev + 1);
    
    // Scroll to top of page to see the form
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleModelDelete = async (modelId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa model này?')) {
      return;
    }

    try {
      await authenticatedApiCall(API_ENDPOINTS.ADMIN_MODEL_DETAIL(modelId), authToken, {
        method: 'DELETE',
      });
      toast.success('Đã xóa model');
      await loadModels();
    } catch (error: any) {
      toast.error(error?.message ?? 'Không thể xóa model');
    }
  };

  const handleUserStatusChange = async (status: AccountStatusOption) => {
    if (!selectedUser) {
      return;
    }

    setUserStatusUpdating(true);
    try {
      await authenticatedApiCall(API_ENDPOINTS.ADMIN_USER_STATUS(selectedUser.userId, status), authToken, {
        method: 'PATCH',
      });
      toast.success('Đã cập nhật trạng thái người dùng');
      await loadUsers();
    } catch (error: any) {
      toast.error(error?.message ?? 'Không thể cập nhật trạng thái');
    } finally {
      setUserStatusUpdating(false);
    }
  };

  const handleUserRoleChange = async (roleId: number) => {
    if (!selectedUser) {
      return;
    }

    // Prevent changing role of admin users
    const userRole = selectedUser.role?.roleName?.toUpperCase();
    if (userRole === 'ADMIN' || userRole === 'EV_ADMIN') {
      toast.error('Không thể thay đổi vai trò của Admin');
      return;
    }

    setUserRoleUpdating(true);
    try {
      await authenticatedApiCall(API_ENDPOINTS.ADMIN_USER_ROLE(selectedUser.userId), authToken, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleId }),
      });
      toast.success('Đã cập nhật vai trò người dùng');
      await loadUsers();
    } catch (error: any) {
      toast.error(error?.message ?? 'Không thể cập nhật vai trò');
    } finally {
      setUserRoleUpdating(false);
    }
  };

  const handleUserStationChange = async (stationId: number) => {
    if (!selectedUser) {
      return;
    }

    if (!Number.isFinite(stationId) || stationId <= 0) {
      toast.error('ID trạm không hợp lệ');
      return;
    }

    if (selectedUser.station?.stationId === stationId) {
      return;
    }

    setUserStationUpdating(true);
    try {
      await authenticatedApiCall(API_ENDPOINTS.ADMIN_USER_STATION(selectedUser.userId, stationId), authToken, {
        method: 'PUT',
      });
      toast.success('Đã cập nhật trạm phụ trách');
      await loadUsers();
    } catch (error: any) {
      toast.error(error?.message ?? 'Không thể cập nhật trạm cho người dùng');
    } finally {
      setUserStationUpdating(false);
    }
  };

  const handleFetchHistory = async () => {
    setHistoryLoading(true);
    try {
      // Build query params with filters
      const params = new URLSearchParams();
      
      if (historyFilters.stationId && historyFilters.stationId !== 'ALL') {
        params.set('stationId', historyFilters.stationId);
      }
      if (historyFilters.from) {
        params.set('from', historyFilters.from);
      }
      if (historyFilters.to) {
        params.set('to', historyFilters.to);
      }
      if (historyFilters.vehicleType) {
        params.set('vehicleType', historyFilters.vehicleType);
      }
      if (historyFilters.licensePlate && historyFilters.licensePlate.trim()) {
        params.set('licensePlate', historyFilters.licensePlate.trim());
      }
      
      const endpoint = `${API_ENDPOINTS.ADMIN_VEHICLE_HISTORY}?${params.toString()}`;
      console.log('🚨 History API Request:', endpoint);
      console.log('🚨 Filters:', historyFilters);
      
      const data = await authenticatedApiCall<VehicleHistoryRecord[]>(endpoint, authToken);
      console.log('🚨 History API Response:', data);
      const historyData = Array.isArray(data) ? data : [];

      setHistoryRecords(historyData);
      if (historyData.length === 0) {
        toast.info('Không tìm thấy lịch sử phù hợp');
      } else {
        toast.success(`Tìm thấy ${historyData.length} bản ghi lịch sử`);
      }
    } catch (error: any) {
      console.error('❌ History API Error:', error);
      toast.error(error?.message ?? 'Không thể tải lịch sử');
      setHistoryRecords([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFetchRevenue = async () => {
    if (!revenueFilters.from || !revenueFilters.to) {
      toast.error('Vui lòng chọn khoảng thời gian');
      return;
    }

    const params = new URLSearchParams();
    params.set('from', revenueFilters.from);
    params.set('to', revenueFilters.to);
    if (revenueFilters.stationId && revenueFilters.stationId !== 'ALL') {
      params.set('stationId', revenueFilters.stationId);
    }

    setRevenueLoading(true);
    try {
      // Fetch revenue report and peak hour stats in parallel
      const [basicReport, peakStats, stationsData] = await Promise.all([
        authenticatedApiCall<RevenueReport>(`${API_ENDPOINTS.ADMIN_REVENUE}?${params.toString()}`, authToken),
        authenticatedApiCall<PeakHourStatistics>(
          `${API_ENDPOINTS.ADMIN_PEAK_HOUR_STATS}?${params.toString()}`, 
          authToken
        ),
        authenticatedApiCall<StationReport[]>(
          API_ENDPOINTS.ADMIN_STATIONS_REPORT, 
          authToken
        ),
      ]);
      
      setRevenueReport(basicReport);
      setPeakHourStats(peakStats);
      setStationReports(stationsData);
      
      // Fetch revenue for each station to create line chart data
      if (revenueFilters.stationId === 'ALL' && stations.length > 0) {
        const stationRevenuePromises = stations.slice(0, 10).map(async (station) => {
          try {
            const stationParams = new URLSearchParams();
            stationParams.set('from', revenueFilters.from);
            stationParams.set('to', revenueFilters.to);
            stationParams.set('stationId', String(station.stationId));
            
            const stationRevenue = await authenticatedApiCall<RevenueReport>(
              `${API_ENDPOINTS.ADMIN_REVENUE}?${stationParams.toString()}`, 
              authToken
            );
            
            return {
              stationName: station.name,
              totalRevenue: stationRevenue.totalRevenue || 0,
              totalBookingRevenue: stationRevenue.totalBookingRevenue || 0,
              totalPenaltyRevenue: stationRevenue.totalPenaltyRevenue || 0,
            };
          } catch {
            return {
              stationName: station.name,
              totalRevenue: 0,
              totalBookingRevenue: 0,
              totalPenaltyRevenue: 0,
            };
          }
        });
        
        const stationRevenues = await Promise.all(stationRevenuePromises);
        setStationRevenueData(stationRevenues.sort((a, b) => b.totalRevenue - a.totalRevenue));
      } else {
        setStationRevenueData([]);
      }
    } catch (error: any) {
      console.error('Error fetching revenue:', error);
      toast.error(error?.message ?? 'Không thể tải báo cáo doanh thu');
      setRevenueReport(null);
      setPeakHourStats(null);
      setStationReports([]);
      setStationRevenueData([]);
    } finally {
      setRevenueLoading(false);
    }
  };

  const stationOptions = useMemo(
    () =>
      stations.map((station) => ({
        value: String(station.stationId),
        label: station.name,
      })),
    [stations]
  );

  const selectedUserStationValue = useMemo(() => {
    if (!selectedUser?.station?.stationId) {
      return '';
    }
    return String(selectedUser.station.stationId);
  }, [selectedUser]);

  const stationOptionsWithSelected = useMemo(() => {
    if (!selectedUserStationValue) {
      return stationOptions;
    }

    const exists = stationOptions.some((option) => option.value === selectedUserStationValue);
    if (exists) {
      return stationOptions;
    }

    const fallbackLabel = selectedUser?.station?.name ?? `Trạm #${selectedUserStationValue}`;
    return [
      { value: selectedUserStationValue, label: fallbackLabel },
      ...stationOptions,
    ];
  }, [stationOptions, selectedUserStationValue, selectedUser]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="md:mr-8">
            <p className="text-xs uppercase tracking-wider text-gray-500">Bảng điều khiển quản trị</p>
            <h1 className="text-2xl font-semibold text-gray-900">EV Rental Admin</h1>
            <p className="text-sm text-gray-600">Xin chào, {user.fullName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => onNavigate('home')}
              className="transition-all duration-200 hover:scale-105"
            >
              <Home className="mr-2 h-4 w-4" />Trang chủ
            </Button>
            <Button
              variant="secondary"
              onClick={refreshAll}
              disabled={isRefreshing}
              className="transition-all duration-200 hover:scale-105"
            >
              {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Làm mới
            </Button>
            <Button
              variant="destructive"
              onClick={onLogout}
              className="transition-all duration-200 hover:scale-105"
            >
              <LogOut className="mr-2 h-4 w-4" />Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white shadow">
            <TabsTrigger value="stations">
              <Building2 className="mr-2 h-4 w-4" />Trạm
            </TabsTrigger>
            <TabsTrigger value="vehicles">
              <Car className="mr-2 h-4 w-4" />Xe
            </TabsTrigger>
            <TabsTrigger value="models">
              <Car className="mr-2 h-4 w-4" />Mẫu xe
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />Người dùng
            </TabsTrigger>
            <TabsTrigger value="history">
              <HistoryIcon className="mr-2 h-4 w-4" />Lịch sử
            </TabsTrigger>
            <TabsTrigger value="damage-reports">
              <AlertCircle className="mr-2 h-4 w-4" />Báo lỗi
            </TabsTrigger>
            <TabsTrigger value="revenue">
              <BarChart3 className="mr-2 h-4 w-4" />Doanh thu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stations" className="space-y-6 pt-4">
            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
              <Card ref={stationFormRef}>
                <CardHeader>
                  <CardTitle>{editingStationId == null ? 'Tạo trạm mới' : 'Cập nhật trạm'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleStationSubmit} className="space-y-4">
                    <div>
                      <Label>Tên trạm</Label>
                      <Input
                        value={stationForm.name}
                        onChange={(event) => setStationForm((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="VD: EV Station Nguyễn Trãi"
                      />
                    </div>
                    <div>
                      <Label>Địa chỉ</Label>
                      <Textarea
                        value={stationForm.address}
                        onChange={(event) => setStationForm((prev) => ({ ...prev, address: event.target.value }))}
                        placeholder="Số nhà, đường, quận..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Giờ mở cửa</Label>
                        <Input
                          value={stationForm.openingHours}
                          onChange={(event) => setStationForm((prev) => ({ ...prev, openingHours: event.target.value }))}
                          placeholder="08:00 - 21:30"
                        />
                      </div>
                      <div>
                        <Label>Hotline</Label>
                        <Input
                          value={stationForm.hotline}
                          onChange={(event) => setStationForm((prev) => ({ ...prev, hotline: event.target.value }))}
                          placeholder="0123 456 789"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Mô tả</Label>
                      <Textarea
                        value={stationForm.description}
                        onChange={(event) => setStationForm((prev) => ({ ...prev, description: event.target.value }))}
                        placeholder="Thông tin nổi bật về trạm"
                      />
                    </div>
                    {editingStationId != null && (
                      <div>
                        <Label>Trạng thái</Label>
                        <Select
                          value={stationForm.status}
                          onValueChange={(value: string) =>
                            setStationForm((prev) => ({ ...prev, status: value as StationStatus }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATION_STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <Button type="submit" className="flex-1" disabled={stationSubmitting}>
                        {stationSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : editingStationId == null ? (
                          <Plus className="mr-2 h-4 w-4" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {editingStationId == null ? 'Tạo trạm' : 'Lưu thay đổi'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetStationForm}>
                        Đặt lại
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Danh sách trạm</CardTitle>
                </CardHeader>
                <CardContent>
                  {stationsLoading ? (
                    <div className="flex items-center justify-center py-10 text-slate-500">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải...
                    </div>
                  ) : stations.length === 0 ? (
                    <p className="text-sm text-slate-500">Chưa có trạm nào</p>
                  ) : (
                    <ScrollArea className="max-h-[520px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tên trạm</TableHead>
                            <TableHead>Địa chỉ</TableHead>
                            <TableHead>Hotline</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="w-[120px] text-right">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stations.map((station) => (
                            <TableRow key={station.stationId}>
                              <TableCell className="font-medium">{station.name}</TableCell>
                              <TableCell className="max-w-[240px] whitespace-normal text-sm text-slate-600">
                                {station.address}
                              </TableCell>
                              <TableCell>{station.hotline || '—'}</TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    station.status === 'ACTIVE'
                                      ? 'bg-green-100 text-green-700'
                                      : station.status === 'MAINTENANCE'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-slate-200 text-slate-700'
                                  }
                                >
                                  {station.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleStationEdit(station)}>
                                  Sửa
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleStationDelete(station.stationId)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-6 pt-4">
            <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
              <Card ref={vehicleFormRef}>
                <CardHeader>
                  <CardTitle>{editingVehicleId == null ? 'Thêm xe mới' : 'Cập nhật xe'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleVehicleSubmit} className="space-y-4">
                    <div>
                      <Label>Biển số</Label>
                      <Input
                        value={vehicleForm.licensePlate}
                        onChange={(event) => setVehicleForm((prev) => ({ ...prev, licensePlate: event.target.value }))}
                        placeholder="VD: 30H-123.45"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Mức pin (%)</Label>
                        <Input
                          type="number"
                          value={vehicleForm.batteryLevel}
                          onChange={(event) => setVehicleForm((prev) => ({ ...prev, batteryLevel: event.target.value }))}
                          min={0}
                          max={100}
                        />
                      </div>
                      <div>
                        <Label>Số km hiện tại</Label>
                        <Input
                          type="number"
                          value={vehicleForm.currentMileage}
                          onChange={(event) => setVehicleForm((prev) => ({ ...prev, currentMileage: event.target.value }))}
                          min={0}
                          step="0.1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Mẫu xe</Label>
                      <Select
                        value={vehicleForm.modelId}
                        onValueChange={(value: string) =>
                          setVehicleForm((prev) => ({ ...prev, modelId: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn model" />
                        </SelectTrigger>
                        <SelectContent>
                          {models.map((model) => (
                            <SelectItem key={model.modelId} value={String(model.modelId)}>
                              {model.modelName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Thuộc trạm</Label>
                      <Select
                        value={vehicleForm.stationId}
                        onValueChange={(value: string) =>
                          setVehicleForm((prev) => ({ ...prev, stationId: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạm" />
                        </SelectTrigger>
                        <SelectContent>
                          {stationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Trạng thái</Label>
                        <Select
                          value={vehicleForm.status}
                          onValueChange={(value: string) =>
                            setVehicleForm((prev) => ({ ...prev, status: value as VehicleStatusOption }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                          <SelectContent>
                            {VEHICLE_STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tình trạng</Label>
                        <Select
                          value={vehicleForm.condition}
                          onValueChange={(value: string) =>
                            setVehicleForm((prev) => ({ ...prev, condition: value as VehicleConditionOption }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn tình trạng" />
                          </SelectTrigger>
                          <SelectContent>
                            {VEHICLE_CONDITION_OPTIONS.map((condition) => (
                              <SelectItem key={condition} value={condition}>
                                {getConditionLabel(condition)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Button type="submit" className="flex-1" disabled={vehicleSubmitting}>
                        {vehicleSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : editingVehicleId == null ? (
                          <Plus className="mr-2 h-4 w-4" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {editingVehicleId == null ? 'Thêm xe' : 'Lưu thông tin'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetVehicleForm}>
                        Đặt lại
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Danh sách xe</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Search bar */}
                  <div className="mb-4">
                    <Input
                      placeholder="Tìm kiếm theo biển số, mẫu xe, hoặc trạm..."
                      value={vehicleSearchQuery}
                      onChange={(e) => setVehicleSearchQuery(e.target.value)}
                      className="max-w-md"
                    />
                  </div>
                  {vehiclesLoading ? (
                    <div className="flex items-center justify-center py-10 text-slate-500">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải...
                    </div>
                  ) : (() => {
                    const filteredVehicles = vehicles.filter((vehicle) => {
                      const query = vehicleSearchQuery.toLowerCase();
                      return (
                        vehicle.licensePlate.toLowerCase().includes(query) ||
                        (vehicle.modelName && vehicle.modelName.toLowerCase().includes(query)) ||
                        (vehicle.stationName && vehicle.stationName.toLowerCase().includes(query))
                      );
                    });
                    
                    return filteredVehicles.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        {vehicleSearchQuery ? 'Không tìm thấy xe phù hợp' : 'Chưa có xe nào'}
                      </p>
                    ) : (
                    <ScrollArea className="max-h-[520px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Biển số</TableHead>
                            <TableHead>Mẫu xe</TableHead>
                            <TableHead>Thuộc trạm</TableHead>
                            <TableHead>Pin</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="w-[160px] text-right">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredVehicles.map((vehicle) => (
                            <TableRow key={vehicle.vehicleId}>
                              <TableCell className="font-medium">{vehicle.licensePlate}</TableCell>
                              <TableCell>{vehicle.modelName || '—'}</TableCell>
                              <TableCell>{vehicle.stationName || '—'}</TableCell>
                              <TableCell>{vehicle.batteryLevel != null ? `${vehicle.batteryLevel}%` : '—'}</TableCell>
                              <TableCell>{vehicle.status || '—'}</TableCell>
                              <TableCell className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleVehicleEdit(vehicle.vehicleId)}>
                                  Sửa
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleVehicleDelete(vehicle.vehicleId)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="models" className="space-y-6 pt-4">
            <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
              <Card ref={modelFormRef}>
                <CardHeader>
                  <CardTitle>{editingModelId == null ? 'Thêm model' : 'Cập nhật model'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleModelSubmit} className="space-y-4">
                    <div>
                      <Label>Tên model</Label>
                      <Input
                        value={modelForm.modelName}
                        onChange={(event) => setModelForm((prev) => ({ ...prev, modelName: event.target.value }))}
                        placeholder="VD: VinFast VF e34"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Loại xe</Label>
                        <Input
                          value={modelForm.vehicleType}
                          onChange={(event) => setModelForm((prev) => ({ ...prev, vehicleType: event.target.value }))}
                          placeholder="CAR, SCOOTER..."
                        />
                      </div>
                      <div>
                        <Label>Số chỗ</Label>
                        <Input
                          type="number"
                          value={modelForm.seatCount}
                          onChange={(event) => setModelForm((prev) => ({ ...prev, seatCount: event.target.value }))}
                          min={0}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Dung lượng pin (kWh)</Label>
                        <Input
                          type="number"
                          value={modelForm.batteryCapacity}
                          onChange={(event) => setModelForm((prev) => ({ ...prev, batteryCapacity: event.target.value }))}
                          min={0}
                          step="0.1"
                        />
                      </div>
                      <div>
                        <Label>Quãng đường (km)</Label>
                        <Input
                          type="number"
                          value={modelForm.rangeKm}
                          onChange={(event) => setModelForm((prev) => ({ ...prev, rangeKm: event.target.value }))}
                          min={0}
                          step="0.1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Giá thuê / giờ</Label>
                        <Input
                          type="number"
                          value={modelForm.pricePerHour}
                          onChange={(event) => setModelForm((prev) => ({ ...prev, pricePerHour: event.target.value }))}
                          min={0}
                          step="0.1"
                        />
                      </div>
                      <div>
                        <Label>Giá trị ban đầu</Label>
                        <Input
                          type="number"
                          value={modelForm.initialValue}
                          onChange={(event) => setModelForm((prev) => ({ ...prev, initialValue: event.target.value }))}
                          min={0}
                          step="0.1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Tính năng</Label>
                      <Textarea
                        value={modelForm.features}
                        onChange={(event) => setModelForm((prev) => ({ ...prev, features: event.target.value }))}
                        placeholder="Các tính năng nổi bật"
                      />
                    </div>
                    <div>
                      <Label>Mô tả</Label>
                      <Textarea
                        value={modelForm.description}
                        onChange={(event) => setModelForm((prev) => ({ ...prev, description: event.target.value }))}
                        placeholder="Thông tin bổ sung"
                      />
                    </div>
                    <div>
                      <Label>Ảnh minh họa</Label>
                      <Input
                        key={modelImagesInputKey}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) =>
                          setModelForm((prev) => ({
                            ...prev,
                            imageFiles: event.target.files ? Array.from(event.target.files) : [],
                          }))
                        }
                      />
                      {modelForm.imageFiles.length > 0 ? (
                        <p className="mt-2 text-xs text-slate-500">
                          Đã chọn {modelForm.imageFiles.length} ảnh:{' '}
                          {modelForm.imageFiles.map((file) => file.name).join(', ')}
                        </p>
                      ) : modelForm.existingImageUrls.length > 0 ? (
                        <div className="mt-2 space-y-1 text-xs text-slate-500">
                          <p>Ảnh hiện tại:</p>
                          <div className="flex flex-wrap gap-2">
                            {modelForm.existingImageUrls.map((url) => {
                              const resolved = resolveAssetUrl(url) ?? url;
                              return (
                                <a
                                  key={url}
                                  href={resolved || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline break-all"
                                >
                                  {resolved}
                                </a>
                              );
                            })}
                          </div>
                          <p>Thêm ảnh mới sẽ thay thế bộ sưu tập hiện tại.</p>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Button type="submit" className="flex-1" disabled={modelSubmitting}>
                        {modelSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : editingModelId == null ? (
                          <Plus className="mr-2 h-4 w-4" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {editingModelId == null ? 'Thêm model' : 'Lưu model'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetModelForm}>
                        Đặt lại
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Danh sách model</CardTitle>
                </CardHeader>
                <CardContent>
                  {modelsLoading ? (
                    <div className="flex items-center justify-center py-10 text-slate-500">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải...
                    </div>
                  ) : models.length === 0 ? (
                    <p className="text-sm text-slate-500">Chưa có model nào</p>
                  ) : (
                    <ScrollArea className="max-h-[520px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tên</TableHead>
                            <TableHead>Loại</TableHead>
                            <TableHead>Số chỗ</TableHead>
                            <TableHead>Giá thuê</TableHead>
                            <TableHead className="w-[140px] text-right">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {models.map((model) => (
                            <TableRow key={model.modelId}>
                              <TableCell className="font-medium">{model.modelName}</TableCell>
                              <TableCell>{model.vehicleType || '—'}</TableCell>
                              <TableCell>{model.seatCount ?? '—'}</TableCell>
                              <TableCell>{formatCurrency(model.pricePerHour)}</TableCell>
                              <TableCell className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleModelEdit(model)}>
                                  Sửa
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleModelDelete(model.modelId)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6 pt-4">
            <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin người dùng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedUser ? (
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 space-y-2 bg-slate-50">
                        <h3 className="font-semibold text-lg">{selectedUser.fullName}</h3>
                        <p className="text-sm text-slate-600">{selectedUser.email}</p>
                        <p className="text-sm text-slate-600">{selectedUser.phone}</p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Badge>{selectedUser.role?.roleName ?? '—'}</Badge>
                          <Badge
                            className={
                              selectedUser.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : selectedUser.status === 'BANNED'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                            }
                          >
                            {selectedUser.status}
                          </Badge>
                          {/* Chỉ hiển thị trạng thái xác minh cho CUSTOMER */}
                          {isSelectedUserCustomer && (
                            <Badge
                              className={
                                selectedUser.verificationStatus === 'APPROVED'
                                  ? 'bg-green-100 text-green-700'
                                  : selectedUser.verificationStatus === 'REJECTED'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                              }
                            >
                              {selectedUser.verificationStatus}
                            </Badge>
                          )}
                        </div>
                        {selectedUser.station && (
                          <p className="text-sm text-slate-600">Trạm phụ trách: {selectedUser.station.name}</p>
                        )}
                        {/* Rejection Reason - Chỉ hiển thị cho CUSTOMER */}
                        {isSelectedUserCustomer && selectedUser.rejectionReason && (
                          <p className="text-sm text-red-600">Lý do từ chối: {selectedUser.rejectionReason}</p>
                        )}
                      </div>

                      {/* Verification Documents - Chỉ hiển thị cho CUSTOMER */}
                      {isSelectedUserCustomer && (selectedUser.cccdPath1 || selectedUser.cccdPath2 || selectedUser.gplxPath1 || selectedUser.gplxPath2 || selectedUser.selfiePath) && (
                        <div className="border rounded-lg p-4 space-y-3 bg-white">
                          <h4 className="font-semibold text-sm text-slate-700">Giấy tờ xác minh</h4>
                          
                          {selectedUser.cccd && (
                            <div className="space-y-2">
                              <p className="text-xs text-slate-600 font-medium">CCCD: {selectedUser.cccd}</p>
                              <div className="grid grid-cols-2 gap-2">
                                {selectedUser.cccdPath1 && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-slate-500">Mặt trước</p>
                                    <img
                                      src={resolveAssetUrl(selectedUser.cccdPath1) ?? ''}
                                      alt="CCCD mặt trước"
                                      className="w-full h-24 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 bg-slate-100"
                                      onClick={() => window.open(resolveAssetUrl(selectedUser.cccdPath1) ?? '', '_blank')}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          const placeholder = document.createElement('div');
                                          placeholder.className = 'w-full h-24 rounded border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 text-xs';
                                          placeholder.textContent = 'Ảnh không tồn tại';
                                          parent.appendChild(placeholder);
                                        }
                                      }}
                                    />
                                  </div>
                                )}
                                {selectedUser.cccdPath2 && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-slate-500">Mặt sau</p>
                                    <img
                                      src={resolveAssetUrl(selectedUser.cccdPath2) ?? ''}
                                      alt="CCCD mặt sau"
                                      className="w-full h-24 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 bg-slate-100"
                                      onClick={() => window.open(resolveAssetUrl(selectedUser.cccdPath2) ?? '', '_blank')}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          const placeholder = document.createElement('div');
                                          placeholder.className = 'w-full h-24 rounded border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 text-xs';
                                          placeholder.textContent = 'Ảnh không tồn tại';
                                          parent.appendChild(placeholder);
                                        }
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedUser.gplx && (
                            <div className="space-y-2">
                              <p className="text-xs text-slate-600 font-medium">GPLX: {selectedUser.gplx}</p>
                              <div className="grid grid-cols-2 gap-2">
                                {selectedUser.gplxPath1 && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-slate-500">Mặt trước</p>
                                    <img
                                      src={resolveAssetUrl(selectedUser.gplxPath1) ?? ''}
                                      alt="GPLX mặt trước"
                                      className="w-full h-24 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 bg-slate-100"
                                      onClick={() => window.open(resolveAssetUrl(selectedUser.gplxPath1) ?? '', '_blank')}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent && !parent.querySelector('.placeholder')) {
                                          const placeholder = document.createElement('div');
                                          placeholder.className = 'placeholder w-full h-24 rounded border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 text-xs';
                                          placeholder.textContent = 'Ảnh không tồn tại';
                                          parent.appendChild(placeholder);
                                        }
                                      }}
                                    />
                                  </div>
                                )}
                                {selectedUser.gplxPath2 && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-slate-500">Mặt sau</p>
                                    <img
                                      src={resolveAssetUrl(selectedUser.gplxPath2) ?? ''}
                                      alt="GPLX mặt sau"
                                      className="w-full h-24 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 bg-slate-100"
                                      onClick={() => window.open(resolveAssetUrl(selectedUser.gplxPath2) ?? '', '_blank')}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent && !parent.querySelector('.placeholder')) {
                                          const placeholder = document.createElement('div');
                                          placeholder.className = 'placeholder w-full h-24 rounded border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 text-xs';
                                          placeholder.textContent = 'Ảnh không tồn tại';
                                          parent.appendChild(placeholder);
                                        }
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedUser.selfiePath && (
                            <div className="space-y-2">
                              <p className="text-xs text-slate-600 font-medium">Ảnh chân dung</p>
                              <img
                                src={resolveAssetUrl(selectedUser.selfiePath) ?? ''}
                                alt="Selfie"
                                className="w-32 h-32 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 bg-slate-100"
                                onClick={() => window.open(resolveAssetUrl(selectedUser.selfiePath) ?? '', '_blank')}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('.placeholder')) {
                                    const placeholder = document.createElement('div');
                                    placeholder.className = 'placeholder w-32 h-32 rounded border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 text-xs';
                                    placeholder.textContent = 'Ảnh không tồn tại';
                                    parent.appendChild(placeholder);
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <Label>Trạng thái tài khoản</Label>
                        <Select
                          value={selectedUser.status}
                          onValueChange={(value: string) =>
                            handleUserStatusChange(value as AccountStatusOption)
                          }
                          disabled={userStatusUpdating}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACCOUNT_STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Vai trò</Label>
                        <Select
                          value={selectedUser.role?.roleId ? String(selectedUser.role.roleId) : ''}
                          onValueChange={(value: string) => handleUserRoleChange(Number(value))}
                          disabled={userRoleUpdating || roleOptions.length === 0 || isSelectedUserAdmin}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn vai trò" />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((role) => (
                              <SelectItem key={role.roleId} value={String(role.roleId)}>
                                {role.roleName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isSelectedUserAdmin && (
                          <p className="text-xs text-amber-600 mt-1">
                            ⚠️ Không thể thay đổi vai trò của Admin
                          </p>
                        )}
                      </div>

                      {/* Chỉ hiển thị phần gán trạm khi user là STAFF */}
                      {isSelectedUserStaff && (
                        <div>
                          <Label>Gán trạm (dành cho nhân viên)</Label>
                          <Select
                            value={selectedUserStationValue}
                            onValueChange={(value: string) => {
                              if (!value || value === selectedUserStationValue) {
                                return;
                              }

                              const parsedStationId = Number(value);
                              if (!Number.isFinite(parsedStationId) || parsedStationId <= 0) {
                                toast.error('ID trạm không hợp lệ');
                                return;
                              }

                              void handleUserStationChange(parsedStationId);
                            }}
                            disabled={
                              userStationUpdating || stationOptionsWithSelected.length === 0
                            }
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  stationOptionsWithSelected.length === 0
                                    ? 'Đang tải danh sách trạm...'
                                    : 'Chọn trạm'
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {stationOptionsWithSelected.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Chọn một người dùng từ danh sách để xem chi tiết.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Danh sách người dùng</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Search and Tab Controls */}
                  <div className="space-y-4 mb-4">
                    <Input
                      placeholder="Tìm kiếm theo email hoặc tên..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="max-w-md"
                    />
                    
                    <Tabs value={userTabType} onValueChange={(value: string) => setUserTabType(value as 'customers' | 'staff')}>
                      <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="customers">Khách hàng</TabsTrigger>
                        <TabsTrigger value="staff">Nhân viên</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {usersLoading ? (
                    <div className="flex items-center justify-center py-10 text-slate-500">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      {userSearchQuery ? 'Không tìm thấy người dùng phù hợp' : `Chưa có ${userTabType === 'staff' ? 'nhân viên' : 'khách hàng'} nào`}
                    </p>
                  ) : (
                    <ScrollArea className="max-h-[520px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Họ tên</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Điện thoại</TableHead>
                            <TableHead>Vai trò</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            {userTabType === 'staff' && <TableHead>Trạm</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((item) => (
                            <TableRow
                              key={item.userId}
                              className={selectedUserId === item.userId ? 'bg-slate-100' : 'cursor-pointer hover:bg-slate-50'}
                              onClick={() => setSelectedUserId(item.userId)}
                            >
                              <TableCell className="font-medium">{item.fullName}</TableCell>
                              <TableCell className="text-sm text-slate-600">{item.email}</TableCell>
                              <TableCell>{item.phone}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.role?.roleName ?? '—'}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    item.status === 'ACTIVE'
                                      ? 'bg-green-100 text-green-700'
                                      : item.status === 'BANNED'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                  }
                                >
                                  {item.status}
                                </Badge>
                              </TableCell>
                              {userTabType === 'staff' && (
                                <TableCell className="text-sm text-slate-600">
                                  {item.station?.name ?? '—'}
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Tra cứu lịch sử di chuyển xe</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Sử dụng bộ lọc để xem lịch sử chi tiết</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                        <Label>Lọc theo trạm</Label>
                        <Select
                          value={historyFilters.stationId}
                          onValueChange={(value) => setHistoryFilters(prev => ({ ...prev, stationId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tất cả trạm" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">Tất cả trạm</SelectItem>
                            {stations.map((station) => (
                              <SelectItem key={station.stationId} value={String(station.stationId)}>
                                {station.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Ngày thuê từ</Label>
                        <Input
                          type="date"
                          value={historyFilters.from}
                          onChange={(e) => setHistoryFilters(prev => ({ ...prev, from: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label>Đến ngày</Label>
                        <Input
                          type="date"
                          value={historyFilters.to}
                          onChange={(e) => setHistoryFilters(prev => ({ ...prev, to: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label>Loại xe</Label>
                        <Select
                          value={historyFilters.vehicleType || 'ALL'}
                          onValueChange={(value) => setHistoryFilters(prev => ({ ...prev, vehicleType: value === 'ALL' ? '' : value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tất cả loại xe" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">Tất cả loại xe</SelectItem>
                            <SelectItem value="CAR">Ô tô (CAR)</SelectItem>
                            <SelectItem value="MOTORBIKE">Xe máy (MOTORBIKE)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Biển số xe</Label>
                        <Input
                          placeholder="VD: 29A-12345"
                          value={historyFilters.licensePlate}
                          onChange={(e) => setHistoryFilters(prev => ({ ...prev, licensePlate: e.target.value }))}
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <Button 
                          type="button" 
                          className="w-full" 
                          onClick={handleFetchHistory} 
                          disabled={historyLoading}
                        >
                          {historyLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HistoryIcon className="mr-2 h-4 w-4" />}
                          Tra cứu lịch sử
                        </Button>
                      </div>
                    </div>
                  </CardContent>

                {historyRecords.length > 0 && (
                  <CardContent>
                    <ScrollArea className="max-h-[520px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Thời gian</TableHead>
                          <TableHead>Hành động</TableHead>
                          <TableHead>Loại xe</TableHead>
                          <TableHead>Biển số</TableHead>
                          <TableHead>Nhân viên</TableHead>
                          <TableHead>Khách thuê</TableHead>
                          <TableHead>Trạm</TableHead>
                          <TableHead>Pin</TableHead>
                          <TableHead>Km</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyRecords.map((record) => (
                          <TableRow key={record.historyId}>
                            <TableCell>{formatDateTime(record.actionTime)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{record.actionType}</Badge>
                            </TableCell>
                            <TableCell>{record.vehicleType ?? '—'}</TableCell>
                            <TableCell>
                              {record.licensePlate ? (
                                <Badge variant="outline" className="font-mono">{record.licensePlate}</Badge>
                              ) : '—'}
                            </TableCell>
                            <TableCell>{record.staffName ?? '—'}</TableCell>
                            <TableCell>{record.renterName ?? '—'}</TableCell>
                            <TableCell>{record.stationName ?? '—'}</TableCell>
                            <TableCell>{record.batteryLevel != null ? `${record.batteryLevel}%` : '—'}</TableCell>
                            <TableCell>{record.mileage != null ? `${record.mileage} km` : '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  </CardContent>
                )}
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Báo cáo doanh thu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Từ ngày</Label>
                    <Input
                      type="date"
                      value={revenueFilters.from}
                      onChange={(event) => setRevenueFilters((prev) => ({ ...prev, from: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Đến ngày</Label>
                    <Input
                      type="date"
                      value={revenueFilters.to}
                      onChange={(event) => setRevenueFilters((prev) => ({ ...prev, to: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Trạm (tuỳ chọn)</Label>
                    <Select
                      value={revenueFilters.stationId}
                      onValueChange={(value: string) =>
                        setRevenueFilters((prev) => ({ ...prev, stationId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Tất cả</SelectItem>
                        {stationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button type="button" className="w-full" onClick={handleFetchRevenue} disabled={revenueLoading}>
                      {revenueLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
                      Xem báo cáo
                    </Button>
                  </div>
                </div>

                {revenueReport && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border border-slate-200">
                        <CardHeader>
                          <CardTitle className="text-sm text-slate-500">Doanh thu thuê xe</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(revenueReport.totalBookingRevenue)}</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-slate-200">
                        <CardHeader>
                          <CardTitle className="text-sm text-slate-500">Doanh thu phí phạt</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(revenueReport.totalPenaltyRevenue)}</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-slate-200">
                        <CardHeader>
                          <CardTitle className="text-sm text-slate-500">Tổng doanh thu</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-semibold text-emerald-600">{formatCurrency(revenueReport.totalRevenue)}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Biểu đồ doanh thu */}
                    <Card className="border border-slate-200">
                      <CardHeader>
                        <CardTitle>Biểu đồ phân tích doanh thu</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-center items-center w-full h-[300px]">
                            <BarChart
                              width={800}
                              height={300}
                              data={[
                                {
                                  name: revenueReport.stationName || 'Tất cả trạm',
                                  bookingRevenue: revenueReport.totalBookingRevenue,
                                  penaltyRevenue: revenueReport.totalPenaltyRevenue,
                                  totalRevenue: revenueReport.totalRevenue,
                                }
                              ]}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis 
                                dataKey="name" 
                                className="text-xs"
                              />
                              <YAxis 
                                className="text-xs"
                                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                              />
                              <Tooltip 
                                formatter={(value: number) => formatCurrency(value)}
                              />
                              <Legend />
                              <Bar 
                                dataKey="bookingRevenue" 
                                fill="hsl(217, 91%, 60%)" 
                                name="Doanh thu thuê xe"
                                radius={[8, 8, 0, 0]}
                              />
                              <Bar 
                                dataKey="penaltyRevenue" 
                                fill="hsl(0, 84%, 60%)" 
                                name="Doanh thu phí phạt"
                                radius={[8, 8, 0, 0]}
                              />
                            </BarChart>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 2 Charts chính theo yêu cầu */}
                    {peakHourStats && peakHourStats.data && peakHourStats.data.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pie Chart - Giờ cao điểm */}
                        <Card className="border border-slate-200">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <BarChart3 className="w-5 h-5 text-blue-600" />
                              Phân bố lượt thuê theo giờ cao điểm
                            </CardTitle>
                            <div className="space-y-1">
                              <p className="text-sm text-slate-600">
                                Giờ cao điểm: <span className="font-bold text-blue-600">{peakHourStats.peakHour}</span>
                              </p>
                              <p className="text-xs text-slate-500">
                                Tổng: {peakHourStats.totalRentals} lượt thuê
                              </p>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-center items-center w-full h-[380px]">
                              <PieChart width={500} height={380}>
                                  <Pie
                                    data={peakHourStats.data
                                      .filter(d => d.rentedVehicles > 0)
                                      .sort((a, b) => b.rentedVehicles - a.rentedVehicles)
                                      .slice(0, 8)
                                      .map(item => ({
                                        ...item,
                                        percentage: ((item.rentedVehicles / peakHourStats.totalRentals) * 100).toFixed(1)
                                      }))}
                                    dataKey="rentedVehicles"
                                    nameKey="hourRange"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    innerRadius={60}
                                    label={({ hourRange, percentage }) => `${hourRange.split(' - ')[0]}: ${percentage}%`}
                                    labelLine={true}
                                  >
                                    {peakHourStats.data
                                      .filter(d => d.rentedVehicles > 0)
                                      .sort((a, b) => b.rentedVehicles - a.rentedVehicles)
                                      .slice(0, 8)
                                      .map((_, index) => {
                                        const colors = [
                                          'hsl(217, 91%, 60%)',  // Blue
                                          'hsl(142, 76%, 36%)',  // Green
                                          'hsl(48, 96%, 53%)',   // Yellow
                                          'hsl(0, 84%, 60%)',    // Red
                                          'hsl(271, 76%, 53%)',  // Purple
                                          'hsl(32, 98%, 56%)',   // Orange
                                          'hsl(188, 94%, 43%)',  // Cyan
                                          'hsl(340, 82%, 52%)',  // Pink
                                        ];
                                        return (
                                          <Cell 
                                            key={`cell-${index}`} 
                                            fill={colors[index % colors.length]}
                                          />
                                        );
                                      })}
                                  </Pie>
                                  <Tooltip 
                                    content={({ payload }: any) => {
                                      if (!payload?.[0]) return null;
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-white p-3 shadow-lg rounded-lg border">
                                          <p className="font-semibold">{data.hourRange}</p>
                                          <p className="text-sm text-slate-600">
                                            {data.rentedVehicles} lượt ({data.percentage}%)
                                          </p>
                                        </div>
                                      );
                                    }}
                                  />
                                </PieChart>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <p className="text-xs text-slate-500 text-center">
                                Top 8 khung giờ có lượt thuê cao nhất
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Line Chart - Doanh thu theo trạm */}
                        {stationRevenueData && stationRevenueData.length > 0 && (
                          <Card className="border border-slate-200">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-emerald-600" />
                                Doanh thu theo điểm thuê
                              </CardTitle>
                              <p className="text-sm text-slate-600">
                                So sánh doanh thu giữa các trạm
                              </p>
                            </CardHeader>
                            <CardContent>
                              <div className="flex justify-center items-center w-full h-[380px] overflow-x-auto">
                                  <LineChart
                                    width={800}
                                    height={380}
                                    data={stationRevenueData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis 
                                      dataKey="stationName" 
                                      className="text-xs"
                                      angle={-45}
                                      textAnchor="end"
                                      height={80}
                                    />
                                    <YAxis 
                                      className="text-xs"
                                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                    />
                                    <Tooltip 
                                      content={({ payload }: any) => {
                                        if (!payload?.[0]) return null;
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-white p-4 shadow-lg rounded-lg border">
                                            <p className="font-semibold mb-2">{data.stationName}</p>
                                            <div className="space-y-1 text-sm">
                                              <p className="text-emerald-600">
                                                Tổng: {formatCurrency(data.totalRevenue)}
                                              </p>
                                              <p className="text-blue-600">
                                                Thuê xe: {formatCurrency(data.totalBookingRevenue)}
                                              </p>
                                              <p className="text-red-600">
                                                Phí phạt: {formatCurrency(data.totalPenaltyRevenue)}
                                              </p>
                                            </div>
                                          </div>
                                        );
                                      }}
                                    />
                                    <Legend />
                                    <Line 
                                      type="monotone" 
                                      dataKey="totalRevenue" 
                                      stroke="hsl(142, 76%, 36%)" 
                                      name="Tổng doanh thu"
                                      strokeWidth={3}
                                      dot={{ fill: 'hsl(142, 76%, 36%)', r: 5 }}
                                      activeDot={{ r: 7 }}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="totalBookingRevenue" 
                                      stroke="hsl(217, 91%, 60%)" 
                                      name="DT thuê xe"
                                      strokeWidth={2}
                                      strokeDasharray="5 5"
                                      dot={{ fill: 'hsl(217, 91%, 60%)', r: 4 }}
                                    />
                                  </LineChart>
                              </div>
                              <div className="mt-4 pt-4 border-t border-slate-200">
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                  <span>Top {stationRevenueData.length} trạm có doanh thu cao nhất</span>
                                  <span className="font-semibold text-emerald-600">
                                    Tổng: {formatCurrency(stationRevenueData.reduce((sum, s) => sum + s.totalRevenue, 0))}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Hiển thị message nếu không có dữ liệu line chart */}
                        {(!stationRevenueData || stationRevenueData.length === 0) && revenueFilters.stationId === 'ALL' && (
                          <Card className="border border-slate-200">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-emerald-600" />
                                Doanh thu theo điểm thuê
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center h-[380px]">
                              <div className="text-center text-slate-500">
                                {revenueLoading ? (
                                  <>
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                    <p>Đang tải dữ liệu...</p>
                                  </>
                                ) : (
                                  <>
                                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p>Chọn "Tất cả" trạm để xem biểu đồ so sánh</p>
                                  </>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ) : revenueReport ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-blue-400 opacity-50" />
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">Không có dữ liệu giờ cao điểm</h3>
                        <p className="text-slate-600">
                          Không có lượt thuê nào trong khoảng thời gian đã chọn.
                        </p>
                      </div>
                    ) : null}

                    {/* Bar Chart - Tình trạng xe theo trạm */}
                    {stationReports && stationReports.length > 0 && (
                      <Card className="border border-slate-200">
                        <CardHeader>
                          <CardTitle>Tình trạng xe theo trạm</CardTitle>
                          <p className="text-sm text-slate-600">
                            Thống kê phương tiện tại các trạm
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-center items-center w-full h-[400px] overflow-x-auto">
                              <BarChart
                                width={800}
                                height={400}
                                data={stationReports.slice(0, 10)}
                                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis 
                                  dataKey="stationName" 
                                  className="text-xs"
                                  angle={-45}
                                  textAnchor="end"
                                  height={100}
                                />
                                <YAxis 
                                  className="text-xs"
                                />
                                <Tooltip />
                                <Legend />
                                <Bar 
                                  dataKey="AVAILABLE" 
                                  fill="hsl(142, 76%, 36%)" 
                                  name="Sẵn sàng"
                                  stackId="a"
                                />
                                <Bar 
                                  dataKey="RENTED" 
                                  fill="hsl(221, 83%, 53%)" 
                                  name="Đang thuê"
                                  stackId="a"
                                />
                                <Bar 
                                  dataKey="RESERVED" 
                                  fill="hsl(48, 96%, 53%)" 
                                  name="Đã đặt"
                                  stackId="a"
                                />
                                <Bar 
                                  dataKey="UNAVAILABLE" 
                                  fill="hsl(0, 84%, 60%)" 
                                  name="Không khả dụng"
                                  stackId="a"
                                />
                              </BarChart>
                          </div>
                          <div className="mt-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Trạm</TableHead>
                                  <TableHead className="text-right">Tỷ lệ thuê</TableHead>
                                  <TableHead className="text-right">Nhu cầu</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {stationReports.slice(0, 5).map((station) => (
                                  <TableRow key={station.stationId}>
                                    <TableCell className="font-medium">{station.stationName}</TableCell>
                                    <TableCell className="text-right">{station.rentedRate}%</TableCell>
                                    <TableCell className="text-right">
                                      <Badge variant={
                                        station.demandLevel === 'CAO' ? 'destructive' : 
                                        station.demandLevel === 'TRUNG BÌNH' ? 'default' : 
                                        'secondary'
                                      }>
                                        {station.demandLevel}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="border border-slate-200">
                      <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                        <div>
                          <p className="font-medium text-slate-900">Phạm vi</p>
                          <p>{revenueReport.stationName}</p>
                          <p>
                            {formatLocalDate(revenueReport.fromDate)} → {formatLocalDate(revenueReport.toDate)}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Tổng giao dịch</p>
                          <p>{revenueReport.totalTransactions}</p>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Ghi chú</p>
                          <p>Chỉ tính các giao dịch hoàn tất trong khoảng thời gian đã chọn.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Damage Reports Tab */}
          <TabsContent value="damage-reports" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Báo cáo hư hỏng từ nhân viên</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Danh sách các báo cáo hư hỏng xe được ghi nhận bởi nhân viên trạm</p>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button 
                    onClick={loadDamageReports}
                    disabled={damageReportsLoading}
                  >
                    {damageReportsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                    Tải báo cáo hư hỏng
                  </Button>
                </div>

                {damageReportsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : damageReports.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    Chưa có báo cáo hư hỏng nào
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Thời gian</TableHead>
                          <TableHead>Biển số xe</TableHead>
                          <TableHead>Loại xe</TableHead>
                          <TableHead>Nhân viên</TableHead>
                          <TableHead>Trạm</TableHead>
                          <TableHead>Tình trạng sau</TableHead>
                          <TableHead>Ghi chú</TableHead>
                          <TableHead>Ảnh</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {damageReports.map((report) => {
                          const photoPaths = parsePhotoPaths(report.photoPath);
                          return (
                            <TableRow 
                              key={report.historyId}
                              className="cursor-pointer hover:bg-slate-50"
                              onClick={() => {
                                setSelectedDamageReport(report);
                                setShowDamageReportModal(true);
                              }}
                            >
                              <TableCell className="text-xs">
                                {new Date(report.actionTime).toLocaleString('vi-VN')}
                              </TableCell>
                              <TableCell className="font-medium">{report.licensePlate || 'N/A'}</TableCell>
                              <TableCell>{report.vehicleType || 'N/A'}</TableCell>
                              <TableCell>{report.staffName || 'N/A'}</TableCell>
                              <TableCell>{report.stationName || 'N/A'}</TableCell>
                              <TableCell>
                                {report.conditionAfter ? (
                                  <Badge variant="destructive">
                                    {getConditionLabel(report.conditionAfter)}
                                  </Badge>
                                ) : (
                                  <span className="text-slate-400 text-sm">Đang bảo trì</span>
                                )}
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <div className="text-sm text-slate-600 line-clamp-2" title={report.note || ''}>
                                  {report.note || 'Không có ghi chú'}
                                </div>
                              </TableCell>
                              <TableCell>
                                {photoPaths.length > 0 ? (
                                  <span className="text-sm text-blue-600">{photoPaths.length} ảnh</span>
                                ) : (
                                  <span className="text-slate-400 text-sm">Không có</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Damage Report Detail Modal */}
      <Dialog open={showDamageReportModal} onOpenChange={setShowDamageReportModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết báo cáo hư hỏng</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về báo cáo hư hỏng xe từ nhân viên
            </DialogDescription>
          </DialogHeader>

          {selectedDamageReport && (
            <div className="space-y-6">
              {/* Vehicle Information */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-500">Biển số xe</p>
                  <p className="text-lg font-semibold">{selectedDamageReport.licensePlate || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Loại xe</p>
                  <p className="text-lg">{selectedDamageReport.vehicleType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Nhân viên báo cáo</p>
                  <p className="text-lg">{selectedDamageReport.staffName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Trạm</p>
                  <p className="text-lg">{selectedDamageReport.stationName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Thời gian báo cáo</p>
                  <p className="text-lg">{new Date(selectedDamageReport.actionTime).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              {/* Vehicle Condition */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Tình trạng xe</h3>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium text-slate-500 mb-2">Tình trạng sau</p>
                  {selectedDamageReport.conditionAfter ? (
                    <Badge variant="destructive" className="text-base">
                      {getConditionLabel(selectedDamageReport.conditionAfter)}
                    </Badge>
                  ) : (
                    <span className="text-orange-600 font-medium">Đang bảo trì</span>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              {(selectedDamageReport.batteryLevel !== null || selectedDamageReport.mileage !== null) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedDamageReport.batteryLevel !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm font-medium text-slate-500 mb-1">Mức pin</p>
                      <p className="text-lg font-semibold">{selectedDamageReport.batteryLevel}%</p>
                    </div>
                  )}
                  {selectedDamageReport.mileage !== null && (
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm font-medium text-slate-500 mb-1">Số km đã đi</p>
                      <p className="text-lg font-semibold">{selectedDamageReport.mileage} km</p>
                    </div>
                  )}
                </div>
              )}

              {/* Note/Description */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Mô tả chi tiết</h3>
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {selectedDamageReport.note || 'Không có mô tả chi tiết'}
                  </p>
                </div>
              </div>

              {/* Photos */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Hình ảnh báo cáo</h3>
                {(() => {
                  const photoPaths = parsePhotoPaths(selectedDamageReport.photoPath);
                  return photoPaths.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {photoPaths.map((path, idx) => (
                        <a
                          key={idx}
                          href={resolveAssetUrl(path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          <img
                            src={resolveAssetUrl(path)}
                            alt={`Ảnh báo cáo ${idx + 1}`}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <div className="p-2 bg-slate-50 text-center text-sm text-slate-600">
                            Ảnh {idx + 1}
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-lg">
                      Không có hình ảnh
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDamageReportModal(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
