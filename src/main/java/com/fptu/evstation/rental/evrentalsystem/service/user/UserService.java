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
        if (userRepo.existsByUsername(req.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already exists");
        }
        if (req.getEmail() != null && userRepo.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already exists");
        }
        if (userRepo.existsByPhone(req.getPhone())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone already exists");
        }
        if (req.getCccd() != null && userRepo.existsByCccd(req.getCccd())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CCCD already exists");
        }

        String roleName = (req.getRole() == null || req.getRole().isBlank()) ? "EV_RENTER" : req.getRole();
        Role role = roleRepo.findByRoleName(roleName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role"));

        User u = User.builder()
                .username(req.getUsername())
                .password(req.getPassword())
                .email(req.getEmail())
                .fullName(req.getFullname())
                .phone(req.getPhone())
                .cccd(req.getCccd())
                .gplx(req.getGplx())
                .verified(false)
                .status(AccountStatus.ACTIVE)
                .role(role)
                .build();

        return userRepo.save(u);
    }

    public User findByUsername(String username) {
        return userRepo.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
