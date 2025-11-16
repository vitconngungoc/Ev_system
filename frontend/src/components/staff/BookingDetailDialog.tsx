import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import {
  Calendar,
  MapPin,
  Car,
  CreditCard,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  Calculator,
  QrCode,
  Copy,
  Upload,
  Camera,
  X,
  ArrowLeft,
  AlertCircle,
  ExternalLink,
  FileText,
  Eye,
} from 'lucide-react';

import { authenticatedApiCall, API_ENDPOINTS, uploadFiles } from '../../lib/api';
import { showSuccess, showError } from '../../lib/toast-utils';
import { CalculateBillView } from './CalculateBillView';

interface Booking {
  bookingId: number;
  startDate: string;
  endDate: string;
  downpay?: number;
  finalFee?: number;
  status: string;
  createdAt?: string;
  
  rentalDeposit?: number;
  rentalDepositPaid?: boolean;
  reservationDepositPaid?: boolean;
  refund?: number;
  refundNote?: string;
  refundInfo?: string; // Bank info from backend
  invoicePdfPath?: string;
  checkInPhotoPaths?: string | string[];
  
  vehicle: {
    vehicleId: number;
    licensePlate: string;
    batteryLevel?: number;
    condition?: string;
    currentMileage?: number;
    damageReportPhotos?: string | string[];
    model: {
      modelId?: number;
      modelName: string;
      pricePerHour: number;
      initialValue?: number;
      vehicleType?: string;
      seatCount?: number;
      rangeKm?: number;
      batteryCapacity?: number;
      features?: string;
      description?: string;
      imagePaths?: string | string[];
    };
  };
  station: {
    stationId: number;
    name: string;
    address: string;
    hotline?: string;
    openingHours?: string;
    latitude?: number;
    longitude?: number;
  };
  renter?: {
    userId?: number;
    fullName: string;
    email: string;
    phone: string;
    cccd?: string;
    gplx?: string;
    verificationStatus?: string;
  };
}

