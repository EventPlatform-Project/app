# notification-service

Node.js + MongoDB microservice for **live notifications**, driven by **RabbitMQ**.

## What it does

1. **Consumes** user domain events from a RabbitMQ topic exchange
   (default: `user.events`, routing keys `user.created`, `user.updated`,
   `user.deleted`). The `users-service` (Spring Boot) is the producer.
2. **Persists** every event in MongoDB (`notifications` collection).
3. **Broadcasts** every incoming event to all connected frontends in real
   time via **Server-Sent Events (SSE)**.
4. **Exposes** a small REST API for history, unread counts, and mark-as-read.
5. **Registers** itself in Netflix Eureka (`notification-service`) so the
   Spring Cloud API Gateway can route to it as `lb://notification-service`.

```
users-service ──amqp──▶ RabbitMQ (topic: user.events, rk: user.created)
                                 │
                                 ▼
                       notification-service (Node.js)
                             │       │
                             ▼       ▼
                        MongoDB    SSE /api/notifications/stream
                                       │
                                       ▼
                                 React frontend
                                 (toast + bell)
```

## Endpoints

Base URL (via Gateway): `http://localhost:8888/api/notifications`
Direct (dev only):      `http://localhost:9000`

| Method | Path                          | Description                                                                                     |
|--------|-------------------------------|-------------------------------------------------------------------------------------------------|
| GET    | `/health`                     | Liveness probe (mongo status + connected SSE clients count).                                    |
| GET    | `/api/notifications`          | Recent notifications. Query: `limit`, `skip`, `unreadOnly=true`.                                |
| GET    | `/api/notifications/unread-count` | `{ "count": <number> }`.                                                                    |
| POST   | `/api/notifications`          | **Publish** a notification over HTTP (kept for local testing; main path is RabbitMQ).           |
| GET    | `/api/notifications/stream`   | **SSE stream** — pushes `event: notification`. Plus `event: ping` every 25 s.                   |
| PATCH  | `/api/notifications/:id/read` | Mark a single notification as read.                                                             |
| PATCH  | `/api/notifications/read-all` | Mark all as read.                                                                               |
| DELETE | `/api/notifications`          | Clear the collection (dev-only).                                                                |

### RabbitMQ payload

`users-service` publishes JSON like:

```json
{
  "type": "USER_CREATED",
  "id": "0f6f-uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "PARTICIPANT",
  "createdAt": "2026-07-04T10:15:30Z"
}
```

The service will build a friendly `message` from the payload
(e.g. `"John Doe just joined!"` for `USER_CREATED`).

### SSE frame example

```
event: notification
data: {"id":"...","type":"USER_CREATED","username":"johndoe","message":"John Doe just joined!", ...}
```

## Running

### With Docker Compose (recommended)

From the repo root:

```bash
docker compose up -d rabbitmq mongodb-container discovery-server
docker compose up --build notification-service
```

RabbitMQ management UI: <http://localhost:15672> (guest / guest)

### Locally

```bash
cd notification-service
cp .env.example .env      # then adjust
npm install
npm start
```

## Configuration

Application settings are served by the **Spring Cloud Config server**
from `config-repo/notification-service.properties`. On boot,
`src/config/configClient.js` fetches
`${CONFIG_SERVER_URL}/notification-service/default`, resolves `${...}`
placeholders against `process.env`, then merges every key into
`process.env` before any other module reads it.

**Only bootstrap variables** live in `.env`:

| Var                          | Default                     | Purpose                                              |
|------------------------------|-----------------------------|------------------------------------------------------|
| `CONFIG_SERVER_URL`          | (unset — uses defaults)     | Base URL of the config-server.                       |
| `EUREKA_HOST`                | `localhost`                 | Eureka discovery server.                             |
| `MONGO_HOST`                 | `localhost`                 | Resolved into `notification.mongo.uri`.              |
| `RABBITMQ_HOST`              | `localhost`                 | Resolved into `notification.rabbitmq.url`.           |
| `NOTIFICATION_INSTANCE_HOST` | `localhost`                 | Hostname advertised to Eureka (must be reachable).   |

If `CONFIG_SERVER_URL` is unset or the server is unreachable, the service
falls back to the hard-coded defaults from `src/config/env.js`. Any env
var **explicitly set** always overrides its config-server counterpart.

## Project layout

```
notification-service/
├── src/
│   ├── config/
│   │   ├── configClient.js # Spring Cloud Config client (fetch + merge)
│   │   ├── env.js          # env vars & defaults
│   │   ├── mongo.js        # Mongoose connection
│   │   └── eureka.js       # Eureka client registration
│   ├── messaging/
│   │   └── rabbit.js       # AMQP consumer (with auto-reconnect)
│   ├── models/
│   │   └── Notification.js # Mongoose schema
│   ├── routes/
│   │   └── notifications.js
│   ├── services/
│   │   ├── notificationService.js # persist + broadcast
│   │   └── sseHub.js              # SSE client registry
│   ├── app.js
│   └── server.js
├── Dockerfile
├── package.json
└── .env.example
```
