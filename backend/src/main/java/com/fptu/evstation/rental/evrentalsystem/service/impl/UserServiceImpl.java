package com.fptu.evstation.rental.evrentalsystem.service.impl;

import com.fptu.evstation.rental.evrentalsystem.dto.RegisterRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.UpdateProfileRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.UploadVerificationRequest;
import com.fptu.evstation.rental.evrentalsystem.entity.*;
import com.fptu.evstation.rental.evrentalsystem.repository.RoleRepository;
import com.fptu.evstation.rental.evrentalsystem.repository.UserRepository;
import com.fptu.evstation.rental.evrentalsystem.service.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService{
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    private final Path uploadBaseDir = Paths.get(System.getProperty("user.dir"), "uploads", "verification");

    @Override
    @Transactional
    public User register(RegisterRequest req) {
        if (req.getEmail() != null && userRepository.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email đã tồn tại");
        }
        if (userRepository.existsByPhone(req.getPhone())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại đã tồn tại");
        }
        if (!req.getPassword().equals(req.getConfirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu và xác nhận mật khẩu không khớp");
        }
        if (!req.isAgreedToTerms()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn phải đồng ý với các điều khoản dịch vụ");
        }

        Role role = roleRepository.findByRoleName("EV_RENTER")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không tìm thấy vai trò mặc định cho người dùng"));

        User u = User.builder()
                .password(req.getPassword())
                .email(req.getEmail())
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .verificationStatus(VerificationStatus.PENDING)
                .status(AccountStatus.ACTIVE)
                .role(role)
                .build();
        return userRepository.save(u);
    }

    @Override
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User updateUserProfile(User user, UpdateProfileRequest req) {
        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản bị khóa không thể cập nhật thông tin.");
        }

        boolean isApproved = user.getVerificationStatus() == VerificationStatus.APPROVED;

        if (req.getFullName() != null && !req.getFullName().isBlank()) {
            user.setFullName(req.getFullName());
        }
        if (req.getEmail() != null && !req.getEmail().isBlank() && !req.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(req.getEmail())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email mới đã tồn tại");
            }
            user.setEmail(req.getEmail());
        }
        if (req.getPhone() != null && !req.getPhone().isBlank() && !req.getPhone().equals(user.getPhone())) {
            if (userRepository.existsByPhone(req.getPhone())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại mới đã tồn tại");
            }
            user.setPhone(req.getPhone());
        }

        if (!isApproved) {
            if (req.getCccd() != null && !req.getCccd().isBlank() && !req.getCccd().equals(user.getCccd())) {
                if (userRepository.existsByCccd(req.getCccd())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số CCCD này đã được sử dụng");
                }
                user.setCccd(req.getCccd());
            }
            if (req.getGplx() != null && !req.getGplx().isBlank() && !req.getGplx().equals(user.getGplx())) {
                if (userRepository.existsByGplx(req.getGplx())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số GPLX này đã được sử dụng");
                }
                user.setGplx(req.getGplx());
            }
        } else if ((req.getCccd() != null && !req.getCccd().isBlank()) || (req.getGplx() != null && !req.getGplx().isBlank())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Thông tin CCCD/GPLX đã được xác thực và không thể tự chỉnh sửa.");
        }

        return userRepository.save(user);
    }

    @Override
    @Transactional
    public String uploadVerificationDocuments(User user, UploadVerificationRequest req) {
        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản bị khóa không thể tải lên giấy tờ.");
        }

        if (user.getVerificationStatus() == VerificationStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tài khoản đã được xác thực, không cần tải lên lại");
        }

        if (!req.getCccd().equals(user.getCccd()) && userRepository.existsByCccd(req.getCccd())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số CCCD này đã được sử dụng");
        }
        if (!req.getGplx().equals(user.getGplx()) && userRepository.existsByGplx(req.getGplx())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số GPLX này đã được sử dụng");
        }

        user.setCccd(req.getCccd());
        user.setGplx(req.getGplx());

        Path userDir = uploadBaseDir.resolve("user_" + user.getUserId());


        if (user.getVerificationStatus() == VerificationStatus.REJECTED) {
            user.setRejectionReason(null);
        }
        user.setVerificationStatus(VerificationStatus.PENDING);

        if (req.getCccdFile1() == null || req.getCccdFile2() == null ||
                req.getGplxFile1() == null || req.getGplxFile2() == null ||
                req.getSelfieFile() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng tải lên đầy đủ 5 ảnh: 2 mặt CCCD, 2 mặt GPLX và ảnh selfie");
        }

        validateFile(req.getCccdFile1(), "CCCD mặt trước");
        validateFile(req.getCccdFile2(), "CCCD mặt sau");
        validateFile(req.getGplxFile1(), "GPLX mặt trước");
        validateFile(req.getGplxFile2(), "GPLX mặt sau");
        validateFile(req.getSelfieFile(), "Selfie");

        user.setCccdPath1(saveFile(req.getCccdFile1(), user.getUserId(), "cccd_1"));
        user.setCccdPath2(saveFile(req.getCccdFile2(), user.getUserId(), "cccd_2"));
        user.setGplxPath1(saveFile(req.getGplxFile1(), user.getUserId(), "gplx_1"));
        user.setGplxPath2(saveFile(req.getGplxFile2(), user.getUserId(), "gplx_2"));
        user.setSelfiePath(saveFile(req.getSelfieFile(), user.getUserId(), "selfie"));

        userRepository.save(user);
        return "Yêu cầu đã gửi. Vui lòng chờ nhân viên xác nhận trong vòng 24 giờ.";
    }

    @Override
    public Map<String, Object> getVerificationStatus(User user) {
        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị khóa.");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("status", user.getVerificationStatus().name());
        if (user.getVerificationStatus() == VerificationStatus.REJECTED && user.getRejectionReason() != null) {
            response.put("reason", user.getRejectionReason());
        }
        return response;
    }

    private void validateFile(MultipartFile file, String fileType) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fileType + " phải là một file ảnh (jpg, png, etc.)");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kích thước file " + fileType + " không được vượt quá 5MB");
        }
    }

    private String saveFile(MultipartFile file, Long userId, String baseFileName) {
        try {
            Path userDir = uploadBaseDir.resolve("user_" + userId);
            try {
                Files.createDirectories(userDir);
            } catch (IOException e) {
                log.error("Không thể tạo thư mục cho người dùng: " + userDir, e);
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống khi xử lý thư mục");
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
            }

            String finalFileName = baseFileName + extension;
            Path filePath = userDir.resolve(finalFileName);
            file.transferTo(filePath);

            return "/uploads/verification/user_" + userId + "/" + finalFileName;
        } catch (IOException e) {
            log.error("Lỗi khi lưu file: " + baseFileName, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống khi lưu file");
        }
    }
}
