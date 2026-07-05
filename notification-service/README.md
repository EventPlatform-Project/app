# notification-service

Dedicated Node.js microservice for **live notifications**.

## What it does

1. **Receives** notifications from other microservices over HTTP
   (currently `USER_CREATED`, sent by `users-service` via Feign whenever
   a new user registers).
2. **Stores** the most recent notifications in memory (bounded history).
3. **Broadcasts** every incoming notification to all connected frontends
   in real time via **Server-Sent Events (SSE)**.
4. **Registers** itself in Netflix Eureka (`notification-service`) so
   both the Spring Cloud API Gateway (`lb://notification-service`) and
   the users-service Feign client can address it by name.

```
users-service ──POST /api/notifications──▶ notification-service (Feign, via Eureka)
                                                    │
                                                    ├──▶ in-memory history
                                                    └──▶ SSE /api/notifications/stream
                                                                │
                                                                ▼
                                                           React frontend
                                                           (toast + bell)
```

## Endpoints

Base URL (via Gateway):   `http://localhost:8888/api/notifications` — canonical
Direct (dev only):        `http://localhost:9000`

| Method | Path                          | Description                                                                                     |
|--------|-------------------------------|-------------------------------------------------------------------------------------------------|
| GET    | `/health`                     | Liveness probe (connected SSE clients count).                                                    |
| POST   | `/api/notifications`          | **Publish** a notification. Called by other services (users-service via Feign).                  |
| GET    | `/api/notifications`          | Recent notifications (newest first, capped by `MAX_HISTORY`).                                    |
| GET    | `/api/notifications/stream`   | **SSE stream** — new notifications pushed as `event: notification`. Plus `event: ping` every 25s.|
| DELETE | `/api/notifications`          | Clear the in-memory history (dev-only).                                                          |

### Publish payload (POST /api/notifications)

```json
{
  "type": "USER_CREATED",
  "id": "0f6f...uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "PARTICIPANT",
  "createdAt": "2026-07-04T10:15:30Z"
}
```

The `type` field is the only strictly required one. The service will build
a friendly `message` based on the type (`"John Doe just joined!"` for
`USER_CREATED`) and broadcast the enriched notification.

### SSE frame example

```
event: notification
data: {"id":"...","type":"USER_CREATED","username":"johndoe","message":"John Doe just joined!", ...}
```

## Running

```bash
cd notification-service
npm install
npm start
```

## Configuration

See `.env.example` — all vars are optional and have sensible defaults.
