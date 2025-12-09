// Example production environment file. Copy to environment.prod.ts and fill your real keys locally.
export const environment = {
  production: true,
  // Clave para Maps JavaScript API en producción
  googleMaps: {
    apiKey: 'AIzaSyAW-LRQDzcRaMQJAP68Xi6wPTbQyQhOEQ4',
  },
  // Clave separada para Places API (HTTP) en producción
  googlePlaces: {
    apiKey: 'AIzaSyAW-LRQDzcRaMQJAP68Xi6wPTbQyQhOEQ4',
  },
};
