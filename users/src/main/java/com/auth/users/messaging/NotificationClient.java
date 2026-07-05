package com.auth.users.messaging;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

/**
 * Feign client used to publish user-domain events to the Node.js
 * notification-service. The service is registered in Eureka as
 * {@code notification-service} (via eureka-js-client), so we can address
 * it by name and let the client-side load balancer resolve the instance.
 */
@FeignClient(name = "notification-service", contextId = "notificationClient")
public interface NotificationClient {

    /**
     * Fire-and-forget publish. The notification-service will store the
     * payload in its in-memory history and broadcast it to every connected
     * SSE subscriber (frontend clients).
     */
    @PostMapping("/api/notifications")
    void publish(@RequestBody Map<String, Object> payload);
}
