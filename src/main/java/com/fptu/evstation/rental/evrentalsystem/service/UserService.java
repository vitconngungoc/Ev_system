package com.fptu.evstation.rental.evrentalsystem.service;

import com.fptu.evstation.rental.evrentalsystem.dto.*;
import com.fptu.evstation.rental.evrentalsystem.entity.User;

import java.util.List;
import java.util.Map;

public interface UserService {
    User register(RegisterRequest req);
    User updateUserRole(Long userId, Long newRoleId);
    User unlockUserAccount(Long userId);
    User updateUserStation(Long userId, Long newStationId);
    User updateUserProfile(User user, UpdateProfileRequest req);
    String uploadVerificationDocuments(User user, UploadVerificationRequest req);
    List<User> getPendingVerifications();
    String processVerification(Long userId, VerifyRequest req);
    Map<String, Object> getVerificationStatus(User user);
    List<UserResponse> getAllUsers();
    User getUserById(Long id);
    User saveUser(User user);
}