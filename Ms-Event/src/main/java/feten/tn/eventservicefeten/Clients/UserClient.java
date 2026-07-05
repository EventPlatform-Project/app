package feten.tn.eventservicefeten.Clients;

import feten.tn.eventservicefeten.Dto.UserProfileDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;


@FeignClient(name = "users-service", contextId = "usersClient")
public interface UserClient {

    @GetMapping("/api/users/internal/{id}")
    UserProfileDto getUserById(@PathVariable("id") String id);
}
