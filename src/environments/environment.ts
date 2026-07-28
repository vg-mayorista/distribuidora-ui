// =============================================================================
// Environment — desarrollo local
// =============================================================================
// Apunta directamente al backend Distribuidora (Spring Boot en :8080).
// Si vas a usar túneles HTTPS (ngrok / cloudflared), reemplazá `backendUrl`
// por la URL pública del túnel del backend.
//
// Si preferís volver a usar el proxy de Angular (proxy.conf.json), dejá
// `backendUrl = ''` y los servicios usarán rutas relativas `/api/...`.
// =============================================================================

export const environment = {
  production: false,
  development: true,

  // Backend Distribuidora (Spring Boot) en local
  backendUrl: 'http://localhost:8080',

  frontendUrl: 'http://localhost:4200',
};
