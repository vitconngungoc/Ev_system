package com.fptu.evstation.rental.evrentalsystem.repository;


import com.fptu.evstation.rental.evrentalsystem.entity.PasswordReset;
import com.fptu.evstation.rental.evrentalsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetRepository extends JpaRepository<PasswordReset, Long> {
    Optional<PasswordReset> findByUser(User user);

    Optional<PasswordReset> findByOtpCode(String otpCode);

    void deleteByUser(User user);
}
