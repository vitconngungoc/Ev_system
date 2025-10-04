package com.fptu.evstation.rental.evrentalsystem.service.email;


import com.fptu.evstation.rental.evrentalsystem.entity.PasswordReset;
import com.fptu.evstation.rental.evrentalsystem.entity.User;
import com.fptu.evstation.rental.evrentalsystem.repository.PasswordResetRepository;
import com.fptu.evstation.rental.evrentalsystem.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor  // Thay @Autowired bằng này để consistent với các service khác
public class EmailService {
    private final JavaMailSender mailSender;
    private final PasswordResetRepository tokenRepo;
    private final UserRepository userRepo;

    // Tạo OTP dạng số 6 chữ số
    private String generateOtp() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }

    // Tạo OTP và gửi email
    @Transactional
    public String createPasswordResetToken(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));  // Sửa: Ném ResponseStatusException(404)

        String otp = generateOtp();

        PasswordReset resetToken = new PasswordReset();
        resetToken.setUser(user);
        resetToken.setOtpCode(otp);
        resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(5));

        tokenRepo.save(resetToken);

        // Gửi email
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Password Reset Request");
        message.setText("Your OTP code is: " + otp + "\nValid for 5 minutes.");
        mailSender.send(message);

        return otp;
    }

    // Xác thực OTP – Giữ nguyên return boolean, nhưng controller nên dùng để ném exception nếu invalid
    public boolean validateToken(String otpCode) {
        return tokenRepo.findByOtpCode(otpCode)
                .filter(t -> t.getExpiryDate().isAfter(LocalDateTime.now()))
                .isPresent();
    }

    @Transactional
    public boolean resetPassword(String otpCode, String newPassword) {
        PasswordReset resetToken = tokenRepo.findByOtpCode(otpCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP không hợp lệ"));  // Sửa: Ném ResponseStatusException(400)

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP đã hết hạn");  // Sửa: Ném ResponseStatusException(400)
        }

        User user = resetToken.getUser();
        user.setPassword(newPassword);
        userRepo.save(user);

        // Xoá token sau khi reset thành công để tránh dùng lại
        tokenRepo.deleteByUser(user);
        return true;
    }
}
