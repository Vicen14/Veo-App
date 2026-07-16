# Veo-App

Aplicación híbrida Ionic + Angular para descubrir lugares de entretenimiento cercanos (cines, arcades, cibercafés, escape rooms, centros de entretenimiento) usando Google Maps y Places. Para el ramo de programación de aplicaciones móviles de Duoc UC campus virtual.

## Stack y librerías

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
- `Tab2Page` (Base de Datos / API Demo):
  - Formulario para guardar "Venues" localmente (SQLite/Preferences).
  - Demo de consumo de API REST (JSONPlaceholder) con manejo de errores y caché offline.
- `Tab3Page` (Favoritos):
  - Lista de lugares guardados como favoritos.
- `PerfilPage`: pantalla de perfil protegida por `AuthGuard`.

## Servicios Implementados

- `ApiService`: Cliente HTTP genérico con caché automática y fallback offline.
- `StorageService`: Wrapper de persistencia usando Capacitor Preferences (compatible con SQLite en plugins nativos).
- `DatabaseService`: Gestión de datos de usuario, favoritos y venues.
- `AuthService`: Manejo de sesión (login/logout) y estado de autenticación.
- `GeolocationService`: Wrapper para el plugin nativo de geolocalización.
- `AuthGuard`: Protege rutas (como Perfil) requiriendo autenticación previa.

## Configuración de claves y entornos

- Archivos reales (ignorados por Git):
  - `src/environments/environment.ts` (dev)
  - `src/environments/environment.prod.ts` (prod)
- Archivos de ejemplo incluidos:
  - `src/environments/environment.example.ts`
  - `src/environments/environment.prod.example.ts`
- Ahora se usa UNA sola clave (`googleMaps.apiKey`) habilitada para Maps JavaScript API y Places.
- Pasos:
  1. Copia los archivos example a sus nombres reales si no existen.
  2. Rellena `YOUR_GOOGLE_API_KEY` con tu clave restringida.
  3. Nunca subas los archivos reales (están en `.gitignore`).
- Recomendado: restringe la key por referrer (web) y por app id / firma (móvil), y limita solo a las APIs requeridas.

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

## Instalación y Ejecución

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Configurar entornos (ver sección Configuración de claves).
3. Ejecutar en navegador:
   ```bash
   ionic serve
   ```
4. Para probar persistencia y plugins nativos en dispositivo:
   ```bash
   ionic cap run android
   # o
   ionic cap run ios
   ```

---

Hecho con Ionic + Angular y Google Maps/Places.
