
# Keycloak Setup for the Microservices Platform

## Overview — What You're Creating

Your codebase already expects these exact names (from `config-repo/users-service.properties` and `frontend/.env`):

| Name | Value |
|---|---|
| Realm | `microservices-realm` |
| Backend client | `users-service` |
| Frontend client | `frontend-app` |
| Realm roles | `ADMINISTRATEUR`, `ORGANISATEUR`, `PARTICIPANT` |
| Admin user | `admin / admin` |

---

# STEP 1 — Access the Keycloak Admin Console

1. Open:

```
http://localhost:8180
```

2. Click **Administration Console**.
3. Login:

```
Username: admin
Password: admin
```

You start in the **master realm** (top-left dropdown).

---

# STEP 2 — Create the Realm

1. Click the realm dropdown (top-left, currently `master`).
2. Click **Create realm**.
3. Fill:

```
Realm name: microservices-realm
Enabled: ON
```

4. Click **Create**.

You are now inside:

```
microservices-realm
```

---

# STEP 3 — Configure Realm Settings

Go to:

```
Realm settings
```

## 3.1 Login Tab

Enable:

- User registration: ON
- Forgot password: ON
- Remember me: ON (optional)
- Login with email: ON
- Email as username: OFF

Click:

```
Save
```

---

## 3.2 Tokens Tab

Verify:

```
Access Token Lifespan: 5 minutes
SSO Session Idle: 30 minutes
```

Save if changed.

---

# STEP 4 — Create Realm Roles

Navigate:

```
Realm roles → Create role
```

Create these roles:

| Role |
|---|
| ADMINISTRATEUR |
| ORGANISATEUR |
| PARTICIPANT |

Role names are case-sensitive.

They must match:

```
UserRole.java
```

For each role:

1. Enter role name.
2. Add description (optional).
3. Click Save.

---

## 4.1 Set PARTICIPANT as Default Role

New users should automatically receive:

```
PARTICIPANT
```

Steps:

```
Realm settings
→ User registration
→ Default roles
```

Add:

```
PARTICIPANT
```

Save.

> Some Keycloak versions:
>
> ```
> Realm settings → Default roles → Realm roles
> ```

---

# STEP 5 — Create Frontend Client

Client:

```
frontend-app
```

Navigate:

```
Clients → Create client
```

---

## 5.1 General Settings

```
Client type:
OpenID Connect

Client ID:
frontend-app

Name:
Frontend (React)
```

Click:

```
Next
```

---

## 5.2 Capability Configuration

Configure:

```
Client authentication: OFF
Authorization: OFF
```

Authentication flows:

Enabled:

```
✓ Standard flow
✓ Direct access grants
```

Disabled:

```
✗ Others
```

Click:

```
Next
```

---

## 5.3 Login Settings

Configure:

```
Root URL:
http://localhost:5173

Home URL:
http://localhost:5173

Valid redirect URIs:
http://localhost:5173/*

Valid post logout redirect URIs:
http://localhost:5173/*

Web origins:
http://localhost:5173
```

Save.

---

## 5.4 Verify Advanced Settings

Open:

```
frontend-app → Advanced
```

Check:

```
Proof Key for Code Exchange Code Challenge Method:

S256
```

---

# STEP 6 — Create Backend Client

Client:

```
users-service
```

Navigate:

```
Clients → Create client
```

---

## 6.1 General Settings

```
Client type:
OpenID Connect

Client ID:
users-service

Name:
Users Service (backend)
```

---

## 6.2 Capability Configuration

Enable:

```
Client authentication: ON
Authorization: OFF
```

Authentication flows:

Enable:

```
✓ Service accounts roles
✓ Direct access grants
```

Disable:

```
✗ Others
```

---

## 6.3 Login Settings

Leave empty.

This is a backend-only client.

Save.

---

## 6.4 Get Client Secret

Navigate:

```
users-service
→ Credentials
→ Client secret
```

Copy the secret.

Example:

```
TpCFGRUfybOocCOtSf4jLT3EyDkzz9Jo
```

Save it.

You need it in:

```
config-repo/users-service.properties
```

---

## 6.5 Grant Admin Permissions

The backend needs Keycloak Admin REST API access.

Navigate:

```
users-service
→ Service accounts roles
→ Assign role
```

Change filter:

```
Filter by realm roles
```

to:

```
Filter by clients
```

Search:

```
realm-management
```

Assign:

```
manage-users
view-users
query-users
manage-realm
view-realm
```

---

# STEP 7 — Update Project Configuration

## 7.1 Backend Configuration

File:

```
config-repo/users-service.properties
```

Replace:

```properties
keycloak.client-secret=<new-secret>
```

with the copied secret.

---

## 7.2 Frontend Configuration

