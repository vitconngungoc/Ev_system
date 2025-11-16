import { Page } from '../App';
import { Button } from './ui/button';
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, FileText, Globe, AlertTriangle } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onNavigate: (page: Page) => void;
  previousPage?: Page;
}

export function PrivacyPolicyPage({ onNavigate, previousPage }: PrivacyPolicyPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chính sách bảo mật</h1>
                <p className="text-sm text-gray-600">EV Rental System - EVolve</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate(previousPage || 'home')}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full border-2 border-gray-200 group-hover:border-blue-500 flex items-center justify-center transition-all">
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
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Lock className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Cam kết bảo mật thông tin của bạn</h2>
              <p className="text-gray-600 leading-relaxed">
                Tại EVolve, chúng tôi cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn. 
                Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng, và bảo vệ thông tin của bạn 
                khi sử dụng dịch vụ cho thuê xe điện.
              </p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-900">
              <strong>Cập nhật lần cuối:</strong> 14/11/2025
            </p>
          </div>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">1. Thông tin chúng tôi thu thập</h3>
              </div>
            </div>
            <div className="ml-13 space-y-3 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">1.1. Thông tin cá nhân cơ bản:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Họ và tên đầy đủ</li>
                <li>Số điện thoại</li>
                <li>Địa chỉ email</li>
                <li>Mật khẩu (được mã hóa)</li>
              </ul>
              <p>
                <strong className="text-gray-900">1.2. Thông tin xác thực danh tính:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Số Căn cước công dân (CCCD)</li>
                <li>Ảnh CCCD mặt trước và mặt sau</li>
                <li>Số Giấy phép lái xe (GPLX)</li>
                <li>Ảnh GPLX mặt trước và mặt sau</li>
                <li>Ảnh selfie để xác thực danh tính</li>
              </ul>
              <p>
                <strong className="text-gray-900">1.3. Thông tin đặt xe và giao dịch:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Lịch sử đặt xe</li>
                <li>Thời gian thuê và trả xe</li>
                <li>Địa điểm nhận/trả xe</li>
                <li>Thông tin thanh toán</li>
                <li>Hóa đơn và biên lai</li>
              </ul>
              <p>
                <strong className="text-gray-900">1.4. Thông tin kỹ thuật:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Địa chỉ IP</li>
                <li>Loại trình duyệt và thiết bị</li>
                <li>Cookie và dữ liệu truy cập</li>
                <li>Nhật ký hoạt động trên hệ thống</li>
              </ul>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">2. Mục đích sử dụng thông tin</h3>
              </div>
            </div>
            <div className="ml-13 space-y-3 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">2.1. Cung cấp dịch vụ:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Xác thực danh tính người thuê xe</li>
                <li>Xử lý đơn đặt xe và thanh toán</li>
                <li>Quản lý hợp đồng thuê xe</li>
                <li>Liên hệ về tình trạng đơn hàng</li>
              </ul>
              <p>
                <strong className="text-gray-900">2.2. Cải thiện dịch vụ:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Phân tích hành vi sử dụng</li>
                <li>Cải thiện trải nghiệm người dùng</li>
                <li>Phát triển tính năng mới</li>
                <li>Tối ưu hóa hiệu suất hệ thống</li>
              </ul>
              <p>
                <strong className="text-gray-900">2.3. An ninh và tuân thủ:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Phát hiện và ngăn chặn gian lận</li>
                <li>Bảo vệ quyền lợi của khách hàng</li>
                <li>Tuân thủ các quy định pháp luật</li>
                <li>Giải quyết tranh chấp</li>
              </ul>
              <p>
                <strong className="text-gray-900">2.4. Truyền thông:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Gửi thông báo về đơn hàng</li>
                <li>Thông tin khuyến mãi (nếu đồng ý)</li>
                <li>Cập nhật chính sách và dịch vụ</li>
                <li>Hỗ trợ khách hàng</li>
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">3. Bảo vệ thông tin cá nhân</h3>
              </div>
            </div>
            <div className="ml-13 space-y-3 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">3.1. Biện pháp kỹ thuật:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Mã hóa SSL/TLS cho tất cả kết nối</li>
                <li>Mã hóa dữ liệu nhạy cảm trong cơ sở dữ liệu</li>
                <li>Tường lửa và hệ thống phát hiện xâm nhập</li>
                <li>Sao lưu dữ liệu định kỳ</li>
                <li>Cập nhật bảo mật thường xuyên</li>
              </ul>
              <p>
                <strong className="text-gray-900">3.2. Biện pháp quản lý:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Kiểm soát quyền truy cập nghiêm ngặt</li>
                <li>Đào tạo nhân viên về bảo mật</li>
                <li>Giám sát và kiểm tra định kỳ</li>
                <li>Quy trình xử lý sự cố bảo mật</li>
              </ul>
              <p>
                <strong className="text-gray-900">3.3. Lưu trữ dữ liệu:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Dữ liệu được lưu trữ trên máy chủ an toàn tại Việt Nam</li>
                <li>Tuân thủ tiêu chuẩn bảo mật quốc tế</li>
                <li>Phân quyền truy cập theo vai trò</li>
                <li>Nhật ký truy cập được ghi lại đầy đủ</li>
              </ul>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">4. Chia sẻ thông tin</h3>
              </div>
            </div>
            <div className="ml-13 space-y-3 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">4.1. Chúng tôi KHÔNG bán hoặc cho thuê thông tin cá nhân của bạn.</strong>
              </p>
              <p>
                <strong className="text-gray-900">4.2. Chúng tôi chỉ chia sẻ thông tin trong các trường hợp sau:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>
                  <strong>Nhà cung cấp dịch vụ:</strong> Các đối tác xử lý thanh toán (PayOS), dịch vụ email, 
                  lưu trữ dữ liệu với thỏa thuận bảo mật nghiêm ngặt
                </li>
                <li>
                  <strong>Yêu cầu pháp lý:</strong> Khi có yêu cầu từ cơ quan nhà nước có thẩm quyền
                </li>
                <li>
                  <strong>Bảo vệ quyền lợi:</strong> Để bảo vệ quyền lợi hợp pháp của công ty và khách hàng
                </li>
                <li>
                  <strong>Với sự đồng ý:</strong> Khi bạn cho phép chia sẻ thông tin
                </li>
              </ul>
              <p>
                <strong className="text-gray-900">4.3. Tất cả đối tác được yêu cầu:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Tuân thủ chính sách bảo mật tương tự</li>
                <li>Chỉ sử dụng thông tin cho mục đích đã thỏa thuận</li>
                <li>Không tiết lộ cho bên thứ ba</li>
              </ul>
            </div>
          </div>

          {/* Section 5 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">5. Quyền của người dùng</h3>
              </div>
            </div>
            <div className="ml-13 space-y-3 text-gray-700 leading-relaxed">
              <p>Bạn có các quyền sau đối với thông tin cá nhân của mình:</p>
              <p>
                <strong className="text-gray-900">5.1. Quyền truy cập:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Xem thông tin cá nhân mà chúng tôi lưu trữ</li>
                <li>Yêu cầu bản sao thông tin của bạn</li>
              </ul>
              <p>
                <strong className="text-gray-900">5.2. Quyền chỉnh sửa:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Cập nhật thông tin cá nhân không chính xác</li>
                <li>Bổ sung thông tin thiếu sót</li>
              </ul>
              <p>
                <strong className="text-gray-900">5.3. Quyền xóa:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Yêu cầu xóa tài khoản và dữ liệu cá nhân</li>
                <li>Lưu ý: Một số thông tin có thể được giữ lại theo quy định pháp luật</li>
              </ul>
              <p>
                <strong className="text-gray-900">5.4. Quyền từ chối:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Từ chối nhận email marketing</li>
                <li>Rút lại sự đồng ý chia sẻ thông tin</li>
              </ul>
              <p>
                <strong className="text-gray-900">5.5. Cách thực hiện quyền:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Liên hệ qua email: evsystemstation@gmail.com</li>
                <li>Gọi hotline: 1900-xxxx</li>
                <li>Chúng tôi sẽ phản hồi trong vòng 7 ngày làm việc</li>
              </ul>
            </div>
          </div>

          {/* Section 6 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">6. Cookie và công nghệ theo dõi</h3>
              </div>
            </div>
            <div className="ml-13 space-y-3 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">6.1. Chúng tôi sử dụng Cookie để:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Ghi nhớ thông tin đăng nhập</li>
                <li>Cá nhân hóa trải nghiệm</li>
                <li>Phân tích lưu lượng truy cập</li>
                <li>Cải thiện bảo mật</li>
              </ul>
              <p>
                <strong className="text-gray-900">6.2. Loại Cookie sử dụng:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li><strong>Cookie cần thiết:</strong> Để hệ thống hoạt động bình thường</li>
                <li><strong>Cookie phân tích:</strong> Để hiểu cách bạn sử dụng dịch vụ</li>
                <li><strong>Cookie chức năng:</strong> Để ghi nhớ tùy chọn của bạn</li>
              </ul>
              <p>
                <strong className="text-gray-900">6.3. Quản lý Cookie:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Bạn có thể tắt Cookie trong cài đặt trình duyệt</li>
                <li>Lưu ý: Tắt Cookie có thể ảnh hưởng đến trải nghiệm sử dụng</li>
              </ul>
            </div>
          </div>

          {/* Section 7 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">7. Lưu trữ và xóa dữ liệu</h3>
              </div>
            </div>
            <div className="ml-13 space-y-3 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">7.1. Thời gian lưu trữ:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Thông tin tài khoản: Cho đến khi bạn yêu cầu xóa</li>
                <li>Lịch sử giao dịch: 5 năm (theo quy định kế toán)</li>
                <li>Nhật ký hệ thống: 12 tháng</li>
                <li>Dữ liệu marketing: Cho đến khi bạn từ chối</li>
              </ul>
              <p>
                <strong className="text-gray-900">7.2. Xóa dữ liệu:</strong>
              </p>
              <ul className="list-disc ml-8 space-y-2">
                <li>Dữ liệu sẽ được xóa an toàn và không thể khôi phục</li>
                <li>Một số dữ liệu có thể được lưu giữ theo quy định pháp luật</li>
                <li>Bạn sẽ nhận được xác nhận khi quá trình hoàn tất</li>
              </ul>
            </div>
          </div>

          {/* Section 8 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">8. Bảo vệ trẻ em</h3>
              </div>
            </div>
            <div className="ml-13 space-y-3 text-gray-700 leading-relaxed">
              <p>
                Dịch vụ của chúng tôi không dành cho người dưới 18 tuổi. Chúng tôi không cố ý thu thập 
                thông tin cá nhân của trẻ em. Nếu bạn phát hiện chúng tôi đã thu thập thông tin từ trẻ em, 
                vui lòng liên hệ ngay để chúng tôi xóa thông tin đó.
              </p>
            </div>
          </div>

          {/* Section 9 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">9. Thay đổi chính sách</h3>
              </div>
            </div>
            <div className="ml-13 space-y-3 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">9.1.</strong> Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian.
              </p>
              <p>
                <strong className="text-gray-900">9.2.</strong> Thay đổi quan trọng sẽ được thông báo qua email hoặc thông báo trên hệ thống.
              </p>
              <p>
                <strong className="text-gray-900">9.3.</strong> Ngày cập nhật mới nhất sẽ được ghi rõ ở đầu chính sách.
              </p>
              <p>
                <strong className="text-gray-900">9.4.</strong> Việc tiếp tục sử dụng dịch vụ sau khi thay đổi có nghĩa là bạn chấp nhận chính sách mới.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl shadow-lg p-8 mt-8 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-3">Liên hệ về bảo mật</h3>
            <p className="text-white/90 mb-6">
              Nếu bạn có câu hỏi hoặc lo ngại về quyền riêng tư và bảo mật thông tin, 
              vui lòng liên hệ với chúng tôi
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                <p className="text-sm text-white/80">Email Bảo mật</p>
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
            © 2025 EV Rental System - EVolve. Tất cả thông tin được bảo mật.
          </p>
        </div>
      </div>
    </div>
  );
}
