import { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from 'sonner';
import { CheckCircle, XCircle, FileText, Image as ImageIcon, ZoomIn } from 'lucide-react';
import { authenticatedApiCall, API_ENDPOINTS, resolveAssetUrl } from '../../lib/api';

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
}

interface VerificationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: PendingUser;
  authToken: string;
  onVerificationComplete: (action: 'approved' | 'rejected') => void;
}

export function VerificationDetailDialog({
  open,
  onOpenChange,
  user,
  authToken,
  onVerificationComplete,
}: VerificationDetailDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await authenticatedApiCall(
        API_ENDPOINTS.STAFF_PROCESS_VERIFICATION(user.userId),
        authToken,
        {
          method: 'POST',
          body: JSON.stringify({
            approved: true,
            reason: null,
          }),
        }
      );

      toast.success('Đã duyệt xác minh thành công!');
      onVerificationComplete('approved');
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Xác minh thất bại';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    setIsProcessing(true);
    try {
      await authenticatedApiCall(
        API_ENDPOINTS.STAFF_PROCESS_VERIFICATION(user.userId),
        authToken,
        {
          method: 'POST',
          body: JSON.stringify({
            approved: false,
            reason: rejectionReason.trim(),
          }),
        }
      );

      toast.success('Đã từ chối xác minh');
      onVerificationComplete('rejected');
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Từ chối thất bại';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageClick = (imagePath: string) => {
    const imageUrl = resolveAssetUrl(imagePath);
    console.log('=== IMAGE CLICK DEBUG ===');
    console.log('Image Path:', imagePath);
    console.log('Resolved URL:', imageUrl);
    console.log('========================');
    if (imageUrl) {
      setImagePreview(imageUrl);
      console.log('Image preview set to:', imageUrl);
    } else {
      console.error('Failed to resolve image URL');
    }
  };

  return (
    <>
      <Dialog open={open && !imagePreview} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Xác minh tài khoản</DialogTitle>
          <DialogDescription>
            Kiểm tra thông tin và giấy tờ của khách hàng
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <h4 className="mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Thông tin cá nhân
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Họ tên:</span>
                <p className="font-semibold">{user.fullName}</p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-semibold">{user.email}</p>
              </div>
              <div>
                <span className="text-gray-600">Số điện thoại:</span>
                <p className="font-semibold">{user.phone}</p>
              </div>
              <div>
                <span className="text-gray-600">Số CCCD:</span>
                <p className="font-semibold">{user.cccd || 'Chưa có'}</p>
              </div>
              <div>
                <span className="text-gray-600">Số GPLX:</span>
                <p className="font-semibold">{user.gplx || 'Chưa có'}</p>
              </div>
            </div>
          </div>

          {/* Document Images */}
          <div>
            <h4 className="mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Hình ảnh giấy tờ
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* CCCD Front */}
              {user.cccdPath1 && (
                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">CCCD mặt trước</Label>
                  <div 
                    className="border-2 rounded-lg overflow-hidden aspect-[3/2] bg-gray-100 cursor-pointer hover:border-blue-500 transition-colors relative group"
                    onClick={() => handleImageClick(user.cccdPath1)}
                  >
                    <img
                      src={resolveAssetUrl(user.cccdPath1) || ''}
                      alt="CCCD mặt trước"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* CCCD Back */}
              {user.cccdPath2 && (
                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">CCCD mặt sau</Label>
                  <div 
                    className="border-2 rounded-lg overflow-hidden aspect-[3/2] bg-gray-100 cursor-pointer hover:border-blue-500 transition-colors relative group"
                    onClick={() => handleImageClick(user.cccdPath2)}
                  >
                    <img
                      src={resolveAssetUrl(user.cccdPath2) || ''}
                      alt="CCCD mặt sau"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* GPLX Front */}
              {user.gplxPath1 && (
                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">GPLX mặt trước</Label>
                  <div 
                    className="border-2 rounded-lg overflow-hidden aspect-[3/2] bg-gray-100 cursor-pointer hover:border-blue-500 transition-colors relative group"
                    onClick={() => handleImageClick(user.gplxPath1)}
                  >
                    <img
                      src={resolveAssetUrl(user.gplxPath1) || ''}
                      alt="GPLX mặt trước"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* GPLX Back */}
              {user.gplxPath2 && (
                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">GPLX mặt sau</Label>
                  <div 
                    className="border-2 rounded-lg overflow-hidden aspect-[3/2] bg-gray-100 cursor-pointer hover:border-blue-500 transition-colors relative group"
                    onClick={() => handleImageClick(user.gplxPath2)}
                  >
                    <img
                      src={resolveAssetUrl(user.gplxPath2) || ''}
                      alt="GPLX mặt sau"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Selfie */}
              {user.selfiePath && (
                <div className="col-span-2">
                  <Label className="text-xs text-gray-600 mb-2 block">Ảnh selfie cầm CCCD</Label>
                  <div 
                    className="border-2 rounded-lg overflow-hidden aspect-[3/2] bg-gray-100 max-w-md mx-auto cursor-pointer hover:border-blue-500 transition-colors relative group"
                    onClick={() => handleImageClick(user.selfiePath)}
                  >
                    <img
                      src={resolveAssetUrl(user.selfiePath) || ''}
                      alt="Selfie"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rejection Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Lý do từ chối (nếu có)</Label>
            <Textarea
              id="reason"
              placeholder="Nhập lý do từ chối xác minh..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleReject}
              disabled={isProcessing}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Từ chối
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Duyệt
            </Button>
          </div>
        </div>
      </DialogContent>
      </Dialog>

      {/* Image Preview Modal - OUTSIDE Dialog */}
      {imagePreview && (
        <div 
          className="fixed inset-0 bg-black z-[9999] flex items-center justify-center p-8"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999
          }}
          onClick={() => {
            console.log('Closing image preview');
            setImagePreview(null);
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setImagePreview(null);
              }}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors text-sm font-medium flex items-center gap-2 bg-white/20 px-6 py-3 rounded-lg backdrop-blur-sm z-10"
            >
              <XCircle className="w-5 h-5" />
              Đóng
            </button>
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
