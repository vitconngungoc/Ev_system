package com.fptu.evstation.rental.evrentalsystem.service;

import com.fptu.evstation.rental.evrentalsystem.dto.CreateModelRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.ModelResponse;
import com.fptu.evstation.rental.evrentalsystem.dto.UpdateModelRequest;
import com.fptu.evstation.rental.evrentalsystem.entity.Model;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ModelService {
    Model createModel(CreateModelRequest requestList, List<MultipartFile> images);
    Model updateModel(Long id, UpdateModelRequest request, List<MultipartFile> images);
    void deleteModel(Long id);
    ModelResponse getModelDetailsById(Long id);
    Model getModelById(Long id);
    List<ModelResponse> getAllModels(String keyword);
}