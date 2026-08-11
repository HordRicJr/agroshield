package com.agroshield.interfaces.rest;

import java.util.List;
import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.agroshield.application.users.UsersService;
import com.agroshield.application.users.dto.UserDtos.InviteUserRequest;
import com.agroshield.application.users.dto.UserDtos.MemberView;
import com.agroshield.application.users.dto.UserDtos.UpdateMemberRequest;
import com.agroshield.infrastructure.security.CorrelationIdFilter;
import com.agroshield.interfaces.rest.dto.ApiResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/users")
@Validated
@PreAuthorize("hasAuthority('USER_MANAGE')")
public class UsersController {

    private final UsersService usersService;

    public UsersController(UsersService usersService) {
        this.usersService = usersService;
    }

    @GetMapping
    public ApiResponse<List<MemberView>> list() {
        return ApiResponse.ok(usersService.list(), corr());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MemberView> invite(@Valid @RequestBody InviteUserRequest request) {
        return ApiResponse.ok(usersService.invite(request), corr());
    }

    @PatchMapping("/{userId}")
    public ApiResponse<MemberView> update(
            @PathVariable UUID userId, @Valid @RequestBody UpdateMemberRequest request) {
        return ApiResponse.ok(usersService.update(userId, request), corr());
    }

    private static String corr() {
        String id = MDC.get(CorrelationIdFilter.MDC_KEY);
        return id != null ? id : "unknown";
    }
}
