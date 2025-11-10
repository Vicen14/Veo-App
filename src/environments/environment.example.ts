// Example environment file. Copy to environment.ts and fill your real keys locally.
export const environment = {
  production: false,
  // Usa una sola clave habilitada para Maps JavaScript API + Places
  googleMaps: {
    apiKey: '',
  },
  // Clave separada para Places API (HTTP)
  googlePlaces: {
    apiKey: '',
  },
};