interface BookingDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
  authToken: string;
  onStatusUpdate: (bookingId: number, newStatus: string, note?: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Chờ xác nhận', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  RENTING: { label: 'Đang thuê', className: 'bg-green-50 text-green-700 border border-green-200' },
  COMPLETED: { label: 'Hoàn thành', className: 'bg-slate-100 text-slate-700 border border-slate-200' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-red-50 text-red-700 border border-red-200' },
  CANCELLED_AWAIT_REFUND: { label: 'Chờ hoàn tiền', className: 'bg-orange-50 text-orange-700 border border-orange-200' },
  REFUNDED: { label: 'Đã hoàn tiền', className: 'bg-purple-50 text-purple-700 border border-purple-200' },
};

export function BookingDetailDialog({
  open,
  onOpenChange,
  booking,
  authToken,
  onStatusUpdate,
}: BookingDetailDialogProps) {
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentView, setShowPaymentView] = useState(false);
  const [showCalculateBillView, setShowCalculateBillView] = useState(false);
  const [showBillResultView, setShowBillResultView] = useState(false);
  const [showInitialCheckinView, setShowInitialCheckinView] = useState(false);
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rentalDepositAmount, setRentalDepositAmount] = useState<number>(0);
  const [checkInPhotoFiles, setCheckInPhotoFiles] = useState<File[]>([]);
  const [checkInPhotoPreviews, setCheckInPhotoPreviews] = useState<string[]>([]);
  
  const [billData, setBillData] = useState<any>(null);
  const [selectedPenalties, setSelectedPenalties] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const checkInPhotoInputRef = useRef<HTMLInputElement>(null);
  const checkoutPhotoInputRef = useRef<HTMLInputElement>(null);

  const [conditionBefore, setConditionBefore] = useState<string>('');
  const [battery, setBattery] = useState<string>('');
  const [mileage, setMileage] = useState<string>('');
  
  const [conditionAfter, setConditionAfter] = useState<string>('');
  const [batteryAfter, setBatteryAfter] = useState<string>('');
  const [mileageAfter, setMileageAfter] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'GATEWAY'>('CASH');
  const [checkoutPhotoFiles, setCheckoutPhotoFiles] = useState<File[]>([]);
  const [checkoutPhotoPreviews, setCheckoutPhotoPreviews] = useState<string[]>([]);

  const [bookingDetail, setBookingDetail] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  
  const [isConfirmingRefund, setIsConfirmingRefund] = useState(false);

  useEffect(() => {
    if (!open) {
      setConditionBefore('');
      setBattery('');
      setMileage('');
      setCheckInPhotoFiles([]);
      setCheckInPhotoPreviews([]);
      setShowInitialCheckinView(false);
      setShowCalculateBillView(false);
      setShowBillResultView(false);
      setBillData(null);
      setQrCodeUrl(null);
      // Reset file input refs
      if (checkInPhotoInputRef.current) {
        checkInPhotoInputRef.current.value = '';
      }
      console.log('🔄 Reset vehicle condition state');
    }
  }, [open]);

  useEffect(() => {
    const fetchBookingDetail = async () => {
      if (!booking?.bookingId) return;
      
      setIsLoadingDetail(true);
      try {
        console.log('📡 Fetching booking detail for bookingId:', booking.bookingId);
        const detail = await authenticatedApiCall(
          API_ENDPOINTS.BOOKING_DETAIL(booking.bookingId),
          authToken
        );
        console.log('✅ Booking detail fetched:', detail);
        
        // IMPORTANT: Merge detail with original booking to preserve refundNote from refund-requests API
        // BookingDetailResponse doesn't include refundNote, but we need it for CANCELLED_AWAIT_REFUND
        const mergedDetail = {
          ...detail,
          refund: detail.refund || booking.refund, // Preserve refund amount
          refundNote: detail.refundNote || booking.refundNote, // Preserve bank info from original booking
        };
        console.log('🔀 Merged booking detail with refundNote:', mergedDetail.refundNote);
        
        setBookingDetail(mergedDetail);
      } catch (error) {
        console.error('❌ Failed to fetch booking detail:', error);
        toast.error('Không thể tải thông tin chi tiết booking');
      } finally {
        setIsLoadingDetail(false);
      }
    };

    fetchBookingDetail();
  }, [booking?.bookingId, authToken]);

  if (!booking || !booking.bookingId) {
    console.warn('⚠️ BookingDetailDialog: Invalid booking data', booking);
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-white rounded-2xl border-0">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Dữ liệu không hợp lệ</h3>
            <p className="text-gray-500 mb-8">Không tìm thấy thông tin booking</p>
            <Button 
              onClick={() => onOpenChange(false)}
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-8"
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleCancelBooking = async () => {
    if (!note.trim()) {
      toast.error('Vui lòng nhập lý do hủy');
      return;
    }

    setIsProcessing(true);
    try {
      await authenticatedApiCall(
        API_ENDPOINTS.STAFF_CANCEL_BOOKING(booking.bookingId),
        authToken,
        {
          method: 'POST',
          body: JSON.stringify({ reason: note.trim() }),
        }
      );
      toast.success('Đã hủy booking thành công');
      await onStatusUpdate(booking.bookingId, 'CANCELLED', note);
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Hủy booking thất bại';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReservationDeposit = async () => {
    setIsProcessing(true);
    try {
      const response = await authenticatedApiCall(
        API_ENDPOINTS.STAFF_CONFIRM_DEPOSIT(booking.bookingId),
        authToken,
        { method: 'POST' }
      );
      toast.success(response.message || 'Xác nhận cọc 500k thành công. Booking đã chuyển sang CONFIRMED.');
      await onStatusUpdate(booking.bookingId, 'CONFIRMED', 'Đã xác nhận cọc đặt chỗ 500.000đ');
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Xác nhận cọc thất bại';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInitialCheckin = async () => {
    setShowInitialCheckinView(true);
    setIsGeneratingQr(true);
    setError(null);
    try {
      const response = await authenticatedApiCall<{ 
        message: string;
        rentalDepositAmount: number; 
        paymentUrl: string;
      }>(
        API_ENDPOINTS.STAFF_INITIATE_CHECKIN(booking.bookingId),
        authToken,
        { method: 'POST' }
      );
      
      setRentalDepositAmount(response.rentalDepositAmount);
      setQrCodeUrl(response.paymentUrl);
      toast.success(`Đã tạo mã thanh toán cọc thuê: ${response.rentalDepositAmount.toLocaleString('vi-VN')}đ`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo mã thanh toán cọc thuê';
      console.error('❌ Initial check-in error:', error);
      setError(message);
      toast.error(message);
      setQrCodeUrl(null);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleConfirmManualDeposit = async (paymentMethod: 'CASH' | 'BANK_TRANSFER') => {
    console.log('🚀 handleConfirmManualDeposit called');
    console.log('📸 checkInPhotoFiles:', checkInPhotoFiles);
    console.log('📸 checkInPhotoFiles.length:', checkInPhotoFiles?.length || 0);
    console.log('📸 checkInPhotoPreviews:', checkInPhotoPreviews);
    console.log('📸 checkInPhotoPreviews.length:', checkInPhotoPreviews?.length || 0);
    
    if (!checkInPhotoFiles || checkInPhotoFiles.length === 0) {
      toast.error('Vui lòng upload ít nhất 1 ảnh check-in trước khi xác nhận');
      return;
    }

    const missingFields: string[] = [];
    
    if (!conditionBefore || conditionBefore.trim() === '') {
      missingFields.push('Tình trạng xe');
    }
    
    if (!battery || battery.trim() === '' || isNaN(parseFloat(battery))) {
      missingFields.push('Mức pin');
    } else {
      const batteryVal = parseFloat(battery);
      if (batteryVal < 0 || batteryVal > 100) {
        toast.error('Mức pin phải từ 0-100%');
        return;
      }
    }
    
    if (!mileage || mileage.trim() === '' || isNaN(parseFloat(mileage))) {
      missingFields.push('Số km');
    } else {
      const mileageVal = parseFloat(mileage);
      if (mileageVal < 0) {
        toast.error('Số km phải >= 0');
        return;
      }
    }

    if (missingFields.length > 0) {
      toast.error(`Vui lòng nhập đầy đủ: ${missingFields.join(', ')}`);
      return;
    }

    console.log('🔍 State before sending:', {
      conditionBefore: `"${conditionBefore}"`,
      conditionBeforeTrimmed: `"${conditionBefore.trim()}"`,
      conditionBeforeLength: conditionBefore.length,
      battery: `"${battery}"`,
      batteryTrimmed: `"${battery.trim()}"`,
      mileage: `"${mileage}"`,
      mileageTrimmed: `"${mileage.trim()}"`
    });

    setIsProcessing(true);
    try {
      const formEntries: Record<string, any> = {
        depositPaymentMethod: paymentMethod,
        conditionBefore: conditionBefore.trim(),
        battery: battery.trim(),
        mileage: mileage.trim(),
        checkInPhotos: checkInPhotoFiles,
      };

      console.log('📤 Sending check-in request:', {
        bookingId: booking.bookingId,
        paymentMethod,
        conditionBefore: conditionBefore.trim(),
        battery: battery.trim(),
        mileage: mileage.trim(),
        photoCount: checkInPhotoFiles.length
      });

      const response = await uploadFiles(
        API_ENDPOINTS.STAFF_CHECKIN(booking.bookingId),
        authToken,
        formEntries,
        'POST'
      );

      console.log('✅ Check-in response:', response);
      
      toast.success(`Xác nhận cọc thủ công (${paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}) thành công!`);
      
      console.log('🔄 Refreshing bookings list...');
      await onStatusUpdate(booking.bookingId, 'RENTING', '');
      
      setShowInitialCheckinView(false);
      setCheckInPhotoFiles([]);
      setCheckInPhotoPreviews([]);
      setConditionBefore('');
      setBattery('');
      setMileage('');
      onOpenChange(false);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Xác nhận cọc thất bại';
      console.error('❌ Check-in error:', error);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckInPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('📸 handleCheckInPhotoSelect called, files:', files.length);
    
    if (files.length === 0) return;

    const invalidFiles = files.filter(f => !f.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast.error('Vui lòng chỉ chọn file hình ảnh');
      return;
    }

    setCheckInPhotoFiles(prev => {
      const updated = [...prev, ...files];
      console.log('📸 Updated checkInPhotoFiles:', updated.length, 'photos');
      return updated;
    });

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCheckInPhotoPreviews(prev => {
          const updated = [...prev, reader.result as string];
          console.log('📸 Updated checkInPhotoPreviews:', updated.length, 'previews');
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });

    toast.success(`Đã thêm ${files.length} ảnh check-in`);
  };

  const handleRemoveCheckInPhoto = (index: number) => {
    setCheckInPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setCheckInPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckoutPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const invalidFiles = files.filter(f => !f.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast.error('Vui lòng chỉ chọn file hình ảnh');
      e.target.value = '';
      return;
    }

    setCheckoutPhotoFiles(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCheckoutPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    toast.success(`Đã thêm ${files.length} ảnh check-out`);
    e.target.value = '';
  };

  const handleRemoveCheckoutPhoto = (index: number) => {
    setCheckoutPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setCheckoutPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return '0 đ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDuration = (totalMinutes: number) => {
    if (isNaN(totalMinutes) || totalMinutes < 0) {
      return 'N/A';
    }
    const totalHours = (totalMinutes / 60).toFixed(1);
    return `${totalHours} giờ`;
  };

  const calculateDurationInMinutes = (start?: string, end?: string) => {
    if (!start || !end) {
      return 0;
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) {
      return 0;
    }
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.round(diffMs / (1000 * 60));
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === 'COMPLETED' && booking.status === 'RENTING' && !paymentProofFile) {
      toast.error('Vui lòng upload biên lai thanh toán trước khi hoàn thành');
      return;
    }

    setIsProcessing(true);
    try {
      if (newStatus === 'CANCELLED') {
        await authenticatedApiCall(
          API_ENDPOINTS.STAFF_CANCEL_BOOKING(booking.bookingId),
          authToken,
          {
            method: 'POST',
            body: JSON.stringify({ reason: note.trim() }),
          }
        );
      }
      
      // Upload payment proof if completing from RENTING status
      if (newStatus === 'COMPLETED' && booking.status === 'RENTING' && paymentProofFile) {
        console.log('📤 Uploading payment proof before completing...');
        
        try {
          const formData = new FormData();
          formData.append('paymentProofFile', paymentProofFile);
          
          const response = await fetch(`http://localhost:8080${API_ENDPOINTS.STAFF_CONFIRM_PAYMENT(booking.bookingId)}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
            body: formData,
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Payment proof upload failed:', errorText);
            throw new Error('Upload ảnh thanh toán thất bại');
          }
          
          console.log('✅ Payment proof uploaded successfully');
        } catch (uploadError) {
          console.error('❌ Upload error:', uploadError);
          throw uploadError;
        }
      }
      
      await onStatusUpdate(booking.bookingId, newStatus, note);
      setNote('');
      setShowPaymentView(false);
      setShowBillResultView(false);
      setQrCodeUrl(null);
      setPaymentProofFile(null);
      setPaymentProofPreview(null);
      setBillData(null);
      toast.success('Cập nhật trạng thái thành công!');
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cập nhật thất bại';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenPayment = async () => {
    setShowCalculateBillView(true);
  };

  const handleBillCalculated = (billData: any) => {
    console.log('✅ Bill calculated:', billData);
    setBillData(billData);
    setQrCodeUrl(billData.qrCodeUrl || null);
    setShowCalculateBillView(false);
    setShowBillResultView(true);
  };

  const handleGenerateQrCode = async () => {
    setIsGeneratingQr(true);
    setError(null);
    try {
      const formEntries: Record<string, any> = {};
      
      if (selectedPenalties.length > 0) {
        formEntries.selectedFeesJson = JSON.stringify(selectedPenalties);
      }
      
      const response = await uploadFiles(
        API_ENDPOINTS.STAFF_CALCULATE_BILL(booking.bookingId),
        authToken,
        formEntries,
        'POST'
      );
      
      console.log('✅ Calculate bill response:', response);
      
      setBillData(response);
      
      if (response.paymentDue && response.paymentDue > 0 && response.qrCodeUrl) {
        setQrCodeUrl(response.qrCodeUrl);
      } else {
        setQrCodeUrl(null);
      }
      
      setShowPaymentView(false);
      setShowFinalConfirmation(true);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tính hóa đơn';
      console.error('❌ Calculate bill error:', error);
      setError(message);
      toast.error(message);
      setBillData(null);
      setQrCodeUrl(null);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    setPaymentProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPaymentProof = async () => {
    if (checkoutPhotoFiles.length === 0) {
      toast.error('Vui lòng chụp ít nhất 1 ảnh xác nhận check-out');
      return;
    }
    
    if (!conditionAfter.trim()) {
      toast.error('Vui lòng nhập tình trạng xe sau khi trả');
      return;
    }
    
    if (!batteryAfter || batteryAfter.trim() === '') {
      toast.error('Vui lòng nhập mức pin');
      return;
    }
    
    const batteryVal = parseFloat(batteryAfter);
    if (isNaN(batteryVal) || batteryVal < 0 || batteryVal > 100) {
      toast.error('Vui lòng nhập mức pin hợp lệ (0-100%)');
      return;
    }
    
    if (!mileageAfter || mileageAfter.trim() === '') {
      toast.error('Vui lòng nhập số km');
      return;
    }
    
    const mileageVal = parseFloat(mileageAfter);
    if (isNaN(mileageVal) || mileageVal < 0) {
      toast.error('Vui lòng nhập số km hợp lệ');
      return;
    }

    setIsUploadingProof(true);
    try {
      const formEntries: Record<string, any> = {
        paymentMethod: paymentMethod || 'CASH',
        conditionAfter: conditionAfter.trim(),
        battery: batteryVal,
        mileage: mileageVal,
        confirmPhotos: checkoutPhotoFiles,
      };
      
      console.log('📤 Sending checkout confirmation:', {
        bookingId: booking.bookingId,
        paymentMethod: paymentMethod || 'CASH',
        conditionAfter: conditionAfter.trim(),
        battery: batteryVal,
        mileage: mileageVal,
        photoCount: checkoutPhotoFiles.length
      });
      
      await uploadFiles(
        API_ENDPOINTS.STAFF_CONFIRM_PAYMENT(booking.bookingId),
        authToken,
        formEntries,
        'POST'
      );
      
      toast.success('Xác nhận check-out thành công!');
      await onStatusUpdate(booking.bookingId, 'COMPLETED', note);
      
      setShowFinalConfirmation(false);
      setShowPaymentView(false);
      setBillData(null);
      setQrCodeUrl(null);
      setPaymentProofFile(null);
      setPaymentProofPreview(null);
      setConditionAfter('');
      setBatteryAfter('');
      setMileageAfter('');
      setCheckoutPhotoFiles([]);
      setCheckoutPhotoPreviews([]);
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Xác nhận check-out thất bại';
      toast.error(message);
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleRemovePaymentProof = () => {
    setPaymentProofFile(null);
    setPaymentProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const parseBankInfo = (refundNote: string | undefined) => {
    if (!refundNote) return { bankName: 'N/A', accountNumber: 'N/A', accountHolder: 'N/A' };
    
    const bankNameMatch = refundNote.match(/Ngân hàng:\s*([^,]+)/);
    const accountNumberMatch = refundNote.match(/STK:\s*([^,]+)/);
    const accountHolderMatch = refundNote.match(/Chủ TK:\s*(.+)/);
    
    return {
      bankName: bankNameMatch?.[1]?.trim() || 'N/A',
      accountNumber: accountNumberMatch?.[1]?.trim() || 'N/A',
      accountHolder: accountHolderMatch?.[1]?.trim() || 'N/A'
    };
  };

  const handleConfirmRefund = async () => {
    if (!booking?.bookingId) {
      toast.error('Không tìm thấy mã booking');
      return;
    }

    if (booking.status !== 'CANCELLED_AWAIT_REFUND') {
      toast.error('Booking không ở trạng thái chờ hoàn tiền');
      return;
    }

    setIsConfirmingRefund(true);
    try {
      const response = await authenticatedApiCall(
        API_ENDPOINTS.STAFF_CONFIRM_REFUND(booking.bookingId),
        authToken,
        { method: 'POST' }
      );

      toast.success(response.message || 'Đã xác nhận hoàn cọc thành công');
      onStatusUpdate(booking.bookingId, 'REFUNDED');
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Xác nhận hoàn cọc thất bại';
      toast.error(message);
    } finally {
      setIsConfirmingRefund(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const getAvailableActions = () => {
    const actions = [];
    switch (booking.status) {
      case 'PENDING':
        actions.push(
          <Button
            key="confirm-deposit"
            onClick={handleConfirmReservationDeposit}
            disabled={isProcessing}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Xác nhận cọc 500k
          </Button>,
          <Button
            key="cancel"
            onClick={handleCancelBooking}
            disabled={isProcessing}
            variant="destructive"
            className="flex-1 rounded-xl"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        );
        break;
      case 'CONFIRMED':
        actions.push(
          <Button
            key="initial-checkin"
            onClick={handleInitialCheckin}
            disabled={isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Duyệt Booking (Cọc 2%)
          </Button>,
          <Button
            key="cancel"
            onClick={handleCancelBooking}
            disabled={isProcessing}
            variant="destructive"
            className="flex-1 rounded-xl"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        );
        break;
      case 'RENTING':
        if (!showPaymentView) {
          actions.push(
            <Button
              key="payment"
              onClick={handleOpenPayment}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculate & Check-out
            </Button>
          );
        } else {
          const canComplete = paymentProofFile !== null;
          actions.push(
            <div key="complete-section" className="flex-1 space-y-2">
              <Button
                onClick={() => handleStatusUpdate('COMPLETED')}
                disabled={isProcessing || !canComplete}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete & Return
              </Button>
              {!canComplete && (
                <p className="text-xs text-amber-600 text-center">
                  ⚠️ Please upload payment proof
                </p>
              )}
            </div>
          );
        }
        break;
    }
    return actions;
  };

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;

  const safeBooking = bookingDetail ? {
    bookingId: bookingDetail.bookingId,
    status: bookingDetail.status,
    createdAt: bookingDetail.createdAt,
    startDate: bookingDetail.startDate,
    endDate: bookingDetail.endDate,
    renter: {
      fullName: bookingDetail.renterName || 'N/A',
      phone: bookingDetail.renterPhone || 'N/A',
      email: bookingDetail.renterEmail || 'N/A',
    },
    vehicle: {
      vehicleId: 0,
      licensePlate: bookingDetail.vehicleLicensePlate || 'N/A',
      model: {
        modelName: bookingDetail.modelName || 'N/A',
        pricePerHour: bookingDetail.pricePerHour || 0,
      }
    },
    station: {
      stationId: 0,
      name: bookingDetail.stationName || 'N/A',
      address: bookingDetail.stationAddress || 'N/A',
    },
    rentalDeposit: bookingDetail.rentalDeposit || 0,
    reservationDepositPaid: bookingDetail.reservationDepositPaid || false,
    finalFee: bookingDetail.finalFee || 0,
    downpay: bookingDetail.rentalDeposit || 0,
    checkInPhotoPaths: bookingDetail.checkInPhotoPaths || [],
    invoicePdfPath: bookingDetail.invoicePdfPath,
    contractPdfPath: bookingDetail.contractPdfPath,
  } : {
    ...booking,
    renter: booking.renter ? {
      userId: booking.renter.userId,
      fullName: booking.renter.fullName || 'N/A',
      email: booking.renter.email || 'N/A',
      phone: booking.renter.phone || 'N/A',
      cccd: booking.renter.cccd,
      gplx: booking.renter.gplx,
      verificationStatus: booking.renter.verificationStatus,
    } : { fullName: 'N/A', email: 'N/A', phone: 'N/A' },
    vehicle: booking.vehicle ? {
      vehicleId: booking.vehicle.vehicleId || 0,
      licensePlate: booking.vehicle.licensePlate || 'N/A',
      batteryLevel: booking.vehicle.batteryLevel,
      condition: booking.vehicle.condition,
      currentMileage: booking.vehicle.currentMileage,
      damageReportPhotos: booking.vehicle.damageReportPhotos,
      model: booking.vehicle.model ? {
        modelId: booking.vehicle.model.modelId,
        modelName: booking.vehicle.model.modelName || 'N/A',
        pricePerHour: booking.vehicle.model.pricePerHour || 0,
        vehicleType: booking.vehicle.model.vehicleType,
        seatCount: booking.vehicle.model.seatCount,
        rangeKm: booking.vehicle.model.rangeKm,
        batteryCapacity: booking.vehicle.model.batteryCapacity,
        features: booking.vehicle.model.features,
        description: booking.vehicle.model.description,
        imagePaths: booking.vehicle.model.imagePaths,
      } : { modelName: 'N/A', pricePerHour: 0 }
    } : { 
      vehicleId: 0,
      licensePlate: 'N/A',
      model: { modelName: 'N/A', pricePerHour: 0 }
    },
    station: booking.station ? {
      stationId: booking.station.stationId || 0,
      name: booking.station.name || 'N/A',
      address: booking.station.address || 'N/A',
      hotline: booking.station.hotline,
      openingHours: booking.station.openingHours,
      latitude: booking.station.latitude,
      longitude: booking.station.longitude,
    } : {
      stationId: 0,
      name: 'N/A',
      address: 'N/A'
    },
    downpay: booking.downpay || booking.rentalDeposit || 0,
    finalFee: booking.finalFee || 0,
  };

  const bankInfo = {
    bankName: 'TPBank',
    accountNumber: '88303062005',
    accountName: 'CONG TY TNHH CONG NGHE EVOLVE',
    amount: safeBooking.finalFee,
    content: `TT BOOKING ${booking.bookingId}`,
  };

  const totalMinutes = calculateDurationInMinutes(safeBooking.startDate, safeBooking.endDate);
  const durationText = formatDuration(totalMinutes);
  const durationInHours = totalMinutes > 0 ? totalMinutes / 60 : 0;

  const vehicleInitialValue = bookingDetail?.initialValue || 0;
  const calculatedRentalDeposit = vehicleInitialValue * 0.02;
  const displayRentalDeposit = bookingDetail?.rentalDeposit || calculatedRentalDeposit;

  return (
    <>
      {/* 1️⃣ INITIAL CHECK-IN DIALOG */}
      <Dialog open={showInitialCheckinView && booking.status === 'CONFIRMED'} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setShowInitialCheckinView(false);
          setCheckInPhotoFiles([]);
          setCheckInPhotoPreviews([]);
          setConditionBefore('');
          setBattery('');
          setMileage('');
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 bg-white rounded-3xl border-0">
          <DialogTitle className="sr-only">
            Initial Check-in - Cọc 2% cho Booking #{booking?.bookingId}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Tạo mã QR thanh toán cọc 2% giá trị xe và upload ảnh check-in
          </DialogDescription>

          <div className="p-10">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">
                    Initial Check-in #{booking.bookingId}<span className="text-green-500">.</span>
                  </h1>
                  <p className="text-slate-500 text-lg">Thanh toán cọc 2% và xác nhận giao xe</p>
                </div>
                <Badge className="bg-green-50 text-green-700 border-green-200 px-5 py-2 text-sm font-bold">
                  Bước 2: Cọc Thuê Xe
                </Badge>
              </div>
            </div>

            <div className="space-y-8">
              {/* Deposit & Vehicle Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Deposit Amount */}
                <div className="border border-slate-100 rounded-2xl p-8 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Số tiền cọc 2%</h4>
                      <p className="text-xs text-slate-500">Bảo đảm thuê xe</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Giá trị xe:</span>
                      <span className="text-slate-900 font-bold">{formatCurrency(vehicleInitialValue || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tỷ lệ cọc:</span>
                      <span className="text-slate-900 font-bold">2%</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">Tổng cọc:</span>
                      <span className="text-2xl font-bold text-green-600">{formatCurrency(displayRentalDeposit)}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle & Customer Info */}
                <div className="space-y-4">
                  <div className="border border-slate-100 rounded-2xl p-6 hover:border-slate-200 transition-all bg-white">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Car className="w-5 h-5" />
                      Thông tin xe
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-sm">Mẫu xe:</span>
                        <span className="text-slate-900 font-bold">{safeBooking.vehicle.model.modelName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-sm">Biển số:</span>
                        <span className="text-slate-900 font-bold">{safeBooking.vehicle.licensePlate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-100 rounded-2xl p-6 hover:border-slate-200 transition-all bg-white">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Khách hàng
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-sm">Họ tên:</span>
                        <span className="text-slate-900 font-bold">{safeBooking.renter.fullName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-sm">SĐT:</span>
                        <span className="text-slate-900 font-bold">{safeBooking.renter.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment QR Section */}
              <div className="border border-slate-100 rounded-2xl p-8 bg-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-slate-900">Thanh toán cọc</h3>
                </div>

                
                {isGeneratingQr ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Đang tạo mã thanh toán...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-red-600 font-bold mb-4">{error}</p>
                    <Button 
                      onClick={handleInitialCheckin}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 font-bold"
                    >
                      Thử lại
                    </Button>
                  </div>
                ) : qrCodeUrl ? (
                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-xl p-6 text-center">
                      <p className="text-slate-500 text-sm mb-2 font-medium">Số tiền thanh toán</p>
                      <p className="text-3xl font-bold text-slate-900 mb-1">{formatCurrency(displayRentalDeposit)}</p>
                      <p className="text-slate-400 text-sm">Cọc 2% giá trị xe</p>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={() => window.open(qrCodeUrl, '_blank')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl h-12"
                      >
                        <ExternalLink className="w-5 h-5 mr-2" />
                        Mở trang thanh toán
                      </Button>

                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(qrCodeUrl);
                          toast.success('Đã copy link thanh toán!');
                        }}
                        variant="outline"
                        className="w-full border-2 border-slate-200 hover:border-slate-400 bg-white text-slate-700 font-semibold rounded-xl h-12"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy link
                      </Button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900 space-y-1">
                          <p className="font-bold">Lưu ý quan trọng:</p>
                          <ul className="space-y-1 text-blue-800">
                            <li>• Hoàn lại 100% khi trả xe</li>
                            <li>• Sau khi thanh toán, tiến hành check-in</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <QrCode className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium mb-6">Nhấn button để tạo mã thanh toán</p>
                    <Button
                      onClick={handleInitialCheckin}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-8"
                    >
                      Tạo mã QR
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Vehicle Condition & Photos */}
              <div className="border border-slate-100 rounded-2xl p-8 bg-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                    <Car className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="font-bold text-slate-900">Thông tin xe khi giao</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                  <div>
                    <label className="block font-bold text-slate-700 mb-2 text-sm">
                      Pin (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={battery}
                      onChange={(e) => setBattery(e.target.value)}
                      placeholder="85"
                      min="0"
                      max="100"
                      step="1"
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                        !battery ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-2 text-sm">
                      Số km <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                      placeholder="1250"
                      min="0"
                      step="0.1"
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                        !mileage ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-2 text-sm">
                      Tình trạng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={conditionBefore}
                      onChange={(e) => setConditionBefore(e.target.value)}
                      placeholder="VD: Xe nguyên vẹn"
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                        !conditionBefore.trim() ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block font-bold text-slate-700 mb-3">
                    Ảnh check-in <span className="text-red-500">*</span>
                    {checkInPhotoPreviews.length > 0 && (
                      <span className="ml-2 text-green-600 text-sm">({checkInPhotoPreviews.length} ảnh)</span>
                    )}
                  </label>

                  <input
                    ref={checkInPhotoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleCheckInPhotoSelect}
                    className="hidden"
                  />

                  {checkInPhotoPreviews.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        {checkInPhotoPreviews.map((preview, index) => (
                          <div key={index} className="relative group aspect-square">
                            <img
                              src={preview}
                              alt={`Check-in ${index + 1}`}
                              className="w-full h-full object-cover rounded-xl border-2 border-slate-200"
                            />
                            <button
                              onClick={() => handleRemoveCheckInPhoto(index)}
                              className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={() => checkInPhotoInputRef.current?.click()}
                        variant="outline"
                        className="w-full border-2 border-slate-200 hover:border-slate-400 rounded-xl h-11 font-medium"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Thêm ảnh
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => checkInPhotoInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 rounded-xl p-12 transition-all text-center"
                    >
                      <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium">Click để tải ảnh lên</p>
                      <p className="text-xs text-slate-400 mt-1">Có thể chọn nhiều ảnh</p>
                    </button>
                  )}
                </div>
              </div>

              {/* Validation Warnings */}
              {(checkInPhotoFiles.length === 0 || !conditionBefore.trim() || !battery || !mileage) && (
                <div className="space-y-3">
                  {checkInPhotoFiles.length === 0 && (
                    <div className="flex items-center gap-3 text-red-800 bg-red-50 border border-red-200 rounded-xl py-3 px-5">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="font-medium text-sm">Chưa có ảnh check-in</p>
                    </div>
                  )}
                  {(!conditionBefore.trim() || !battery || !mileage) && (
                    <div className="flex items-center gap-3 text-red-800 bg-red-50 border border-red-200 rounded-xl py-3 px-5">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="font-medium text-sm">
                        Thiếu thông tin xe ({[
                          !battery && 'pin',
                          !mileage && 'km',
                          !conditionBefore.trim() && 'tình trạng'
                        ].filter(Boolean).join(', ')})
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Manual Payment Confirmation */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <div className="flex gap-4 mb-6">
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-amber-900 font-bold mb-2">Xác nhận thanh toán thủ công</p>
                    <p className="text-amber-800 text-sm">Nếu khách hàng không thanh toán qua link, chọn phương thức thanh toán bên dưới</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleConfirmManualDeposit('CASH')}
                    disabled={
                      isProcessing || 
                      checkInPhotoFiles.length === 0 || 
                      !conditionBefore.trim() || 
                      !battery || 
                      !mileage
                    }
                    className="h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg disabled:bg-slate-200 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang xử lý...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        💵 Tiền mặt
                      </div>
                    )}
                  </Button>

                  <Button
                    onClick={() => handleConfirmManualDeposit('BANK_TRANSFER')}
                    disabled={
                      isProcessing || 
                      checkInPhotoFiles.length === 0 || 
                      !conditionBefore.trim() || 
                      !battery || 
                      !mileage
                    }
                    className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg disabled:bg-slate-200 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang xử lý...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        🏦 Chuyển khoản
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2️⃣ FINAL CONFIRMATION DIALOG (Check-out) */}
      <Dialog open={showFinalConfirmation} onOpenChange={setShowFinalConfirmation}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 bg-white rounded-3xl border-0">
          <DialogTitle className="sr-only">
            Xác nhận quyết toán booking #{booking?.bookingId}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Xem chi tiết hóa đơn và xác nhận thanh toán cho booking #{booking?.bookingId}
          </DialogDescription>
          
          <div className="p-10">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">
                    Check-out #{booking.bookingId}<span className="text-green-500">.</span>
                  </h1>
                  <p className="text-slate-500 text-lg">Xác nhận quyết toán và hoàn tất thuê xe</p>
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-5 py-2 text-sm font-bold">
                  Bước cuối: Thanh toán
                </Badge>
              </div>
            </div>

            {billData && (
              <div className="space-y-8">
                {/* Bill Summary */}
                <div className="border border-slate-100 rounded-2xl p-8 bg-white">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Calculator className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-900">Chi tiết hóa đơn</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tiền thuê dự tính:</span>
                      <span className="text-slate-900 font-bold">{formatCurrency(billData.baseRentalFee || 0)}</span>
                    </div>
                    
                    {/* Display detailed fee items if available */}
                    {billData.feeItems && billData.feeItems.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span className="text-amber-900 font-bold text-sm">Chi tiết phụ phí</span>
                        </div>
                        {billData.feeItems.map((item: any, index: number) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <span className="text-amber-900 font-medium text-sm">{item.feeName}</span>
                                {item.staffNote && (
                                  <p className="text-amber-700 text-xs mt-1">
                                    📝 {item.staffNote}
                                  </p>
                                )}
                                {item.adjustmentNote && (
                                  <p className="text-amber-700 text-xs mt-1 italic">
                                    ℹ️ {item.adjustmentNote}
                                  </p>
                                )}
                              </div>
                              <span className="text-amber-900 font-bold text-sm ml-3">
                                +{formatCurrency(item.amount)}
                              </span>
                            </div>
                            {index < billData.feeItems.length - 1 && (
                              <div className="border-t border-amber-200 pt-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Show total penalty fee if exists */}
                    {billData.totalPenaltyFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-red-600 font-bold">Tổng phụ phí:</span>
                        <span className="text-red-600 font-bold">+{formatCurrency(billData.totalPenaltyFee)}</span>
                      </div>
                    )}
                    
                    {billData.totalDiscount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-green-600">Giảm giá:</span>
                        <span className="text-green-600 font-bold">-{formatCurrency(billData.totalDiscount)}</span>
                      </div>
                    )}
                    
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-slate-900 font-bold">Tổng cộng:</span>
                      <span className="text-slate-900 font-bold">
                        {formatCurrency((billData.baseRentalFee || 0) + (billData.totalPenaltyFee || 0) - (billData.totalDiscount || 0))}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-600">Đã cọc:</span>
                      <span className="text-slate-900 font-bold">-{formatCurrency(billData.downpayPaid || 0)}</span>
                    </div>
                    
                    <Separator />
                    {billData.paymentDue > 0 ? (
                      <div className="flex justify-between items-center bg-red-50 -mx-4 -mb-4 p-4 rounded-b-2xl">
                        <span className="font-bold text-slate-900">Khách cần trả thêm:</span>
                        <span className="text-2xl font-bold text-red-600">{formatCurrency(billData.paymentDue)}</span>
                      </div>
                    ) : billData.refundToCustomer > 0 ? (
                      <div className="flex justify-between items-center bg-green-50 -mx-4 -mb-4 p-4 rounded-b-2xl">
                        <span className="font-bold text-slate-900">Hoàn lại cho khách:</span>
                        <span className="text-2xl font-bold text-green-600">{formatCurrency(billData.refundToCustomer)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center bg-blue-50 -mx-4 -mb-4 p-4 rounded-b-2xl">
                        <span className="font-bold text-slate-900">Trạng thái:</span>
                        <span className="font-bold text-blue-600">Đã thanh toán đủ</span>
                      </div>
                    )}
                  </div>
                </div>

                {billData.paymentDue > 0 && qrCodeUrl && (
                  <>
                    <Separator />
                    <div className="border border-slate-100 rounded-2xl p-8 bg-white">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                          <QrCode className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="font-bold text-slate-900">Thanh toán online</h3>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="bg-slate-50 rounded-xl p-6 text-center">
                          <p className="text-slate-500 text-sm mb-2 font-medium">Số tiền thanh toán</p>
                          <p className="text-3xl font-bold text-slate-900 mb-1">{formatCurrency(billData.paymentDue)}</p>
                          <p className="text-slate-400 text-sm">Khách cần trả thêm</p>
                        </div>

                        <div className="space-y-3">
                          <Button
                            onClick={() => window.open(qrCodeUrl, '_blank')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-12"
                          >
                            <ExternalLink className="w-5 h-5 mr-2" />
                            Mở trang thanh toán
                          </Button>
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(qrCodeUrl);
                              toast.success('Đã copy link!');
                            }}
                            variant="outline"
                            className="w-full border-2 border-slate-200 hover:border-slate-400 bg-white text-slate-700 font-semibold rounded-xl h-12"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy link
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {billData.refundToCustomer > 0 && (
                  <>
                    <Separator />
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-green-900 font-bold mb-2">Thông báo hoàn tiền</p>
                          <p className="text-green-800">
                            Tiền cọc lớn hơn tổng chi phí. Hoàn lại: <span className="font-bold">{formatCurrency(billData.refundToCustomer)}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Vehicle Return Info */}
                <div className="border border-slate-100 rounded-2xl p-8 bg-white">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                      <Car className="w-6 h-6 text-teal-600" />
                    </div>
                    <h3 className="font-bold text-slate-900">Thông tin trả xe</h3>
                  </div>

                  <div className="space-y-5">
                    {/* Payment Method */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-3 text-sm">
                        Phương thức thanh toán <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setPaymentMethod('CASH')}
                          className={`p-3 rounded-xl border-2 transition-all text-sm font-bold ${
                            paymentMethod === 'CASH' 
                              ? 'border-green-500 bg-green-50 text-green-700' 
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                           Tiền mặt
                        </button>
                        <button
                          onClick={() => setPaymentMethod('BANK_TRANSFER')}
                          className={`p-3 rounded-xl border-2 transition-all text-sm font-bold ${
                            paymentMethod === 'BANK_TRANSFER' 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                           Chuyển khoản
                        </button>
                        
                      </div>
                    </div>

                    {/* Vehicle Condition Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-2 text-sm">
                          Pin (%) <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={batteryAfter}
                          onChange={(e) => setBatteryAfter(e.target.value)}
                          placeholder="85"
                          className={`border-2 rounded-xl h-12 ${
                            !batteryAfter ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-green-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-2 text-sm">
                          Số km <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={mileageAfter}
                          onChange={(e) => setMileageAfter(e.target.value)}
                          placeholder="1250"
                          className={`border-2 rounded-xl h-12 ${
                            !mileageAfter ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-green-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-2 text-sm">
                          Tình trạng <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={conditionAfter}
                          onChange={(e) => setConditionAfter(e.target.value)}
                          placeholder="VD: Xe nguyên vẹn"
                          className={`border-2 rounded-xl h-12 ${
                            !conditionAfter.trim() ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-green-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Photo Upload */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-3">
                        Ảnh check-out <span className="text-red-500">*</span>
                        {checkoutPhotoPreviews.length > 0 && (
                          <span className="ml-2 text-green-600 text-sm">({checkoutPhotoPreviews.length} ảnh)</span>
                        )}
                      </label>
                      
                      <Input 
                        ref={checkoutPhotoInputRef} 
                        type="file" 
                        accept="image/*" 
                        multiple
                        onChange={handleCheckoutPhotoSelect} 
                        className="hidden" 
                        id="checkout-photo-input"
                      />

                      {checkoutPhotoPreviews.length === 0 ? (
                        <label
                          htmlFor="checkout-photo-input"
                          className="w-full border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 rounded-xl p-12 transition-all text-center cursor-pointer block"
                        >
                          <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                          <p className="text-slate-600 font-medium">Click để tải ảnh lên</p>
                          <p className="text-xs text-slate-400 mt-1">Có thể chọn nhiều ảnh</p>
                        </label>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-4 gap-4">
                            {checkoutPhotoPreviews.map((preview, index) => (
                              <div key={index} className="relative group aspect-square">
                                <img src={preview} alt={`Checkout ${index + 1}`} className="w-full h-full object-cover rounded-xl border-2 border-slate-200" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleRemoveCheckoutPhoto(index);
                                  }}
                                  className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <Button
                            type="button"
                            onClick={(e: React.MouseEvent) => {
                              e.preventDefault();
                              checkoutPhotoInputRef.current?.click();
                            }}
                            variant="outline"
                            className="w-full border-2 border-slate-200 hover:border-slate-400 rounded-xl h-11 font-medium"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Thêm ảnh
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Validation Warnings */}
                {(checkoutPhotoFiles.length === 0 || !conditionAfter || !batteryAfter || !mileageAfter) && (
                  <div className="space-y-3">
                    {checkoutPhotoFiles.length === 0 && (
                      <div className="flex items-center gap-3 text-red-800 bg-red-50 border border-red-200 rounded-xl py-3 px-5">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="font-medium text-sm">Chưa có ảnh check-out</p>
                      </div>
                    )}
                    {(!conditionAfter || !batteryAfter || !mileageAfter) && (
                      <div className="flex items-center gap-3 text-red-800 bg-red-50 border border-red-200 rounded-xl py-3 px-5">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="font-medium text-sm">
                          Thiếu thông tin xe ({[
                            !batteryAfter && 'pin',
                            !mileageAfter && 'km',
                            !conditionAfter && 'tình trạng'
                          ].filter(Boolean).join(', ')})
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                {/* Submit Button */}
                <Button
                  onClick={handleUploadPaymentProof}
                  disabled={isUploadingProof || checkoutPhotoFiles.length === 0 || !conditionAfter || !batteryAfter || !mileageAfter}
                  className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg disabled:bg-slate-200 disabled:cursor-not-allowed"
                >
                  {isUploadingProof ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang xử lý...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-6 h-6" />
                      ✅ Xác nhận hoàn thành check-out
                    </div>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 3️⃣ MAIN BOOKING DETAIL DIALOG */}
      <Dialog open={open && !showInitialCheckinView && !showPaymentView && !showFinalConfirmation} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 bg-white rounded-3xl border-0">
          <DialogTitle className="sr-only">
            Chi tiết booking #{booking?.bookingId}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Quản lý thông tin đặt xe và thanh toán cho booking #{booking?.bookingId}
          </DialogDescription>
          
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-slate-600 font-medium">Đang tải thông tin chi tiết...</p>
              </div>
            </div>
          ) : (
            <>
        {/* Calculate Bill View */}
        {showCalculateBillView && booking.status === 'RENTING' ? (
          <CalculateBillView
            bookingId={booking.bookingId}
            authToken={authToken}
            onBack={() => setShowCalculateBillView(false)}
            onBillCalculated={handleBillCalculated}
          />
        ) : showBillResultView && billData ? (
          // Bill Result View with QR and Invoice
          <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 min-h-[700px] p-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <button
                onClick={() => {
                  setShowBillResultView(false);
                  setBillData(null);
                  setQrCodeUrl(null);
                }}
                className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl border-2 border-slate-300 group-hover:border-slate-500 flex items-center justify-center transition-all">
                  <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="font-semibold">Quay lại</span>
              </button>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Booking</p>
                  <p className="text-2xl font-bold text-slate-900">#{booking.bookingId}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-xl">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            {/* Success Content */}
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-3">
                  Tính hóa đơn thành công<span className="text-green-500">!</span>
                </h2>
                <p className="text-lg text-slate-600">Hóa đơn đã được tạo và sẵn sàng thanh toán</p>
              </div>

              <div className="bg-white rounded-3xl shadow-2xl p-10 space-y-8">
                {/* Payment Amount or Refund */}
                {billData.paymentDue && billData.paymentDue > 0 ? (
                  <div className="text-center pb-6 border-b-2 border-slate-100">
                    <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-2">Tổng thanh toán</p>
                    <p className="text-5xl font-black text-slate-900">
                      {((billData.paymentDue || billData.finalPaymentDue || 0).toLocaleString('vi-VN'))} <span className="text-2xl">đ</span>
                    </p>
                  </div>
                ) : (
                  <div className="text-center pb-6 border-b-2 border-amber-100">
                    <div className="mb-4">
                      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                        <AlertCircle className="w-10 h-10 text-amber-600" />
                      </div>
                      <p className="text-sm text-amber-700 font-bold uppercase tracking-wider mb-2">Khách đã trả thừa tiền</p>
                      <p className="text-lg text-slate-600 mb-4">Staff cần hoàn trả lại cho khách</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
                      <p className="text-sm text-amber-700 font-semibold mb-2">Số tiền hoàn trả</p>
                      <p className="text-5xl font-black text-amber-600">
                        {((billData.refundToCustomer || 0).toLocaleString('vi-VN'))} <span className="text-2xl">đ</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* QR Code - Only show when paymentDue > 0 */}
                {qrCodeUrl && billData.paymentDue && billData.paymentDue > 0 && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
                        <QrCode className="w-6 h-6 text-blue-600" />
                        Mã QR thanh toán
                      </h3>
                      <p className="text-sm text-slate-600">Quét mã để thanh toán qua VNPay</p>
                    </div>
                    
                    <div className="flex justify-center">
                      <div className="bg-white p-6 rounded-2xl shadow-xl border-4 border-blue-200">
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code" 
                          className="w-72 h-72 object-contain"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={() => window.open(qrCodeUrl, '_blank')}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Mở QR trong tab mới
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Invoice Download */}
                {billData.invoicePdfPath && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 mb-1">Hóa đơn PDF</h4>
                        <p className="text-sm text-slate-600">Hóa đơn đã được tạo và sẵn sàng tải xuống</p>
                      </div>
                      <Button
                        onClick={() => window.open(`http://localhost:8080${billData.invoicePdfPath}`, '_blank')}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 shadow-lg"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Xem hóa đơn
                      </Button>
                    </div>
                  </div>
                )}

                {/* Vehicle Return Information */}
                <div className="space-y-6 bg-white rounded-2xl p-6 border-2 border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Car className="w-6 h-6 text-blue-600" />
                    <div>
                      <h4 className="font-bold text-slate-900">Thông tin xe khi trả</h4>
                      <p className="text-sm text-slate-600">Nhập đầy đủ thông tin trước khi hoàn tất</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-700 font-semibold mb-2 block">
                          Tình trạng xe sau khi trả <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          value={conditionAfter}
                          onChange={(e) => setConditionAfter(e.target.value)}
                          placeholder="VD: Xe sạch sẽ, không trầy xước..."
                          rows={3}
                          className="rounded-xl resize-none"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 font-semibold mb-2 block">
                          Mức pin (%) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={batteryAfter}
                          onChange={(e) => setBatteryAfter(e.target.value)}
                          placeholder="0-100"
                          min="0"
                          max="100"
                          className="rounded-xl"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 font-semibold mb-2 block">
                          Số km <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={mileageAfter}
                          onChange={(e) => setMileageAfter(e.target.value)}
                          placeholder="Nhập số km hiện tại"
                          min="0"
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-slate-700 font-semibold mb-2 block">
                        Ảnh check-out <span className="text-red-500">*</span>
                      </Label>
                      
                      {checkoutPhotoPreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          {checkoutPhotoPreviews.map((preview, index) => (
                            <div key={index} className="relative group aspect-square">
                              <img
                                src={preview}
                                alt={`Checkout ${index + 1}`}
                                className="w-full h-full object-cover rounded-xl border-2 border-slate-200"
                              />
                              <button
                                onClick={() => handleRemoveCheckoutPhoto(index)}
                                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-blue-400 hover:border-blue-500 rounded-xl p-4 cursor-pointer transition-all bg-blue-50 hover:bg-blue-100">
                          <Upload className="w-5 h-5 text-blue-700" />
                          <span className="text-sm font-medium text-blue-900">Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleCheckoutPhotoSelect}
                            className="hidden"
                          />
                        </label>
                        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-blue-400 hover:border-blue-500 rounded-xl p-4 cursor-pointer transition-all bg-blue-50 hover:bg-blue-100">
                          <Camera className="w-5 h-5 text-blue-700" />
                          <span className="text-sm font-medium text-blue-900">Chụp ảnh</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            onChange={handleCheckoutPhotoSelect}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment Method Selection */}
                <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200">
                  <Label className="text-slate-700 font-semibold mb-3 block">
                    Phương thức thanh toán <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'CASH'
                          ? 'border-green-500 bg-green-50 shadow-lg'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`text-2xl mb-2 ${paymentMethod === 'CASH' ? 'text-green-600' : 'text-slate-400'}`}>💵</div>
                        <p className={`font-bold ${paymentMethod === 'CASH' ? 'text-green-700' : 'text-slate-600'}`}>
                          Tiền mặt
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('BANK_TRANSFER')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'BANK_TRANSFER'
                          ? 'border-blue-500 bg-blue-50 shadow-lg'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`text-2xl mb-2 ${paymentMethod === 'BANK_TRANSFER' ? 'text-blue-600' : 'text-slate-400'}`}>🏦</div>
                        <p className={`font-bold ${paymentMethod === 'BANK_TRANSFER' ? 'text-blue-700' : 'text-slate-600'}`}>
                          Chuyển khoản
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Complete Button */}
                <Button
                  onClick={handleUploadPaymentProof}
                  disabled={isUploadingProof || !conditionAfter || !batteryAfter || !mileageAfter || checkoutPhotoFiles.length === 0 || !paymentMethod}
                  className="w-full h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold rounded-2xl shadow-xl text-lg border-0"
                  style={{
                    background: (isUploadingProof || !conditionAfter || !batteryAfter || !mileageAfter || checkoutPhotoFiles.length === 0 || !paymentMethod)
                      ? 'linear-gradient(to right, rgb(203 213 225), rgb(148 163 184))'
                      : 'linear-gradient(to right, rgb(22 163 74), rgb(5 150 105))'
                  }}
                >
                  {isUploadingProof ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang xử lý...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6" />
                      Hoàn tất và trả xe
                    </div>
                  )}
                </Button>

                {(!conditionAfter || !batteryAfter || !mileageAfter || checkoutPhotoFiles.length === 0 || !paymentMethod) && (
                  <p className="text-sm text-amber-700 text-center font-medium">
                    ⚠️ Vui lòng nhập đầy đủ thông tin và upload ảnh check-out
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : showPaymentView && booking.status === 'RENTING' ? (
          <div className="relative bg-white min-h-[600px] p-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <button
                onClick={() => {
                  setShowPaymentView(false);
                  setBillData(null);
                  setQrCodeUrl(null);
                  setPaymentProofFile(null);
                  setPaymentProofPreview(null);
                }}
                className="flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full border border-slate-200 group-hover:border-slate-400 flex items-center justify-center transition-all">
                  <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="font-medium">Quay lại</span>
              </button>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Booking</p>
                  <p className="text-2xl font-bold text-slate-900">#{booking.bookingId}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                  <Calculator className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm">
              <div className="text-center max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
                  <Calculator className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-3">Tính toán hóa đơn<span className="text-green-500">.</span></h3>
                <p className="text-slate-500 mb-8 text-lg">Nhấn button để tính tổng chi phí thuê xe</p>
                
                <Button
                  onClick={handleGenerateQrCode}
                  disabled={isGeneratingQr}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl h-14 px-10 shadow-lg"
                >
                  {isGeneratingQr ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang tính toán...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Tính hóa đơn
                    </div>
                  )}
                </Button>
              </div>

              {error && (
                <div className="mt-8 bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                  <div className="flex gap-4">
                    <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-red-900 font-bold mb-2">Lỗi tính toán</p>
                      <p className="text-red-800">{error}</p>
                      <Button
                        onClick={handleGenerateQrCode}
                        size="sm"
                        className="mt-4 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                      >
                        Thử lại
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-10">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">
                    Booking #{booking.bookingId}<span className="text-green-500">.</span>
                  </h1>
                  <p className="text-slate-500 text-lg">Manage booking status and details</p>
                </div>
                <Badge className={statusConfig.className + ' px-5 py-2 text-sm font-bold'}>
                  {statusConfig.label}
                </Badge>
              </div>
            </div>

            {/* CANCELLED_AWAIT_REFUND or REFUNDED - Show refund info */}
            {(booking.status === 'CANCELLED_AWAIT_REFUND' || booking.status === 'REFUNDED') ? (
              <div className="space-y-6">
                {(() => {
                  // Get refundNote/refundInfo from either bookingDetail or booking props
                  const actualRefundNote = bookingDetail?.refundNote || bookingDetail?.refundInfo || booking.refundNote || booking.refundInfo;
                  const actualRefund = bookingDetail?.refund || booking.refund;
                  
                  console.log('🔍 DEBUG REFUND INFO:', {
                    bookingId: booking.bookingId,
                    status: booking.status,
                    'booking.refundNote': booking.refundNote,
                    'booking.refundInfo': booking.refundInfo,
                    'bookingDetail?.refundNote': bookingDetail?.refundNote,
                    'bookingDetail?.refundInfo': bookingDetail?.refundInfo,
                    'actualRefundNote': actualRefundNote,
                    'actualRefund': actualRefund,
                    hasRefundNote: !!actualRefundNote,
                  });
                  return null;
                })()}
                
                {safeBooking.renter && safeBooking.renter.fullName !== 'N/A' && (
                  <div className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 shadow-sm">
                    <h4 className="font-bold text-blue-900 mb-6 flex items-center gap-3 text-lg">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      Thông tin khách hàng
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 mb-1">Họ tên</p>
                            <p className="text-slate-900 font-bold text-base truncate">{safeBooking.renter.fullName}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 mb-1">Số điện thoại</p>
                            <p className="text-slate-900 font-bold text-base">{safeBooking.renter.phone}</p>
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-2 bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 mb-1">Email</p>
                            <p className="text-slate-900 font-bold text-base truncate">{safeBooking.renter.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Account Info - check both sources */}
                {(() => {
                  const refundNote = bookingDetail?.refundNote || bookingDetail?.refundInfo || booking.refundNote || booking.refundInfo;
                  
                  if (!refundNote) {
                    console.log('⚠️ No refundNote/refundInfo found in either bookingDetail or booking');
                    return null;
                  }
                  
                  const { bankName, accountNumber, accountHolder } = parseBankInfo(refundNote);
                  
                  return (
                    <div className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 shadow-sm">
                      <h4 className="font-bold text-emerald-900 mb-6 flex items-center gap-3 text-lg">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        Thông tin tài khoản nhận hoàn tiền
                      </h4>
                      <div className="space-y-3">
                        {/* Bank Name */}
                        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-xs text-slate-500 mb-1 font-medium">Ngân hàng</p>
                              <p className="text-slate-900 font-bold text-lg">{bankName}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(bankName)}
                              className="ml-3 h-9 w-9 p-0 hover:bg-emerald-100 rounded-xl"
                            >
                              <Copy className="w-4 h-4 text-emerald-600" />
                            </Button>
                          </div>
                        </div>

                        {/* Account Number */}
                        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-xs text-slate-500 mb-1 font-medium">Số tài khoản</p>
                              <p className="text-slate-900 font-bold text-xl font-mono tracking-wider">{accountNumber}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(accountNumber)}
                              className="ml-3 h-9 w-9 p-0 hover:bg-emerald-100 rounded-xl"
                            >
                              <Copy className="w-4 h-4 text-emerald-600" />
                            </Button>
                          </div>
                        </div>

                        {/* Account Holder */}
                        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-xs text-slate-500 mb-1 font-medium">Chủ tài khoản</p>
                              <p className="text-slate-900 font-bold text-lg uppercase">{accountHolder}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(accountHolder)}
                              className="ml-3 h-9 w-9 p-0 hover:bg-emerald-100 rounded-xl"
                            >
                              <Copy className="w-4 h-4 text-emerald-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 bg-emerald-100 rounded-xl p-3 border border-emerald-200">
                        <p className="text-xs text-emerald-800 text-center font-medium">
                          💡 Click biểu tượng copy để sao chép nhanh thông tin
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Refund Amount */}
                {(() => {
                  const refund = bookingDetail?.refund || booking.refund;
                  
                  if (refund === undefined) return null;
                  
                  return (
                    <div className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 shadow-sm">
                      <h4 className="font-bold text-amber-900 mb-4 flex items-center gap-3 text-lg">
                        <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 text-white" />
                        </div>
                        Số tiền hoàn
                      </h4>
                      <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-amber-100">
                        <p className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                          {formatCurrency(refund)}
                        </p>
                        <div className="inline-flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full">
                          <CreditCard className="w-4 h-4 text-amber-700" />
                          <p className="text-sm text-amber-800 font-semibold">Tiền cọc cần hoàn lại cho khách</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Only show confirm button for CANCELLED_AWAIT_REFUND status */}
                {booking.status === 'CANCELLED_AWAIT_REFUND' && (
                  <div className="bg-white border-2 border-slate-100 rounded-3xl p-8">
                    <Button
                      onClick={handleConfirmRefund}
                      disabled={isConfirmingRefund}
                      className="w-full h-16 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg disabled:bg-slate-200 disabled:cursor-not-allowed transition-all text-lg"
                    >
                      {isConfirmingRefund ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Đang xử lý...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <CheckCircle className="w-6 h-6" />
                          <span>✅ Xác nhận đã hoàn cọc</span>
                        </div>
                      )}
                    </Button>
                    <p className="text-center text-slate-500 mt-4">
                      Sau khi xác nhận, booking sẽ chuyển sang trạng thái <span className="font-bold text-slate-700">Đã hoàn tiền</span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
            <div className="space-y-8">
              {/* Customer Info */}
              {safeBooking.renter && safeBooking.renter.fullName !== 'N/A' && (
                <div className="border border-slate-100 rounded-2xl p-8 bg-slate-50">
                  <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <User className="w-5 h-5" />
                    Customer information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex items-center gap-4">
                      <User className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-500">Name:</span>
                      <span className="text-slate-900 font-bold">{safeBooking.renter.fullName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-500">Phone:</span>
                      <span className="text-slate-900 font-bold">{safeBooking.renter.phone}</span>
                    </div>
                    <div className="flex items-center gap-4 md:col-span-2">
                      <Mail className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-500">Email:</span>
                      <span className="text-slate-900 font-bold">{safeBooking.renter.email}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div className="border border-slate-100 rounded-2xl p-6 hover:border-slate-200 transition-all bg-white">
                    <div className="flex items-start gap-4">
                      <Calendar className="w-6 h-6 text-slate-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Thời gian bắt đầu</p>
                        <p className="text-slate-900 font-bold">{formatDate(safeBooking.startDate)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="border border-slate-100 rounded-2xl p-6 hover:border-slate-200 transition-all bg-white">
                    <div className="flex items-start gap-4">
                      <Calendar className="w-6 h-6 text-slate-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Thời gian kết thúc</p>
                        <p className="text-slate-900 font-bold">{formatDate(safeBooking.endDate)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="border border-slate-100 rounded-2xl p-6 hover:border-slate-200 transition-all bg-white">
                    <div className="flex items-center gap-4">
                      <Clock className="w-6 h-6 text-slate-400" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Thời lượng</p>
                        <p className="text-slate-900 font-bold">{durationText}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-slate-100 rounded-2xl p-6 hover:border-slate-200 transition-all bg-white">
                    <div className="flex items-start gap-4">
                      <Car className="w-6 h-6 text-slate-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Phương tiện</p>
                        <p className="text-slate-900 font-bold">{safeBooking.vehicle.model.modelName}</p>
                        <p className="text-slate-500">Biển số: {safeBooking.vehicle.licensePlate}</p>
                      </div>
                    </div>
                  </div>
                  <div className="border border-slate-100 rounded-2xl p-6 hover:border-slate-200 transition-all bg-white">
                    <div className="flex items-start gap-4">
                      <MapPin className="w-6 h-6 text-slate-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Trạm</p>
                        <p className="text-slate-900 font-bold">{safeBooking.station.name}</p>
                        <p className="text-slate-500 text-sm">{safeBooking.station.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment */}
              <div className="border border-slate-100 rounded-2xl p-8 bg-white">
                <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <CreditCard className="w-5 h-5" />
                  Thông tin thanh toán
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Giá theo giờ:</span>
                    <span className="text-slate-900 font-bold">{formatCurrency(safeBooking.vehicle.model.pricePerHour)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Thời lượng:</span>
                    <span className="text-slate-900 font-bold">{durationText}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cọc giữ chỗ (500k):</span>
                    <span className={`font-bold ${safeBooking.reservationDepositPaid ? 'text-green-600' : 'text-slate-400'}`}>
                      {safeBooking.reservationDepositPaid ? '✓ ' : '✗ '}
                      {formatCurrency(safeBooking.reservationDepositPaid ? 500000 : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cọc thuê xe (2%):</span>
                    <span className="text-blue-600 font-bold">
                      {formatCurrency(displayRentalDeposit)}
                    </span>
                  </div>
                  {vehicleInitialValue > 0 && (
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Giá trị xe (từ backend):</span>
                      <span>{formatCurrency(vehicleInitialValue)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">Tổng cộng:</span>
                    <span className="font-bold text-slate-900 text-xl">{formatCurrency(safeBooking.finalFee)}</span>
                  </div>
                </div>
              </div>

              {/* Note */}
              {getAvailableActions().length > 0 && (
                <div className="space-y-3">
                  <Label htmlFor="note" className="text-slate-700 font-bold">Ghi chú (tùy chọn)</Label>
                  <Textarea
                    id="note"
                    placeholder="Thêm ghi chú cho booking này..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="border-2 border-slate-200 rounded-2xl focus:border-slate-900 resize-none"
                  />
                </div>
              )}

              {/* Actions */}
              {getAvailableActions().length > 0 && (
                <div className="flex gap-4 pt-6 border-t border-slate-100">
                  {getAvailableActions()}
                </div>
              )}

              {(booking.status === 'COMPLETED' || booking.status === 'CANCELLED') && (
                <div className="text-center py-12 text-slate-500 border border-slate-100 rounded-2xl bg-slate-50">
                  <p className="text-lg">Booking đã {booking.status === 'COMPLETED' ? 'hoàn thành' : 'hủy'}</p>
                </div>
              )}
            </div>
            )}
          </div>
        )}
        </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}