// Example production environment file. Copy to environment.prod.ts and fill your real keys locally.
export const environment = {
  production: true,
  // Clave única para Maps JavaScript API + Places en producción
  googleMaps: {
    apiKey: 'YOUR_GOOGLE_API_KEY',
  },
};
