package com.fptu.evstation.rental.evrentalsystem.service.auth;

import com.fptu.evstation.rental.evrentalsystem.entity.AuthToken;
import com.fptu.evstation.rental.evrentalsystem.entity.User;
import com.fptu.evstation.rental.evrentalsystem.repository.AuthTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TokenService {
    private final AuthTokenRepository tokenRepo;

    public AuthToken createToken(User user) {
        AuthToken t = AuthToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .build();
        return tokenRepo.save(t);
    }

    public void deleteToken(String token) {
        tokenRepo.deleteByToken(token);
    }

    public User validateAndGetUser(String token) {
        return tokenRepo.findByToken(token)
                .filter(t -> t.getExpiresAt() == null || t.getExpiresAt().isAfter(Instant.now()))
                .map(AuthToken::getUser)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token"));
    }
}
