package com.agroshield.interfaces.rest.dto;

public record ApiResponse<T>(
        boolean success,
        T data,
        ApiError error,
        ApiMeta meta
) {
    public static <T> ApiResponse<T> ok(T data, String requestId) {
        return new ApiResponse<>(true, data, null, new ApiMeta(requestId));
    }

    public static <T> ApiResponse<T> fail(ApiError error, String requestId) {
        return new ApiResponse<>(false, null, error, new ApiMeta(requestId));
    }
}
