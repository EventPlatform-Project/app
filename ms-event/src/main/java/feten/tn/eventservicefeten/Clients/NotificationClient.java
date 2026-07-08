//package feten.tn.eventservicefeten.Clients;
//
//import feten.tn.eventservicefeten.Dto.EventCreatedNotification;
//import org.springframework.cloud.openfeign.FeignClient;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestBody;
//
//
//@FeignClient(
//        name = "notification-service",
//        url = "${notification.service.url:http://localhost:9000}",
//        contextId = "notificationClient"
//)
//public interface NotificationClient {
//
//    @PostMapping("/api/notifications/event-created")
//    void publishEventCreated(@RequestBody EventCreatedNotification payload);
//}
