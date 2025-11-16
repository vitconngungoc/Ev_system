import { Page } from '../App';
import { Button } from './ui/button';
import { ArrowLeft, FileText, Shield, AlertCircle, Clock, DollarSign, Car, Users } from 'lucide-react';

interface TermsOfServicePageProps {
  onNavigate: (page: Page) => void;
  previousPage?: Page;
}

export function TermsOfServicePage({ onNavigate, previousPage }: TermsOfServicePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF8534] flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Điều khoản dịch vụ</h1>
                <p className="text-sm text-gray-600">EV Rental System</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate(previousPage || 'home')}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full border-2 border-gray-200 group-hover:border-[#FF6B00] flex items-center justify-center transition-all">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Quay lại</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Introduction */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-7 h-7 text-[#FF6B00]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Chào mừng đến với EV Rental</h2>
              <p className="text-gray-600 leading-relaxed">
                Vui lòng đọc kỹ các điều khoản dịch vụ dưới đây trước khi sử dụng dịch vụ thuê xe điện của chúng tôi. 
                Bằng việc sử dụng dịch vụ, bạn đồng ý tuân thủ tất cả các điều khoản và điều kiện được nêu ra.
              </p>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-sm text-orange-900">
              <strong>Cập nhật lần cuối:</strong> 14/11/2025
            </p>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">1. Điều kiện sử dụng dịch vụ</h3>
              </div>
            </div>
            <div className="ml-13 space-y-3 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">1.1.</strong> Người thuê xe phải từ đủ 18 tuổi trở lên và có đầy đủ năng lực hành vi dân sự.
              </p>
              <p>
                <strong className="text-gray-900">1.2.</strong> Người thuê xe phải có Giấy phép lái xe (GPLX) hợp lệ phù hợp với loại xe thuê.
              </p>
              <p>
                <strong className="text-gray-900">1.3.</strong> Người thuê xe phải cung cấp đầy đủ thông tin cá nhân chính xác bao gồm:
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Họ và tên đầy đủ</li>
                <li>Số điện thoại liên lạc</li>
                <li>Căn cước công dân (CCCD) còn hiệu lực</li>
                <li>Giấy phép lái xe (GPLX) còn hiệu lực</li>
                <li>Ảnh selfie để xác thực danh tính</li>
              </ul>
              <p>
                <strong className="text-gray-900">1.4.</strong> Hồ sơ của người thuê xe sẽ được xác minh bởi nhân viên trước khi có thể thực hiện đặt xe.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Car className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">2. Quy định về thuê xe</h3>
              </div>
            </div>
            <div className="ml-13 space-y-3 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">2.1.</strong> Thời gian thuê tối thiểu là <strong className="text-[#FF6B00]">1 giờ</strong>.
              </p>
              <p>
                <strong className="text-gray-900">2.2.</strong> Người thuê phải nhận và trả xe đúng thời gian đã đặt. Nếu trễ hạn trả xe, sẽ áp dụng phụ phí theo giá thuê theo giờ.
              </p>
              <p>
                <strong className="text-gray-900">2.3.</strong> Xe chỉ được sử dụng trong phạm vi lãnh thổ Việt Nam và tuân thủ luật giao thông.
              </p>
              <p>
                <strong className="text-gray-900">2.4.</strong> Người thuê có trách nhiệm kiểm tra tình trạng xe trước khi nhận:
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Tình trạng ngoại thất (trầy xước, móp méo)</li>
                <li>Mức pin còn lại</li>
                <li>Các thiết bị an toàn (đèn, còi, phanh)</li>
                <li>Nội thất xe</li>
              </ul>
              <p>
                <strong className="text-gray-900">2.5.</strong> Nghiêm cấm các hành vi sau khi thuê xe:
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Sử dụng xe vào mục đích phi pháp</li>
                <li>Cho thuê lại xe cho bên thứ 3</li>
                <li>Tự ý sửa chữa, cải tạo xe</li>
                <li>Sử dụng xe khi có sử dụng chất kích thích (rượu, bia, ma túy)</li>
                <li>Chở quá số người hoặc trọng tải qui định</li>
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">3. Chính sách thanh toán và đặt cọc</h3>
              </div>
            </div>
            <div className="ml-13 space-y-3 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">3.1.</strong> Người thuê xe phải đặt cọc trước <strong className="text-[#FF6B00]">500,000 VNĐ</strong> khi nhận xe.
              </p>
              <p>
                <strong className="text-gray-900">3.2.</strong> Tiền cọc sẽ được hoàn trả đầy đủ sau khi trả xe nếu xe không có hư hỏng.
              </p>
              <p>
                <strong className="text-gray-900">3.3.</strong> Chi phí thuê xe được tính theo giá niêm yết và thanh toán khi trả xe.
              </p>
              <p>
                <strong className="text-gray-900">3.4.</strong> Các khoản phí phát sinh (phí trễ hạn, phí sửa chữa) sẽ được khấu trừ từ tiền cọc.
              </p>
              <p>
                <strong className="text-gray-900">3.5.</strong> Phương thức thanh toán được chấp nhận:
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Chuyển khoản ngân hàng</li>
                <li>Thanh toán qua PayOS</li>
                <li>Tiền mặt tại trạm</li>
              </ul>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">4. Trách nhiệm và bồi thường</h3>
              </div>
            </div>
            <div className="ml-13 space-y-3 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">4.1.</strong> Người thuê xe chịu toàn bộ trách nhiệm về xe trong thời gian thuê.
              </p>
              <p>
                <strong className="text-gray-900">4.2.</strong> Trong trường hợp xe bị hư hỏng, người thuê phải:
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Thông báo ngay cho nhân viên qua hotline</li>
                <li>Không tự ý sửa chữa</li>
                <li>Cung cấp ảnh chụp hiện trường và mô tả chi tiết</li>
                <li>Chịu chi phí sửa chữa nếu do lỗi người thuê</li>
              </ul>
              <p>
                <strong className="text-gray-900">4.3.</strong> Trong trường hợp tai nạn giao thông:
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Người thuê phải báo cho cơ quan chức năng (công an, bảo hiểm)</li>
                <li>Thông báo ngay cho công ty trong vòng 24 giờ</li>
                <li>Cung cấp đầy đủ biên bản, giấy tờ liên quan</li>
                <li>Chịu trách nhiệm bồi thường nếu do lỗi của người thuê</li>
              </ul>
              <p>
                <strong className="text-gray-900">4.4.</strong> Mức bồi thường sẽ căn cứ vào mức độ hư hỏng và giá trị sửa chữa thực tế.
              </p>
              <p>
                <strong className="text-gray-900">4.5.</strong> Trong trường hợp xe bị mất hoặc mất cắp, người thuê phải báo công an và bồi thường 100% giá trị xe.
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">5. Chính sách hủy và thay đổi đặt xe</h3>
              </div>
            </div>
            <div className="ml-13 space-y-3 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">5.1.</strong> Hủy đặt xe trước 24 giờ: Hoàn tiền cọc 100%
              </p>
              <p>
                <strong className="text-gray-900">5.2.</strong> Hủy đặt xe từ 12-24 giờ trước: Hoàn tiền cọc 50%
              </p>
              <p>
                <strong className="text-gray-900">5.3.</strong> Hủy đặt xe dưới 12 giờ trước: Không hoàn tiền cọc
              </p>
              <p>
                <strong className="text-gray-900">5.4.</strong> Thay đổi thời gian thuê: Phải thông báo trước ít nhất 6 giờ và tùy thuộc vào tình trạng xe.
              </p>
            </div>
          </div>

          {/* Section 6 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">6. Bảo mật thông tin</h3>
              </div>
            </div>
            <div className="ml-13 space-y-3 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">6.1.</strong> Chúng tôi cam kết bảo mật tuyệt đối thông tin cá nhân của khách hàng.
              </p>
              <p>
                <strong className="text-gray-900">6.2.</strong> Thông tin chỉ được sử dụng cho mục đích quản lý dịch vụ thuê xe.
              </p>
              <p>
                <strong className="text-gray-900">6.3.</strong> Không chia sẻ thông tin cho bên thứ 3 trừ khi có yêu cầu từ cơ quan pháp luật.
              </p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">7. Điều khoản chung</h3>
              </div>
            </div>
            <div className="ml-13 space-y-3 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">7.1.</strong> Công ty có quyền thay đổi điều khoản dịch vụ mà không cần báo trước.
              </p>
              <p>
                <strong className="text-gray-900">7.2.</strong> Mọi tranh chấp sẽ được giải quyết thông qua thương lượng hoặc tại tòa án có thẩm quyền.
              </p>
              <p>
                <strong className="text-gray-900">7.3.</strong> Điều khoản này có hiệu lực kể từ ngày khách hàng đồng ý sử dụng dịch vụ.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-[#FF6B00] to-[#FF8534] rounded-2xl shadow-lg p-8 mt-8 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-3">Cần hỗ trợ?</h3>
            <p className="text-white/90 mb-6">
              Nếu bạn có bất kỳ câu hỏi nào về điều khoản dịch vụ, vui lòng liên hệ với chúng tôi
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                <p className="text-sm text-white/80">Email</p>
                <p className="font-semibold">evsystemstation@gmail.com</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                <p className="text-sm text-white/80">Hotline</p>
                <p className="font-semibold">1900-xxxx</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pb-8">
          <p className="text-gray-500 text-sm">
            © 2025 EV Rental System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
