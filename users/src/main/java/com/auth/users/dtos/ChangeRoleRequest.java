package com.auth.users.dtos;

import com.auth.users.entities.UserRole;
import lombok.Data;

/**
 * Body of {@code PATCH /api/users/{id}/role}. Sent by the admin panel to
 * promote/demote a user across the three realm roles.
 */
@Data
public class ChangeRoleRequest {
    private UserRole role;
}
