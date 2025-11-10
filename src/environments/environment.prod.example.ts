// Example production environment file. Copy to environment.prod.ts and fill your real keys locally.
export const environment = {
  production: true,
  // Clave para Maps JavaScript API en producción
  googleMaps: {
    apiKey: '',
  },
  // Clave separada para Places API (HTTP) en producción
  googlePlaces: {
    apiKey: '',
  },
};
