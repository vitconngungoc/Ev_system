import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { authenticatedApiCall, API_ENDPOINTS, uploadFiles } from '../../lib/api';
import { getConditionLabel, getConditionColor } from '../../lib/vehicleUtils';
import {
  Zap,
  RefreshCw,
  Battery,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wrench,
  Edit,
  Upload,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';

interface VehicleManagementProps {
  authToken: string;
}

interface Vehicle {
  vehicleId: number;
  licensePlate: string;
  batteryLevel: number;
  modelName: string;
  stationName: string;
  stationId: number;
  currentMileage: number;
  status: string;
  condition: string;
  vehicleType: string;
  pricePerHour: number;
  seatCount: number;
  rangeKm: number;
}

type VehicleStatus = 'AVAILABLE' | 'RENTED' | 'RESERVED' | 'UNAVAILABLE';
type VehicleCondition = 'EXCELLENT' | 'GOOD' | 'MINOR_DAMAGE' | 'MAINTENANCE_REQUIRED';

const BATTERY_MIN_THRESHOLD = 20; // Mức pin tối thiểu để xe có thể sẵn sàng

export function VehicleManagement({ authToken }: VehicleManagementProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDamageDialog, setShowDamageDialog] = useState(false);

  // Update form state
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [newCondition, setNewCondition] = useState<VehicleCondition>('GOOD');
  const [isUpdating, setIsUpdating] = useState(false);

  // Damage report form state
  const [damageDescription, setDamageDescription] = useState('');
  const [damagePhotos, setDamagePhotos] = useState<FileList | null>(null);
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      // Add timestamp to bypass browser cache
      const timestamp = new Date().getTime();
      const response = await authenticatedApiCall<Vehicle[]>(
        `${API_ENDPOINTS.STAFF_STATION_VEHICLES}?_t=${timestamp}`,
        authToken
      );
      console.log('✅ Fetched vehicles:', response); // Debug log
      setVehicles(response || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải danh sách xe';
      toast.error(message);
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenUpdateDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setBatteryLevel(vehicle.batteryLevel);
    setNewCondition(vehicle.condition as VehicleCondition);
    setShowUpdateDialog(true);
  };

  const handleUpdateVehicle = async () => {
    if (!selectedVehicle) return;

    // Validate: Xe đang RENTED/RESERVED không cho cập nhật
    if (selectedVehicle.status === 'RENTED' || selectedVehicle.status === 'RESERVED') {
      toast.error('Không thể cập nhật xe đang được thuê hoặc đã đặt.');
      return;
    }

    // Validate: Pin thấp cảnh báo (không block, chỉ warning)
    if (batteryLevel < BATTERY_MIN_THRESHOLD) {
      toast.warning(`⚠️ Pin chỉ còn ${batteryLevel}%. Nên sạc xe sớm.`);
    }

    setIsUpdating(true);
    try {
      // Backend chỉ nhận batteryLevel + newCondition, KHÔNG nhận status
      await authenticatedApiCall(
        API_ENDPOINTS.STAFF_UPDATE_VEHICLE(selectedVehicle.vehicleId),
        authToken,
        {
          method: 'PUT',
          body: JSON.stringify({
            batteryLevel,
            newCondition,
          }),
        }
      );

      toast.success('Cập nhật thông tin xe thành công!');
      setShowUpdateDialog(false);
      await fetchVehicles();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật xe';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenDamageDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDamageDescription('');
    setDamagePhotos(null);
    setShowDamageDialog(true);
  };

  const handleReportDamage = async () => {
    if (!selectedVehicle) return;

    if (!damageDescription.trim()) {
      toast.error('Vui lòng nhập mô tả hư hỏng');
      return;
    }

    if (!damagePhotos || damagePhotos.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ảnh');
      return;
    }

    setIsReporting(true);
    try {
      await uploadFiles(
        API_ENDPOINTS.STAFF_REPORT_DAMAGE(selectedVehicle.vehicleId),
        authToken,
        {
          description: damageDescription,
          photos: damagePhotos,
        },
        'POST'
      );

      toast.success('Đã gửi báo cáo hư hỏng thành công!');
      setShowDamageDialog(false);
      fetchVehicles();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể gửi báo cáo';
      toast.error(message);
    } finally {
      setIsReporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      AVAILABLE: { label: 'Sẵn sàng', variant: 'default', icon: CheckCircle },
      RENTED: { label: 'Đang thuê', variant: 'secondary', icon: Zap },
      RESERVED: { label: 'Đã đặt', variant: 'outline', icon: Settings },
      UNAVAILABLE: { label: 'Không khả dụng', variant: 'destructive', icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' as const, icon: Settings };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getConditionBadge = (condition: string) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(condition)}`}>
        {getConditionLabel(condition)}
      </span>
    );
  };

  const getBatteryColor = (level: number) => {
    if (level >= 80) return 'text-green-600';
    if (level >= 50) return 'text-yellow-600';
    if (level >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#FF6B00]" />
              <span>Quản lý Xe tại Trạm</span>
            </div>
            <Button variant="outline" size="sm" onClick={fetchVehicles} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Đang tải danh sách xe...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không có xe nào tại trạm này</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Biển số</th>
                    <th className="text-left p-4 font-semibold">Mẫu xe</th>
                    <th className="text-center p-4 font-semibold">Pin (%)</th>
                    <th className="text-center p-4 font-semibold">Trạng thái</th>
                    <th className="text-center p-4 font-semibold">Tình trạng</th>
                    <th className="text-center p-4 font-semibold">Số Km</th>
                    <th className="text-right p-4 font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.vehicleId} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-semibold text-[#FF6B00]">{vehicle.licensePlate}</div>
                        <div className="text-xs text-gray-500">ID: {vehicle.vehicleId}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{vehicle.modelName}</div>
                        <div className="text-xs text-gray-500">
                          {vehicle.vehicleType} • {vehicle.seatCount} chỗ
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Battery className={`w-5 h-5 ${getBatteryColor(vehicle.batteryLevel)}`} />
                          <span className={`font-semibold ${getBatteryColor(vehicle.batteryLevel)}`}>
                            {vehicle.batteryLevel}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">{getStatusBadge(vehicle.status)}</td>
                      <td className="p-4 text-center">{getConditionBadge(vehicle.condition)}</td>
                      <td className="p-4 text-center">
                        <span className="text-sm">{vehicle.currentMileage.toFixed(0)} km</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenUpdateDialog(vehicle)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Cập nhật
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDamageDialog(vehicle)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Báo hỏng
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Vehicle Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cập nhật thông tin xe</DialogTitle>
            <DialogDescription>
              Cập nhật pin và tình trạng cho xe {selectedVehicle?.licensePlate}.
              <br />
              <span className="text-orange-600 text-xs mt-1 inline-block">
                💡 Để đổi trạng thái sang "Không khả dụng", vui lòng dùng nút "Báo hư hỏng"
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Mức pin */}
            <div className="space-y-2">
              <Label htmlFor="battery">Mức pin (%)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="battery"
                  type="number"
                  min="0"
                  max="100"
                  value={batteryLevel}
                  onChange={(e) => setBatteryLevel(Number(e.target.value))}
                  className="flex-1"
                />
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={batteryLevel}
                  onChange={(e) => setBatteryLevel(Number(e.target.value))}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Battery className={`w-4 h-4 ${getBatteryColor(batteryLevel)}`} />
                <span className={getBatteryColor(batteryLevel)}>{batteryLevel}%</span>
              </div>
            </div>

            {/* Tình trạng xe */}
            <div className="space-y-2">
              <Label htmlFor="condition">Tình trạng xe</Label>
              <Select value={newCondition} onValueChange={(value: string) => setNewCondition(value as VehicleCondition)}>
                <SelectTrigger id="condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXCELLENT">Xuất sắc</SelectItem>
                  <SelectItem value="GOOD">Tốt</SelectItem>
                  <SelectItem value="MINOR_DAMAGE">Hư hỏng nhỏ</SelectItem>
                  <SelectItem value="MAINTENANCE_REQUIRED">Cần bảo trì</SelectItem>
                </SelectContent>
              </Select>
              {newCondition === 'MAINTENANCE_REQUIRED' && (
                <p className="text-xs text-orange-600">
                  ⚠️ Xe cần bảo trì sẽ được kiểm tra bởi Admin
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)} disabled={isUpdating}>
              Hủy
            </Button>
            <Button onClick={handleUpdateVehicle} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                'Cập nhật'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Damage Dialog */}
      <Dialog open={showDamageDialog} onOpenChange={setShowDamageDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Báo cáo hư hỏng xe
            </DialogTitle>
            <DialogDescription>
              Báo cáo hư hỏng cho xe {selectedVehicle?.licensePlate} - {selectedVehicle?.modelName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="damage-description">Mô tả hư hỏng *</Label>
              <Textarea
                id="damage-description"
                placeholder="Mô tả chi tiết về tình trạng hư hỏng của xe..."
                value={damageDescription}
                onChange={(e) => setDamageDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="damage-photos">Ảnh chứng minh *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="damage-photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setDamagePhotos(e.target.files)}
                  required
                />
                <Upload className="w-5 h-5 text-gray-400" />
              </div>
              {damagePhotos && damagePhotos.length > 0 && (
                <p className="text-sm text-green-600">
                  Đã chọn {damagePhotos.length} ảnh
                </p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Lưu ý:</strong> Sau khi gửi báo cáo, xe sẽ được chuyển sang trạng thái bảo trì.
                Admin sẽ xem xét và xử lý.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDamageDialog(false)} disabled={isReporting}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleReportDamage}
              disabled={isReporting}
            >
              {isReporting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Gửi báo cáo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
