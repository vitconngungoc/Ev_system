package com.fptu.evstation.rental.evrentalsystem.service.auth;

import com.fptu.evstation.rental.evrentalsystem.dto.*;
import com.fptu.evstation.rental.evrentalsystem.entity.*;
import com.fptu.evstation.rental.evrentalsystem.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserService userService;
    private final TokenService tokenService;

    public AuthResponse login(LoginRequest req) {
        User user = userService.findByIdentifier(req.getIdentifier());

        if (!req.getPassword().equals(user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email/SĐT hoặc mật khẩu không đúng");
        }

        AuthToken t = tokenService.createToken(user);
        return new AuthResponse(t.getToken(), t.getExpiresAt(), user.getFullName());
    }

    public void logout(String token) {
        tokenService.deleteToken(token);
    }

    public User validateTokenAndGetUser(String token) {
        return tokenService.validateAndGetUser(token);
    }
}
