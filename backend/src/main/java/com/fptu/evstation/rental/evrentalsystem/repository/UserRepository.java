package com.fptu.evstation.rental.evrentalsystem.repository;

import com.fptu.evstation.rental.evrentalsystem.entity.User;
import com.fptu.evstation.rental.evrentalsystem.entity.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByCccd(String cccd);
    boolean existsByGplx(String gplx);
    List<User> findByVerificationStatus(VerificationStatus status);
    List<User> findByStation_StationId(Long stationId);
}
