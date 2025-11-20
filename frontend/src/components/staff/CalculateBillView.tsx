import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import {
  ArrowLeft,
  Calculator,
  Plus,
  Minus,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Camera,
  Eye,
} from 'lucide-react';
import { authenticatedApiCall, API_ENDPOINTS, uploadFiles } from '../../lib/api';
import { showSuccess, showError, showWarning } from '../../lib/toast-utils';

interface PenaltyFee {
  feeId: number;
  feeName: string;
  fixedAmount: number;
  description?: string;
}

interface SelectedFee {
  data: PenaltyFee;
  quantity: number;
}

interface BillData {
  qrCodeUrl?: string;
  invoicePdfPath?: string;
  paymentDue?: number;
  finalPaymentDue?: number;
  refundToCustomer?: number;
  bookingId: number;
}

interface CalculateBillViewProps {
  bookingId: number;
  authToken: string;
  onBack: () => void;
  onBillCalculated: (billData: BillData) => void;
}

export function CalculateBillView({ bookingId, authToken, onBack, onBillCalculated }: CalculateBillViewProps) {
  const [penaltyFees, setPenaltyFees] = useState<PenaltyFee[]>([]);
  const [selectedFees, setSelectedFees] = useState<Map<number, SelectedFee>>(new Map());
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  
  // Custom fee states
  const [customFeeName, setCustomFeeName] = useState('');
  const [customFeeAmount, setCustomFeeAmount] = useState('');
  const [customFeeDescription, setCustomFeeDescription] = useState('');
  const [customFeePhotos, setCustomFeePhotos] = useState<File[]>([]);
  const [customFeePreviews, setCustomFeePreviews] = useState<string[]>([]);

  // Load penalty fees
  useEffect(() => {
    loadPenaltyFees();
  }, []);

  const loadPenaltyFees = async () => {
    try {
      setLoading(true);
      const fees = await authenticatedApiCall(API_ENDPOINTS.STAFF_PENALTY_FEES, authToken);
      setPenaltyFees(Array.isArray(fees) ? fees : []);
    } catch (error: any) {
      showError(error?.message || 'Không thể tải danh sách phí phạt');
      setPenaltyFees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleIncrease = (feeId: number) => {
    setSelectedFees(prev => {
      const newMap = new Map(prev);
      if (newMap.has(feeId)) {
        const item = newMap.get(feeId)!;
        item.quantity++;
      } else {
        const feeData = penaltyFees.find(f => f.feeId === feeId);
        if (feeData) {
          newMap.set(feeId, { data: feeData, quantity: 1 });
        }
      }
      return newMap;
    });
  };

  const handleDecrease = (feeId: number) => {
    setSelectedFees(prev => {
      const newMap = new Map(prev);
      if (newMap.has(feeId)) {
        const item = newMap.get(feeId)!;
        item.quantity--;
        if (item.quantity <= 0) {
          newMap.delete(feeId);
        }
      }
      return newMap;
    });
  };

  const handleCustomPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const invalidFiles = files.filter(f => !f.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      showError('Chỉ chấp nhận file ảnh');
      return;
    }

    setCustomFeePhotos(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomFeePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveCustomPhoto = (index: number) => {
    setCustomFeePhotos(prev => prev.filter((_, i) => i !== index));
    setCustomFeePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotalPenalty = (): number => {
    let total = 0;
    selectedFees.forEach(item => {
      total += item.data.fixedAmount * item.quantity;
    });
    return total;
  };

  const handleCalculateBill = async () => {
    setCalculating(true);
    try {
      const formData = new FormData();

      // Selected fixed fees
      const selectedFeesPayload: any[] = [];
      selectedFees.forEach((item, feeId) => {
        selectedFeesPayload.push({ feeId: feeId, quantity: item.quantity });
      });
      
      if (selectedFeesPayload.length > 0) {
        formData.append('selectedFeesJson', JSON.stringify(selectedFeesPayload));
      }

      // Custom fee
      const customAmount = parseFloat(customFeeAmount.replace(',', '.'));
      if (customFeeName && !isNaN(customAmount) && customAmount !== 0) {
        formData.append('customFee.feeName', customFeeName);
        formData.append('customFee.amount', customAmount.toString());
        formData.append('customFee.description', customFeeDescription);
        
        if (customFeePhotos.length > 0) {
          customFeePhotos.forEach(file => {
            formData.append('customFee.photoFiles', file);
          });
        }
      }

      const bill = await uploadFiles(
        API_ENDPOINTS.STAFF_CALCULATE_BILL(bookingId),
        authToken,
        Object.fromEntries(formData),
        'POST'
      );

      showSuccess('Tính hóa đơn thành công!');
      onBillCalculated(bill);
    } catch (error: any) {
      console.error('Calculate bill error:', error);
      showError(error?.message || 'Tính hóa đơn thất bại');
    } finally {
      setCalculating(false);
    }
  };

  const totalPenalty = calculateTotalPenalty();
  const hasSelectedFees = selectedFees.size > 0;
  const customAmount = parseFloat(customFeeAmount.replace(',', '.'));
  const hasCustomFee = customFeeName && !isNaN(customAmount) && customAmount !== 0;
  const canCalculate = true; // Luôn cho phép tính hóa đơn, kể cả khi không có phụ phí

  return (
    <div className="p-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Tính toán hóa đơn #{bookingId}<span className="text-blue-500">.</span>
            </h1>
            <p className="text-slate-500 text-lg">Chọn các phí phạt và phí tùy chỉnh để tính tổng hóa đơn</p>
          </div>
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-5 py-2 text-sm font-bold">
            Bước 3: Tính hóa đơn
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-600 font-medium">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Penalty Fees List */}
          <div className="border border-slate-100 rounded-2xl p-8 bg-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900">Phí phạt cố định</h3>
            </div>

            {penaltyFees.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Không có phí phạt nào</p>
            ) : (
              <div className="space-y-3">
                {penaltyFees.map(fee => {
                  const selected = selectedFees.get(fee.feeId);
                  const quantity = selected?.quantity || 0;
                  
                  return (
                    <div
                      key={fee.feeId}
                      className={`flex items-center justify-between p-6 rounded-xl border transition-all ${
                        quantity > 0
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex-1 pr-6">
                        <p className="font-bold text-slate-900 mb-1">{fee.feeName}</p>
                        <p className="text-blue-600 font-bold text-lg">
                          {fee.fixedAmount.toLocaleString('vi-VN')} VNĐ
                        </p>
                        {fee.description && (
                          <p className="text-xs text-slate-500 mt-1">{fee.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 pl-4">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecrease(fee.feeId)}
                          disabled={quantity === 0}
                          className="w-10 h-10 rounded-xl"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        
                        <div className="w-16 text-center">
                          <span className="text-xl font-bold text-slate-900">{quantity}</span>
                        </div>
                        
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleIncrease(fee.feeId)}
                          className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Custom Fee */}
          <div className="border border-slate-100 rounded-2xl p-8 bg-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-slate-900">Phí tùy chỉnh</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-700 font-semibold mb-2 block">Tên phí</Label>
                  <Input
                    value={customFeeName}
                    onChange={(e) => setCustomFeeName(e.target.value)}
                    placeholder="VD: Phí vệ sinh xe"
                    className="rounded-xl"
                  />
                </div>
                
                <div>
                  <Label className="text-slate-700 font-semibold mb-2 block">Số tiền (VNĐ)</Label>
                  <Input
                    type="number"
                    value={customFeeAmount}
                    onChange={(e) => setCustomFeeAmount(e.target.value)}
                    placeholder="0"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-slate-700 font-semibold mb-2 block">Mô tả</Label>
                  <Textarea
                    value={customFeeDescription}
                    onChange={(e) => setCustomFeeDescription(e.target.value)}
                    placeholder="Ghi chú về phí này..."
                    rows={3}
                    className="rounded-xl resize-none"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-700 font-semibold mb-3 block">Ảnh minh họa</Label>
                
                {customFeePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {customFeePreviews.map((preview, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={preview}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover rounded-xl border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomPhoto(index)}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="flex items-center justify-center gap-3 border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-6 cursor-pointer transition-all bg-slate-50 hover:bg-slate-100">
                  <Camera className="w-6 h-6 text-slate-500" />
                  <span className="text-slate-600 font-medium">Thêm ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleCustomPhotoSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Summary */}
          <div className="border border-slate-100 rounded-2xl p-8 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900">Tổng kết chi phí</h3>
            </div>

            <div className="space-y-4">
              {/* Selected Fees */}
              {hasSelectedFees && (
                <div className="space-y-2">
                  {Array.from(selectedFees.values()).map((item, idx) => {
                    const itemTotal = item.data.fixedAmount * item.quantity;
                    return (
                      <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{item.data.feeName}</p>
                          <p className="text-sm text-slate-500">Số lượng: {item.quantity}</p>
                        </div>
                        <p className="text-lg font-bold text-blue-600">{itemTotal.toLocaleString('vi-VN')} đ</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Custom Fee */}
              {hasCustomFee && (
                <div className="bg-white p-4 rounded-xl">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{customFeeName}</p>
                      {customFeeDescription && (
                        <p className="text-sm text-slate-500 mt-1">{customFeeDescription}</p>
                      )}
                      {customFeePhotos.length > 0 && (
                        <p className="text-xs text-amber-600 font-medium mt-1">
                          📷 {customFeePhotos.length} ảnh đính kèm
                        </p>
                      )}
                    </div>
                    <p className={`text-lg font-bold ml-4 ${customAmount < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      {customAmount < 0 ? '-' : ''}{Math.abs(customAmount).toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                </div>
              )}

              {!hasSelectedFees && !hasCustomFee && (
                <div className="text-center py-8 bg-white rounded-xl">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Không có phụ phí</p>
                  <p className="text-xs text-slate-400 mt-2">Vẫn có thể tính hóa đơn với chi phí thuê xe cơ bản</p>
                </div>
              )}

              <Separator />

              {/* Total */}
              <div className="bg-white rounded-xl p-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-slate-900">Tổng phụ phí:</span>
                  <span className={`text-3xl font-black ${(totalPenalty + (hasCustomFee ? customAmount : 0)) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {(totalPenalty + (hasCustomFee ? customAmount : 0)).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Calculate Button */}
              <Button
                onClick={handleCalculateBill}
                disabled={calculating}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-lg"
              >
                {calculating ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang tính toán...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Calculator className="w-6 h-6" />
                    Tính hóa đơn
                  </div>
                )}
              </Button>

              <p className="text-sm text-slate-600 text-center">
                Hóa đơn sẽ bao gồm chi phí thuê xe + các phí phạt đã chọn
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
