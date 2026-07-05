package com.auth.users.dtos;

import com.auth.users.entities.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight user representation intended for pickers / selectors on the
 * frontend (e.g. "choose the organizer of this event"). Contains no sensitive
 * fields like {@code createdAt} — just enough to display and pick a user.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryResponse {
    private String id;
    private String username;
    private String firstName;
    private String lastName;
    private UserRole role;
}
