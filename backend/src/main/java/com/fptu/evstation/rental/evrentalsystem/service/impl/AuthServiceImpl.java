package com.fptu.evstation.rental.evrentalsystem.service.impl;

import com.fptu.evstation.rental.evrentalsystem.dto.AuthResponse;
import com.fptu.evstation.rental.evrentalsystem.dto.LoginRequest;
import com.fptu.evstation.rental.evrentalsystem.entity.*;
import com.fptu.evstation.rental.evrentalsystem.repository.UserRepository;
import com.fptu.evstation.rental.evrentalsystem.service.AuthService;
import com.fptu.evstation.rental.evrentalsystem.service.TokenService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final TokenService tokenService;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getIdentifier())
                .or(() -> userRepository.findByPhone(req.getIdentifier()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

        if (!req.getPassword().equals(user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Mật khẩu không chính xác");
        }

        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa hoặc chưa được kích hoạt.");
        }

        AuthToken t = tokenService.createToken(user);
        return new AuthResponse(t.getToken(), t.getExpiresAt(), user.getFullName());
    }

    @Transactional
    public void logout(String token) {
        tokenService.deleteToken(token);
    }

    @Override
    public User validateTokenAndGetUser(String token) {
        return tokenService.validateTokenAndGetUser(token);
    }

    @Override
    public String getTokenFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Yêu cầu thiếu token xác thực");
        }
        return authHeader.substring(7);
    }

    @Override
    public AuthResponse loginWithGoogle(String idToken) {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, "Chức năng đang được phát triển");
    }
}