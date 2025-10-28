# Changelog - EV Rental Frontend

## [Production Ready v2] - 2025-01-20

### 🎨 UI/UX Improvements

#### ProfilePage - Verification Tab Redesign
- ✅ **2-column layout** theo đúng design specification
- ✅ **Cột trái**: Thông tin cá nhân + Form cập nhật
- ✅ **Cột phải**: Trạng thái xác thực + Form upload giấy tờ
- ✅ Thêm input cho **Số CCCD** và **Số GPLX**
- ✅ Hiển thị file name sau khi chọn (với dấu ✓)
- ✅ Upload button màu xanh: "Gửi yêu cầu xác thực"
- ✅ Validation đầy đủ: Bắt buộc nhập số + upload đủ 5 ảnh

## [Production Ready v1] - 2025-01-20

### ✨ Tính năng mới

#### 1. Forgot Password Flow
- Thêm màn hình `ForgotPasswordPage.tsx`
- 3 bước: Nhập email → Xác thực OTP → Đặt lại mật khẩu
- Tích hợp với backend endpoints:
  - `POST /auth/forgot-password`
  - `POST /auth/verify-otp`
  - `POST /auth/reset-password`

#### 2. Payment Flow
- Thêm màn hình `PaymentPage.tsx`
- Hỗ trợ 2 phương thức:
  - Quét mã QR (VietQR/Banking App)
  - Thanh toán tại quầy
- Hiển thị thông tin booking đầy đủ
- Tích hợp endpoint: `POST /bookings/{id}/pay-deposit`

#### 3. API Helper Functions
- Tạo file `/lib/api.ts` với:
  - `apiCall()` - Gọi API thông thường
  - `authenticatedApiCall()` - API với Bearer token
  - `uploadFiles()` - Upload file multipart
- Centralized API endpoint management
- Dễ dàng thay đổi base URL

#### 4. Constants Management
- Tạo file `/lib/constants.ts`
- Quản lý tất cả constants:
  - Rental rules (min hours, deposit rate, late fee)
  - File upload configs
  - Status enums
  - Date formats

### 🔧 Cải tiến

#### Tất cả trang đã được refactor:
- ✅ `LoginPage.tsx` - Sử dụng API helper, xóa demo account
- ✅ `RegisterPage.tsx` - Sử dụng API helper
- ✅ `HomePage.tsx` - Sử dụng API helper
- ✅ `VehicleListingPage.tsx` - Sử dụng API helper
- ✅ `VehicleDetailPage.tsx` - Sử dụng API helper, redirect to payment
- ✅ `ProfilePage.tsx` - Sử dụng API helper cho cả update và upload
- ✅ `BookingHistoryPage.tsx` - Đã có UI (chờ backend endpoint)

#### App.tsx Updates:
- Thêm routing cho `forgot-password` và `payment`
- Thêm `selectedBookingId` vào state
- Cải thiện navigation logic

### 🗑️ Xóa bỏ

- ❌ Demo account info từ LoginPage
- ❌ Google OAuth button (commented out, chờ config)
- ❌ Placeholder toast.info() calls
- ❌ Hardcoded API URLs

### 📝 Documentation

- Thêm `API_SETUP.md` - Hướng dẫn setup và config API
- Thêm `CHANGELOG.md` - Ghi chú thay đổi
- Comments trong code để hướng dẫn

### 🔄 Breaking Changes

**Không có** - Tất cả thay đổi backward compatible.

### ⚠️ Cần backend hỗ trợ

1. **Booking History Endpoint**
   ```
   GET /api/bookings/my-history
   Headers: Authorization: Bearer {token}
   Response: Array of Booking objects
   ```

2. **QR Code Generation**
   - Backend nên trả về QR code image (base64 hoặc URL)
   - Hiện tại frontend chỉ hiển thị placeholder icon

3. **Google OAuth (Optional)**
   - Cần config Google Client ID
   - Uncomment code trong LoginPage.tsx

### 📦 File Structure Changes

```
/lib/
  ├── api.ts          [NEW] - API helper functions
  └── constants.ts    [NEW] - App constants

/components/
  ├── ForgotPasswordPage.tsx  [NEW]
  ├── PaymentPage.tsx         [NEW]
  ├── LoginPage.tsx           [UPDATED]
  ├── RegisterPage.tsx        [UPDATED]
  ├── HomePage.tsx            [UPDATED]
  ├── VehicleListingPage.tsx  [UPDATED]
  ├── VehicleDetailPage.tsx   [UPDATED]
  ├── ProfilePage.tsx         [UPDATED]
  └── BookingHistoryPage.tsx  [UPDATED]

/App.tsx              [UPDATED]
/API_SETUP.md         [NEW]
/CHANGELOG.md         [NEW]
```

### 🚀 Cách sử dụng

1. **Thay đổi API URL:**
   ```typescript
   // /lib/api.ts
   export const API_BASE_URL = 'http://your-backend-url/api';
   ```

2. **Start development:**
   ```bash
   npm install
   npm run dev
   ```

3. **Build production:**
   ```bash
   npm run build
   ```

### ✅ Checklist trước khi deploy

- [ ] Đã test tất cả API endpoints
- [ ] Đã cấu hình CORS ở backend
- [ ] Đã thay đổi API_BASE_URL
- [ ] Đã test file upload (max 5MB)
- [ ] Đã test forgot password flow
- [ ] Đã test booking + payment flow
- [ ] Đã kiểm tra responsive trên mobile

### 🐛 Known Issues

1. **Booking History** - Cần backend implement endpoint
2. **QR Code** - Hiển thị placeholder, cần backend trả về real QR
3. **Google OAuth** - Cần config clientId

### 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra Console (F12 > Console)
2. Kiểm tra Network tab (F12 > Network)
3. Đọc `API_SETUP.md`
4. Kiểm tra backend logs

---

**Production Ready Status:** ✅ **READY**

Tất cả tính năng core đã hoàn thiện và sẵn sàng kết nối với backend.
