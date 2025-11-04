package com.fptu.evstation.rental.evrentalsystem.service.impl;

import com.fptu.evstation.rental.evrentalsystem.entity.AuthToken;
import com.fptu.evstation.rental.evrentalsystem.entity.User;
import com.fptu.evstation.rental.evrentalsystem.repository.AuthTokenRepository;
import com.fptu.evstation.rental.evrentalsystem.service.TokenService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements TokenService {

    private final AuthTokenRepository authTokenRepository;

    @Override
    @Transactional
    public AuthToken createToken(User user) {
        authTokenRepository.findByUser(user).ifPresent(existingToken -> {
            if (existingToken.getExpiresAt() != null && existingToken.getExpiresAt().isAfter(Instant.now())) {
                authTokenRepository.delete(existingToken);
            }
        });
        AuthToken t = AuthToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(2, ChronoUnit.HOURS))
                .build();
        return authTokenRepository.save(t);
    }

    @Override
    @Transactional
    public void deleteToken(String token) {
        AuthToken existingToken = authTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token không tồn tại hoặc đã hết hạn"));
        authTokenRepository.delete(existingToken);
    }

    @Override
    @Transactional
    public User validateTokenAndGetUser(String token) {
        var tokenOpt = authTokenRepository.findByToken(token);
        if (tokenOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tài khoản của bạn đã đăng nhập ở nơi khác");
        }
        var t = tokenOpt.get();
        if (t.getExpiresAt() == null || t.getExpiresAt().isBefore(Instant.now())) {
            authTokenRepository.delete(t);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập đã hết hạn");
        }

        return t.getUser();
    }
}
