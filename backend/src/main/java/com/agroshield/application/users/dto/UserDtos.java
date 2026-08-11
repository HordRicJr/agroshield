package com.agroshield.application.users.dto;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class UserDtos {

    private UserDtos() {
    }

    public record InviteUserRequest(
            @NotBlank @Email @Size(max = 320) String email,
            @NotBlank @Size(max = 255) String fullName,
            @NotBlank @Size(min = 10, max = 128) String temporaryPassword,
            @NotBlank String roleCode
    ) {
    }

    public record UpdateMemberRequest(
            String roleCode,
            String status
    ) {
    }

    public record MemberView(
            UUID userId,
            String email,
            String fullName,
            String roleCode,
            String status,
            boolean mfaEnabled,
            Instant joinedAt
    ) {
    }
}
