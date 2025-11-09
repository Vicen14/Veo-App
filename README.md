# Veo-App

Aplicación híbrida Ionic + Angular para descubrir lugares de entretenimiento cercanos (cines, arcades, cibercafés, escape rooms, centros de entretenimiento) usando Google Maps y Places. Para el ramo de programación de aplicaciones móviles de Duoc UC campus virtual.

## Stack y librerías (esta parte del readme la hice con ia)

### Angular 20

- Núcleo del framework (componentes standalone, router, forms, pipes, DI):
  - `@angular/core`, `@angular/common`, `@angular/forms`, `@angular/router`, `@angular/platform-browser`, `@angular/platform-browser-dynamic`, `@angular/animations`.
- Componentes/piezas clave usadas:
  - Componentes standalone (páginas: `TabsPage`, `Tab1Page`, `Tab2Page`, `Tab3Page`, `PerfilPage`).
  - Directivas: `*ngIf`, `*ngFor`, `ngClass`, `ngStyle`.
  - Pipes: `async`, `date`, `json`, `slice`.
  - Router: rutas en `app.routes.ts` y `tabs.routes.ts` con `IonRouterOutlet`.

### Ionic 8 (`@ionic/angular`)

- Componentes de UI usados:
  - Estructura: `IonApp`, `IonPage`, `IonHeader`, `IonToolbar`, `IonContent`, `IonFooter`.
  - Navegación por tabs: `IonTabs`, `IonTabBar`, `IonTabButton`.
  - Interacción: `IonButton`, `IonSearchbar`, `IonChip`, `IonIcon`, `IonLabel`.
  - Listado/estado: `IonList`, `IonItem`, `IonSkeletonText`, `IonBadge`.
  - Feedback: `IonToast`, `IonLoading`, `IonAlert` (disponibles para estados y errores).
  - Modalidad avanzada opcional: `IonModal`, `IonPopover`, `IonFab`.
- Íconos (`ionicons`): registro con `addIcons` y uso de íconos como `film-outline`, `game-controller-outline`, `location-outline`.

### Capacitor 7

- Núcleo: `@capacitor/core`.
- Plugins instalados:
  - `@capacitor/geolocation`: `Geolocation.getCurrentPosition()`, `watchPosition()` para centrar y reubicar.
  - `@capacitor/app`: eventos de app.
  - `@capacitor/haptics`: feedback háptico.
  - `@capacitor/keyboard`: control del teclado.
  - `@capacitor/status-bar`: estilo de la barra de estado.

### Google Maps JavaScript API + Places

- Carga: `@googlemaps/js-api-loader` (`Loader`).
- Mapas: `google.maps.Map`, `google.maps.Marker`, `google.maps.SymbolPath`.
- Places:
  - `google.maps.places.PlacesService` (Nearby Search, Details).
  - `google.maps.places.AutocompleteService` (predicciones) y `AutocompletePrediction`.
  - `PlaceResult` para resultados, `PlaceSearchRequest` para consultas.
- Tipos TypeScript: `@types/google.maps`.

### RxJS

- Soporte reactivo y operadores (p.ej. `debounceTime`, `switchMap`) para mejorar búsquedas; base instalada `rxjs`.

### Herramientas de build y calidad

- Angular CLI y builder: `@angular/cli`, `@angular-devkit/build-angular`.
- TypeScript: `typescript`, helpers `tslib`.
- Lint: `eslint`, `@angular-eslint/*`, `@typescript-eslint/*`, `eslint-plugin-import`, `eslint-plugin-jsdoc`, `eslint-plugin-prefer-arrow`.
- Testing: `karma`, `jasmine-core`, `@types/jasmine`, `karma-*`, `jasmine-spec-reporter`.

## Componentes/páginas principales

- `TabsPage`: contenedor de pestañas (Inicio/Búsqueda, Favoritos, Perfil).
- `Tab1Page` (Búsqueda):
  - Mapa de Google, chips de categorías, barra de búsqueda con Autocomplete.
  - Resultados desde Places Nearby Search, marcadores y lista ordenada por distancia.
  - Botón “ubicarme” que centra y recarga resultados.
- `Tab2Page`, `Tab3Page`: placeholders para futuras funcionalidades.
- `PerfilPage`: pantalla de perfil (placeholder inicial).

## Configuración de claves y entornos

- Archivos reales (ignorados por Git):
  - `src/environments/environment.ts` (dev)
  - `src/environments/environment.prod.ts` (prod)
- Archivos de ejemplo incluidos en el repo:
  - `src/environments/environment.example.ts`
  - `src/environments/environment.prod.example.ts`
- Cómo usarlos: copia los ejemplos a los reales y rellena tus API keys de Google Maps/Places.

## Scripts de NPM

- `npm start`: inicia el dev server (http://localhost:4200/).
- `npm run build`: compila para producción.
- `npm test`: ejecuta pruebas unitarias (Karma + Jasmine).

## Notas de permisos y seguridad

- Web (localhost/dominio): restringe API keys por HTTP referrer.
- Android/iOS: restringe por app id / SHA-1 (Android) y Team ID (iOS).
- No se suben claves: `.gitignore` ignora `src/environments/environment*.ts`.

## Roadmap sugerido

- Servicio `places-data.service` para encapsular caché y llamadas a Places.
- `InfoWindow`/`Modal` de detalle de lugar con fotos y horarios.
- Manejo completo de estados: permisos denegados, sin red, sin resultados, cuotas.

---

Hecho con Ionic + Angular y Google Maps/Places.
