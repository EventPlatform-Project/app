# microservices-config

Centralized configuration repository consumed by the **config-server** module.

## How Spring Cloud Config resolves files

For a client whose `spring.application.name = X`, the config-server serves:

- `application.properties` (or `.yml`) — shared defaults for **all** services
- `X.properties` (or `.yml`) — service-specific overrides
- `X-<profile>.properties` — profile-specific overrides (e.g. `X-dev.properties`)

## Files in this repo

| File | Applies to |
|---|---|
| `application.properties` | All services (Eureka URL, Keycloak, CORS, etc.) |
| `api-gateway.properties` | api-gateway |
| `users-service.properties` | users service |
| `events-service.properties` | Ms-Event |
| `ms-reservation.properties` | Ms-Reservation |
| `ms-tickets.properties` | ticket-service |
| `discovery-server.properties` | discovery-server (kept minimal / optional) |

## Publishing to GitHub

1. Create a new GitHub repository, e.g. `microservices-config`.
2. From this folder:
   ```bash
   git init
   git add .
   git commit -m "initial centralized config"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USER/microservices-config.git
   git push -u origin main
   ```
3. Update `config-server/src/main/resources/application.properties`:
   - `spring.cloud.config.server.git.uri=https://github.com/YOUR_GITHUB_USER/microservices-config.git`
   - (or use the `CONFIG_GIT_URI` env var)

## Running the config-server locally WITHOUT GitHub

Start it with the `native` profile — it will serve files directly from this folder:

```bash
cd config-server
./mvnw spring-boot:run -Dspring-boot.run.profiles=native
```
