package com.fptu.evstation.rental.evrentalsystem.service.user;

import com.fptu.evstation.rental.evrentalsystem.dto.RegisterRequest;
import com.fptu.evstation.rental.evrentalsystem.entity.AccountStatus;
import com.fptu.evstation.rental.evrentalsystem.entity.Role;
import com.fptu.evstation.rental.evrentalsystem.entity.User;
import com.fptu.evstation.rental.evrentalsystem.repository.RoleRepository;
import com.fptu.evstation.rental.evrentalsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;


@Service
@RequiredArgsConstructor
public class UserService{
    private final UserRepository userRepo;
    private final RoleRepository roleRepo;

    public User register(RegisterRequest req) {
        if (req.getEmail() != null && userRepo.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email đã tồn tại");
        }
        if (userRepo.existsByPhone(req.getPhone())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại đã tồn tại");
        }
        if(!req.getPassword().equals(req.getConfirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password và Confirm Password không khớp");
        }
        if (!req.isAgreedToTerms()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn phải đồng ý với Điều khoản dịch vụ và Chính sách bảo mật");
        }

        Role role = roleRepo.findByRoleName("EV_RENTER")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể phân role cho user"));

        User u = User.builder()
                .password(req.getPassword())
                .email(req.getEmail())
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .verified(false)
                .status(AccountStatus.ACTIVE)
                .role(role)
                .build();
        return userRepo.save(u);
    }

    public User findByEmail(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));
    }

    public User findByIdentifier(String identifier) {
        if (identifier.contains("@")) {
            return userRepo.findByEmail(identifier)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        } else {
            return userRepo.findByPhone(identifier)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        }
    }
}
