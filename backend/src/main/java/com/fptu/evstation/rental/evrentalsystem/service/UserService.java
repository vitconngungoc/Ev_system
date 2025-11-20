package com.fptu.evstation.rental.evrentalsystem.service;

import com.fptu.evstation.rental.evrentalsystem.dto.*;
import com.fptu.evstation.rental.evrentalsystem.entity.User;

import java.util.List;
import java.util.Map;

public interface UserService {
    User register(RegisterRequest req);
    User updateUserProfile(User user, UpdateProfileRequest req);
    String uploadVerificationDocuments(User user, UploadVerificationRequest req);
    Map<String, Object> getVerificationStatus(User user);
    List<User> getPendingVerifications();
    String processVerification(Long userId, VerifyRequest req);
    User saveUser(User user);
    List<UserResponse> getAllUsers();
    User getUserById(Long id);
    User updateUserRole(Long userId, Long newRoleId);
    User updateUserStation(Long userId, Long newStationId);
    User unlockUserAccount(Long userId);
}
