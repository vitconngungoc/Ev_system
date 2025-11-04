package com.fptu.evstation.rental.evrentalsystem.service;

import com.fptu.evstation.rental.evrentalsystem.dto.RegisterRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.UpdateProfileRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.UploadVerificationRequest;
import com.fptu.evstation.rental.evrentalsystem.entity.User;

import java.util.Map;

public interface UserService {
    User register(RegisterRequest req);
    User updateUserProfile(User user, UpdateProfileRequest req);
    String uploadVerificationDocuments(User user, UploadVerificationRequest req);
    Map<String, Object> getVerificationStatus(User user);
    User saveUser(User user);
}
