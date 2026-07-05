# API Gateway Route & URL Documentation

The API Gateway is running on **`http://localhost:8888`**. All requests to microservices should be routed through this gateway.

Below is the list of endpoints available via the API Gateway.

---

## 1. Authentication & Authorization Service (`users-service`)
**Base Gateway URL:** `http://localhost:8888/api/auth`

### Register a User
* **URL:** `http://localhost:8888/api/auth/register`
* **Method:** `POST`
* **Content-Type:** `application/json`
* **Request Body:**
  ```json
  {
    "username": "johndoe",
    "email": "john.doe@example.com",
    "password": "securepassword123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "PARTICIPANT" // Valid roles: ADMINISTRATEUR, ORGANISATEUR, PARTICIPANT
  }
  ```
* **Response Status:** `201 Created`

### User Login
* **URL:** `http://localhost:8888/api/auth/login`
* **Method:** `POST`
* **Content-Type:** `application/json`
* **Request Body:**
  ```json
  {
    "username": "johndoe",
    "password": "securepassword123"
  }
  ```
* **Response Status:** `200 OK`
* **Response Body:** Returns a JWT token to be used in authorization headers.
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  }
  ```

### Health Check ("Hey")
* **URL:** `http://localhost:8888/api/auth/hey`
* **Method:** `GET`
* **Response Status:** `200 OK`
* **Response Body:** `Hey`

---

## 2. User Profiles & Admin Operations (`users-service`)
**Base Gateway URL:** `http://localhost:8888/api/users`

### Get Current User Profile
* **URL:** `http://localhost:8888/api/users/profile`
* **Method:** `GET`
* **Headers:** 
  * `Authorization: Bearer <token>`
* **Response Status:** `200 OK`

### Update Current User Profile
* **URL:** `http://localhost:8888/api/users/profile`
* **Method:** `PUT`
* **Headers:** 
  * `Authorization: Bearer <token>`
* **Content-Type:** `application/json`
* **Request Body:**
  ```json
  {
    "firstName": "Johnny",
    "lastName": "Doey"
  }
  ```
* **Response Status:** `200 OK`

### List All Users (Admin Only)
* **URL:** `http://localhost:8888/api/users`
* **Method:** `GET`
* **Headers:** 
  * `Authorization: Bearer <token>` (User must have the role `ADMINISTRATEUR`)
* **Response Status:** `200 OK` / `403 Forbidden`

### Get My Organized Events (Organizer Only)
* **URL:** `http://localhost:8888/api/users/events`
* **Method:** `GET`
* **Headers:** 
  * `Authorization: Bearer <token>`
* **Response Status:** `200 OK`

---

## 3. Events Service (`events-service`)
**Base Gateway URL:** `http://localhost:8888/api/events`

### Create Event
* **URL:** `http://localhost:8888/api/events/create`
* **Method:** `POST`
* **Content-Type:** `application/json`
* **Request Body:**
  ```json
  {
    "title": "Spring Boot Microservices Workshop",
    "description": "Learn to build scalable microservices.",
    "category": "Technology",
    "maxPlaces": 100,
    "availablePlaces": 100,
    "organizerId": "user-uuid-or-username"
  }
  ```
* **Response Status:** `200 OK`

### List All Events
* **URL:** `http://localhost:8888/api/events/all`
* **Method:** `GET`
* **Response Status:** `200 OK`

### Get Event Details
* **URL:** `http://localhost:8888/api/events/{id}`
* **Method:** `GET`
* **Response Status:** `200 OK`

### Add Schedule to Event
* **URL:** `http://localhost:8888/api/events/{eventId}/schedules`
* **Method:** `POST`
* **Content-Type:** `application/json`
* **Request Body:**
  ```json
  {
    "date": "2026-06-15",
    "startTime": "09:00:00",
    "endTime": "12:00:00",
    "room": "Room A101",
    "speaker": "Jane Doe"
  }
  ```
* **Response Status:** `200 OK`

