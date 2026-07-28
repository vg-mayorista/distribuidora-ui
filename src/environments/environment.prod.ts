// =============================================================================
// Environment — producción
// =============================================================================
// En producción el frontend y la API se sirven desde el mismo dominio,
// por lo que `backendUrl` queda vacío y los servicios usan rutas relativas
// `/api/...` (que se resuelven contra el mismo origen).
//
// Si se sirven por separado (ej. CDN para el front + API en otro host),
// setear `backendUrl` con la URL absoluta de la API, por ejemplo:
//   backendUrl: 'https://api.distribuidora.example.com'
// =============================================================================

export const environment = {
  production: true,
  development: false,

  // Mismo origen: el proxy inverso (nginx, traefik, etc.) enruta /api al backend.
  backendUrl: '',

  frontendUrl: '',
};