File:

```
frontend/.env
```

Expected:

```env
VITE_KEYCLOAK_URL=http://localhost:8180
VITE_KEYCLOAK_REALM=microservices-realm
VITE_KEYCLOAK_CLIENT_ID=frontend-app
```

Restart frontend:

```bash
npm run dev
```

---

# STEP 8 — Create Admin Application User

Navigate:

```
Users → Create new user
```

Create:

```
Username:
admin-app

Email:
admin@example.com

Email verified:
ON
```

Save.

---

## Set Password

Go:

```
Credentials → Set password
```

Example:

```
Password:
your-password

Temporary:
OFF
```

Save.

---

## Assign Role

Navigate:

```
Role mapping
→ Assign role
→ Realm roles
```

Select:

```
ADMINISTRATEUR
```

Assign.

---

# STEP 9 — Verify Keycloak Flow

Run PowerShell:

## 1. Check Realm

```powershell
Invoke-RestMethod `
"http://localhost:8180/realms/microservices-realm/.well-known/openid-configuration" |
Select-Object issuer, token_endpoint
```

---

## 2. Check Frontend Authentication

```powershell
$r = Invoke-WebRequest `
"http://localhost:8180/realms/microservices-realm/protocol/openid-connect/auth?client_id=frontend-app&redirect_uri=http://localhost:5173/&response_type=code" `
-UseBasicParsing `
-MaximumRedirection 0 `
-ErrorAction SilentlyContinue

"Frontend auth endpoint status: $($r.StatusCode)"
```

Expected:

```
200
```

---

## 3. Test Backend Client Credentials

```powershell
$body = @{
 client_id="users-service"
 client_secret="<secret>"
 grant_type="client_credentials"
}

$t = Invoke-RestMethod `
-Method Post `
-Uri "http://localhost:8180/realms/microservices-realm/protocol/openid-connect/token" `
-Body $body
```

Expected:

```
Backend token OK
```

---

## 4. Test Admin Password Grant

```powershell
$body = @{
 client_id="admin-cli"
 username="admin"
 password="admin"
 grant_type="password"
}

$t = Invoke-RestMethod `
-Method Post `
-Uri "http://localhost:8180/realms/master/protocol/openid-connect/token" `
-Body $body
```

Expected:

```
Admin master token OK
```

---

# STEP 10 — Restart users-service

Restart because configuration is loaded at startup.

Example:

```bash
mvn -f users spring-boot:run
```

Expected logs:

```
Fetching config from server at : http://localhost:8889

Located environment:
name=users-service

[rabbit] configured:
host=localhost
port=5672

[rabbit]
UserEventPublisher wired
```

---

# STEP 11 — End-to-End Smoke Test

## 11.1 Registration API Test

PowerShell:

```powershell
$rnd = Get-Random -Maximum 99999

$body = @{
 username="notiftest$rnd"
 password="Password123!"
 email="notiftest$rnd@example.com"
 firstName="Notif"
 lastName="Test"
} | ConvertTo-Json


Invoke-RestMethod `
-Method Post `
-Uri "http://localhost:8888/api/auth/register" `
-Body $body `
-ContentType "application/json"
```

Expected:

- User profile returned.
- users-service:

```
[rabbit] PUBLISHED USER_CREATED
```

- notification-service receives event.
- Notifications API:

```
GET http://localhost:9000/api/notifications?limit=3
```

Returns:

```
Notif Test just joined!
```

---

## 11.2 Frontend Login Test

Open:

```
http://localhost:5173
```

Expected flow:

1. Redirect to Keycloak.
2. Login using:

```
admin-app
```

or created user.

3. Redirect:

```
/welcome
```

4. Notification bell shows:

```
● live
```

5. New registration pushes toast notification within ~1 second.

---

# Common Problems

| Problem | Cause |
|---|---|
| Login redirects but no session | Wrong redirect URI |
| CORS browser error | Missing Web Origins |
| Cannot obtain Keycloak admin token | Wrong client secret or admin password |
| User has no role in JWT | PARTICIPANT not default role |
| 403 creating users | Missing realm-management roles |
| JWT issuer mismatch | Wrong issuer-uri |

---

# Final Checklist

Completed:

- [x] Realm created
- [x] Frontend client created
- [x] Backend client created
- [x] Roles created
- [x] Default PARTICIPANT role configured
- [x] Admin application user created
- [x] Backend secret updated
- [x] users-service restarted
- [x] End-to-end flow tested

Files modified:

```
config-repo/users-service.properties
```

Frontend:

```
frontend/.env
```

No frontend changes required if values already match.

---

After completion provide:

1. Step 9 PowerShell output.
2. users-service log containing:

```
[rabbit] PUBLISHED
```

after registration test.