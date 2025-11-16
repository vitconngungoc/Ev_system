package com.fptu.evstation.rental.evrentalsystem.service.impl;

import com.fptu.evstation.rental.evrentalsystem.dto.CreateModelRequest;
import com.fptu.evstation.rental.evrentalsystem.dto.ModelResponse;
import com.fptu.evstation.rental.evrentalsystem.dto.UpdateModelRequest;
import com.fptu.evstation.rental.evrentalsystem.entity.Model;
import com.fptu.evstation.rental.evrentalsystem.entity.VehicleType;
import com.fptu.evstation.rental.evrentalsystem.repository.ModelRepository;
import com.fptu.evstation.rental.evrentalsystem.repository.VehicleRepository;
import com.fptu.evstation.rental.evrentalsystem.service.ModelService;
import jakarta.persistence.criteria.Expression;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModelServiceImpl implements ModelService {
    private final ModelRepository modelRepository;
    private final VehicleRepository vehicleRepository;

    private final Path modelBaseDir = Paths.get(System.getProperty("user.dir"), "uploads", "models_img");

    @Override
    @Transactional
    public Model createModel(CreateModelRequest request, List<MultipartFile> images) {
        if (modelRepository.existsByModelName(request.getModelName())) {
            throw new RuntimeException("Model đã tồn tại!");
        }

        VehicleType type;
        try {
            type = VehicleType.valueOf(request.getVehicleType().toUpperCase());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "VehicleType không hợp lệ: " + request.getVehicleType());
        }

        String imagePaths = saveImagesAndGetPaths(request.getModelName(), images, null);

        Model model = Model.builder()
                .modelName(request.getModelName())
                .vehicleType(type)
                .seatCount(request.getSeatCount())
                .batteryCapacity(request.getBatteryCapacity())
                .rangeKm(request.getRangeKm())
                .features(request.getFeatures())
                .pricePerHour(request.getPricePerHour())
                .initialValue(request.getInitialValue())
                .description(request.getDescription())
                .imagePaths(imagePaths)
                .build();

        return modelRepository.save(model);
    }

    @Override
    @Transactional
    public Model updateModel(Long id, UpdateModelRequest request, List<MultipartFile> newImages) {
        Model model = modelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy model ID " + id));


        String newPaths = saveImagesAndGetPaths(model.getModelName(), newImages, model.getImagePaths());

        if (request.getModelName() != null) model.setModelName(request.getModelName());
        if (request.getVehicleType() != null) model.setVehicleType(VehicleType.valueOf(request.getVehicleType().toUpperCase()));
        if (request.getSeatCount() != null) model.setSeatCount(request.getSeatCount());
        if (request.getBatteryCapacity() != null) model.setBatteryCapacity(request.getBatteryCapacity());
        if (request.getRangeKm() != null) model.setRangeKm(request.getRangeKm());
        if (request.getFeatures() != null) model.setFeatures(request.getFeatures());
        if (request.getDescription() != null) model.setDescription(request.getDescription());
        if (request.getPricePerHour() != null) model.setPricePerHour(request.getPricePerHour());
        if (request.getInitialValue() != null) model.setInitialValue(request.getInitialValue());
        model.setUpdatedAt(LocalDateTime.now());
        model.setImagePaths(newPaths);

        return modelRepository.save(model);
    }

    @Override
    @Transactional
    public void deleteModel(Long id) {
        Model model = modelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy model ID " + id));

        long count = vehicleRepository.count((root, query, cb) ->
                cb.equal(root.get("model").get("modelId"), id));

        if (count > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Không thể xóa model '" + model.getModelName() + "' vì vẫn có " + count + " xe đang sử dụng.");
        }
        modelRepository.delete(model);
    }

    @Override
    public Model getModelById(Long id) {
        return modelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy model với ID: " + id));
    }


    @Override
    public ModelResponse getModelDetailsById(Long id) {
        Model model = modelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy model với ID: " + id));

        List<String> paths = model.getImagePaths() != null
                ? List.of(model.getImagePaths().split(","))
                : new ArrayList<>();

        return ModelResponse.builder()
                .modelId(model.getModelId())
                .modelName(model.getModelName())
                .vehicleType(model.getVehicleType())
                .seatCount(model.getSeatCount())
                .batteryCapacity(model.getBatteryCapacity())
                .rangeKm(model.getRangeKm())
                .pricePerHour(model.getPricePerHour())
                .initialValue(model.getInitialValue())
                .features(model.getFeatures())
                .description(model.getDescription())
                .imagePaths(paths)
                .createdAt(model.getCreatedAt())
                .updatedAt(model.getUpdatedAt())
                .build();
    }

    @Override
    public List<ModelResponse> getAllModels(String keyword) {
        List<Model> models;
        String trimmedKeyword = (keyword != null) ? keyword.trim().toLowerCase() : null;

        if (trimmedKeyword == null || trimmedKeyword.isBlank()) {
            models = modelRepository.findAll();
        }else {
            Specification<Model> spec = (root, query, cb) -> {
                String keywordNoSpaces = trimmedKeyword.replace(" ", "");
                Expression<String> modelNameLower = cb.lower(root.get("modelName"));
                Expression<String> modelNameNoSpaces = cb.function("REPLACE", String.class, modelNameLower, cb.literal(" "), cb.literal(""));

                return cb.like(modelNameNoSpaces, "%" + keywordNoSpaces + "%");
            };
            models = modelRepository.findAll(spec);
        }

        return models.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private ModelResponse convertToResponse(Model model) {
        List<String> paths = (model.getImagePaths() != null && !model.getImagePaths().isBlank())
                ? List.of(model.getImagePaths().split(","))
                : new ArrayList<>();

        return ModelResponse.builder()
                .modelId(model.getModelId())
                .modelName(model.getModelName())
                .vehicleType(model.getVehicleType())
                .seatCount(model.getSeatCount())
                .batteryCapacity(model.getBatteryCapacity())
                .rangeKm(model.getRangeKm())
                .pricePerHour(model.getPricePerHour())
                .initialValue(model.getInitialValue())
                .features(model.getFeatures())
                .description(model.getDescription())
                .imagePaths(paths)
                .createdAt(model.getCreatedAt())
                .updatedAt(model.getUpdatedAt())
                .rentalCount(model.getRentalCount())
                .build();
    }

    private String saveImagesAndGetPaths(String modelName,
                                         List<MultipartFile> images,
                                         String currentImagePaths) {
        if (images == null || images.isEmpty() || (images.size() == 1 && images.get(0).isEmpty())) {
            return currentImagePaths;
        }
        String modelDirName = modelName.replaceAll("[^a-zA-Z0-9-]", "_");

        Path modelDirPathAbsolute = modelBaseDir.resolve(modelDirName);

        try {
            Files.createDirectories(modelDirPathAbsolute);
        } catch (IOException e) {
            throw new RuntimeException("Không thể tạo thư mục lưu ảnh: " + modelDirPathAbsolute, e);
        }

        List<String> newRelativePaths = new ArrayList<>();

        for (MultipartFile file : images) {
            if (file.isEmpty()) continue;

            String contentType = file.getContentType();
            if (contentType == null || !isValidImage(contentType)) {
                System.err.println("File " + file.getOriginalFilename() + " có định dạng không hợp lệ: " + contentType);
                continue;
            }

            String uniqueFileName = file.getOriginalFilename();
            Path filePathAbsolute = modelDirPathAbsolute.resolve(uniqueFileName);

            try {
                file.transferTo(filePathAbsolute);
                String relativePath = "/uploads/models_img/" + modelDirName + "/" + uniqueFileName;
                newRelativePaths.add(relativePath);

            } catch (IOException e) {
                System.err.println("Lỗi khi lưu file: " + uniqueFileName + ". Error: " + e.getMessage());
            }
        }
        return String.join(",", newRelativePaths);
    }

    private boolean isValidImage(String contentType) {
        return contentType.equals("image/png") ||
                contentType.equals("image/jpeg") ||
                contentType.equals("image/jpg") ||
                contentType.equals("image/gif") ||
                contentType.equals("image/webp");
    }

}