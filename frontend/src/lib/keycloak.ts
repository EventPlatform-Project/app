import Keycloak from 'keycloak-js'

/**
 * Single shared Keycloak instance for the whole application.
 *
 * NOTE: We intentionally instantiate the object at module scope (a singleton)
 * so that hot-reloads and multiple React roots reuse the same client. Do not
 * call `keycloak.init(...)` more than once — that is enforced in AuthProvider.
 */
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'microservices-realm',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'frontend-app',
})

export default keycloak
