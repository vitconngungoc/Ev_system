# EV Rental System - Frontend Setup Guide

## Cấu hình API Backend

### 1. Thay đổi URL Backend

Mở file `/lib/api.ts` và thay đổi `API_BASE_URL`:

```typescript
// Development (Local)
export const API_BASE_URL = 'http://localhost:8080/api';

// Production
export const API_BASE_URL = 'https://your-domain.com/api';
```

### 2. Các API Endpoint đã tích hợp

#### Authentication
- `POST /auth/login` - Đăng nhập
- `POST /auth/register` - Đăng ký
- `POST /auth/logout` - Đăng xuất
- `POST /auth/forgot-password` - Gửi OTP qua email
- `POST /auth/verify-otp` - Xác thực OTP
- `POST /auth/reset-password` - Đặt lại mật khẩu

#### Profile
- `GET /profile/me` - Lấy thông tin user hiện tại
- `PUT /profile/update` - Cập nhật thông tin cá nhân
- `POST /profile/verification/upload` - Upload giấy tờ xác minh (multipart/form-data)

#### Stations
- `GET /stations` - Lấy danh sách trạm
- `GET /stations/{id}` - Chi tiết trạm

#### Vehicles
- `GET /vehicles/{id}` - Chi tiết xe
- `GET /vehicles/stations/{stationId}/available` - Xe khả dụng tại trạm

#### Bookings
- `POST /bookings` - Tạo booking mới
- `GET /bookings/{id}` - Chi tiết booking
- `POST /bookings/{id}/pay-deposit` - Thanh toán đặt cọc

### 3. Cấu trúc Response

Tất cả API phải trả về JSON với format:

**Success:**
```json
{
  "data": { ... },
  "message": "Success message"
}
```

**Error:**
```json
{
  "message": "Error message",
  "error": "Error details"
}
```

### 4. Authentication

Frontend sử dụng Bearer Token:

```
Authorization: Bearer {token}
```

Token được lưu trong state và truyền vào mọi authenticated API calls.

### 5. File Upload

Upload sử dụng `multipart/form-data` với các field names:

**Files:**
- `cccdFile1` - CCCD mặt trước
- `cccdFile2` - CCCD mặt sau
- `gplxFile1` - GPLX mặt trước
- `gplxFile2` - GPLX mặt sau
- `selfieFile` - Ảnh selfie

**Additional Data (as form fields):**
- `cccd` - Số CCCD (string)
- `gplx` - Số GPLX (string)

### 6. Testing

Trước khi deploy, hãy test các endpoints:

1. Start backend server
2. Update `API_BASE_URL` trong `/lib/api.ts`
3. Test từng tính năng:
   - Đăng ký user mới
   - Đăng nhập
   - Upload verification
   - Search stations
   - Book vehicle
   - Payment flow

### 7. CORS Configuration

Backend phải enable CORS cho frontend domain:

```java
@Configuration
public class WebConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:3000", "https://your-domain.com")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
```

### 8. Environment Variables (Optional)

Để dễ quản lý, bạn có thể tạo file `.env`:

```
VITE_API_BASE_URL=http://localhost:8080/api
```

Sau đó update `/lib/api.ts`:

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
```

## Các tính năng đã implement

### ✅ Hoàn chỉnh
- [x] Login/Register/Logout
- [x] Forgot Password Flow (OTP)
- [x] Profile Management
- [x] Verification Upload
- [x] Station Listing & Search
- [x] Vehicle Listing & Filtering
- [x] Vehicle Detail & Booking
- [x] Payment Page
- [x] Booking History UI

### ⚠️ Cần backend hỗ trợ thêm
- [ ] Google OAuth (có code, cần config clientId)
- [ ] Booking History endpoint (`GET /api/bookings/my-history`)
- [ ] QR Code generation cho payment

## Deployment

### Build for production:
```bash
npm run build
```

### Preview production build:
```bash
npm run preview
```

Frontend sẽ được build vào thư mục `dist/`.

## Troubleshooting

### CORS Error
- Kiểm tra CORS config ở backend
- Đảm bảo frontend URL được allow

### 401 Unauthorized
- Kiểm tra token có hợp lệ
- Kiểm tra token expiration

### 404 Not Found
- Kiểm tra API endpoint có đúng
- Kiểm tra backend server đang chạy

### File Upload Error
- Kiểm tra file size limit (max 5MB)
- Kiểm tra file format (JPG, PNG)
- Kiểm tra multipart config ở backend

## Contact

Nếu có vấn đề, vui lòng kiểm tra:
1. Console log (F12 > Console)
2. Network tab (F12 > Network)
3. Backend logs