### Delete Event
* **URL:** `http://localhost:8888/api/events/{id}`
* **Method:** `DELETE`
* **Response Status:** `200 OK`
* **Response Body:** `Deleted successfully`

### List Events by Organizer
* **URL:** `http://localhost:8888/api/events/by-organizer?organizer={organizerId}`
* **Method:** `GET`
* **Response Status:** `200 OK`

---

## 4. Ticket Service (`ms-tickets`)
**Base Gateway URL:** `http://localhost:8888/api/tickets`

### Create Ticket
* **URL:** `http://localhost:8888/api/tickets/create`
* **Method:** `POST`
* **Content-Type:** `application/json`
* **Request Body:**
  ```json
  {
    "reservationId": 123,
    "userId": 456,
    "eventId": 789,
    "eventTitle": "Tech Conference 2026",
    "userEmail": "john.doe@example.com",
    "userFullName": "John Doe",
    "seatNumber": 42,
    "confirmedAt": "2026-06-13T12:34:12"
  }
  ```
* **Response Status:** `200 OK`

### Get Ticket by ID
* **URL:** `http://localhost:8888/api/tickets/{id}`
* **Method:** `GET`
* **Response Status:** `200 OK`

### Get Ticket by Reservation ID
* **URL:** `http://localhost:8888/api/tickets/reservation/{resId}`
* **Method:** `GET`
* **Response Status:** `200 OK`

### Get Tickets by User ID
* **URL:** `http://localhost:8888/api/tickets/user/{userId}`
* **Method:** `GET`
* **Response Status:** `200 OK`

### Use / Validate Ticket
* **URL:** `http://localhost:8888/api/tickets/{id}/use`
* **Method:** `PUT`
* **Response Status:** `200 OK`

### View Ticket (HTML View)
* **URL:** `http://localhost:8888/api/tickets/{id}/view`
* **Method:** `GET`
* **Response Status:** `200 OK` (produces HTML)

### Get QR Code Image
* **URL:** `http://localhost:8888/api/tickets/{id}/qrcode`
* **Method:** `GET`
* **Response Status:** `200 OK` (produces PNG image)

---

## 5. Notification Service (`notification-service`, Node.js)
**Base Gateway URL:** `http://localhost:8888/api/notifications` — canonical
**Direct URL (dev only):** `http://localhost:9000`

The Node.js service registers itself in Eureka as `notification-service`,
so Spring Cloud Gateway routes to it via `lb://notification-service` —
no hard-coded ports. Clients should always use the gateway URL.

Consumes `USER_CREATED` events from RabbitMQ (published by `users-service`
whenever a user registers) and broadcasts them **live** to every connected
frontend over **Server-Sent Events (SSE)**.

### Live stream (SSE)
* **URL:** `http://localhost:8888/api/notifications/stream`
* **Method:** `GET` (headers: `Accept: text/event-stream`)
* **Response:** `text/event-stream` — one event per notification:
  ```
  event: notification
  data: {"id":"...","type":"USER_CREATED","username":"johndoe","message":"John Doe just joined!", ...}
  ```
  Plus a `ping` event every 25s to keep the connection alive.

### Recent notifications (history)
* **URL:** `http://localhost:8888/api/notifications`
* **Method:** `GET`
* **Response Status:** `200 OK`
* **Response Body:** array of the most recent notifications (newest first).

### Health check
* **URL:** `http://localhost:8888/api/notifications/health`
* **Method:** `GET`
* **Response Status:** `200 OK`

---

## 6. Config Server (`config-server`)
**Base URL:** `http://localhost:8889`

Spring Cloud Config Server backed by a GitHub repository (see `/config-repo`
folder in this project for the file layout). Not exposed through the API
Gateway — services fetch their configuration directly from it at boot via
`spring.config.import=optional:configserver:http://localhost:8889`.

### Example: fetch config for events-service
* **URL:** `http://localhost:8889/events-service/default`
* **Method:** `GET`
* **Response Status:** `200 OK`


