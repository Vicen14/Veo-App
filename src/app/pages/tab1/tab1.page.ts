// Página de Búsqueda (Tab1): integra mapa, filtros y búsquedas con Google Places
import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonSearchbar,
  IonButton,
  IonIcon,
  IonChip,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  navigateOutline,
  optionsOutline,
  filmOutline,
  gameControllerOutline,
  cafeOutline,
  extensionPuzzleOutline,
  locationOutline,
  star,
  timeOutline,
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
// Loader para cargar Google Maps JavaScript API (el Places lo usaremos vía HTTP con su propia key)
import { Loader } from '@googlemaps/js-api-loader';
// Entornos: claves de API se leen desde environment.ts (ignoradas en git)
import { environment } from '../../../environments/environment';
// Geolocalización del dispositivo/navegador con Capacitor
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonSearchbar,
    IonButton,
    IonIcon,
    IonChip,
      IonLabel,
      IonRefresher,
      IonRefresherContent,
  ],
})
export class Tab1Page implements AfterViewInit {
  @ViewChild('mapEl', { static: false }) mapEl?: ElementRef<HTMLDivElement>;
  map?: google.maps.Map;
  googleMarkers: google.maps.Marker[] = [];
  // Estado de UI: categorías de filtros
  categories = [
    { id: 'all', label: 'Todos', icon: 'options-outline' },
    { id: 'cinema', label: 'Cines', icon: 'film-outline' },
    { id: 'arcade', label: 'Arcades', icon: 'game-controller-outline' },
    { id: 'cyber', label: 'Cibercafés', icon: 'cafe-outline' },
    { id: 'escape', label: 'Escape', icon: 'extension-puzzle-outline' },
    { id: 'entertainment', label: 'Entretenimiento', icon: 'options-outline' },
  ];
  selectedCategory: string = 'cinema';

  // Centro por defecto (CDMX) si no se obtiene ubicación
  center: google.maps.LatLngLiteral = { lat: 19.4326, lng: -99.1332 };
  activeMarker: number | null = null;
  foundCount = 0;

  // Resultados y placeholders de carga
  isLoading = false;
  results: any[] = [];
  skeletons = Array.from({ length: 3 });
  // Estado de Autocomplete (predicciones de Places HTTP)
  predictions: { placeId: string; description: string }[] = [];
  // Estado de imágenes (carga / error por índice)
  imageLoading: boolean[] = [];
  imageError: boolean[] = [];
  fallbackImg = 'assets/icon/icon.png';

  constructor() {
    addIcons({
      navigateOutline,
      optionsOutline,
      filmOutline,
      gameControllerOutline,
      cafeOutline,
      extensionPuzzleOutline,
      locationOutline,
      star,
      timeOutline,
    });
  }

  // Inicializa mapas/places, intenta centrar en el usuario y realiza la primera búsqueda
  async ngAfterViewInit() {
    const loader = new Loader({
      apiKey: environment.googleMaps.apiKey,
      version: 'weekly',
      // No cargamos 'places' porque usaremos la API HTTP con otra key
      libraries: [],
    });

    await loader.load();
    if (!this.mapEl) return;
    this.map = new google.maps.Map(this.mapEl.nativeElement, {
      center: this.center,
      zoom: 13,
      disableDefaultUI: true,
      mapId: undefined,
    });

    await this.centerOnUserIfPossible();
    await this.searchNearby();
  }

  // Cambia de categoría y vuelve a buscar
  selectCategory(id: string) {
    if (this.selectedCategory === id) return;
    this.selectedCategory = id;
    this.animateSearch();
    this.searchNearby();
  }

  // Realza el marcador clicado en el mapa
  onMarkerClick(index: number) {
    this.activeMarker = index;
    const m = this.googleMarkers[index];
    if (!m) return;
    m.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(() => m.setAnimation(null), 700);
  }

  // Intenta obtener la ubicación actual; en web dispara el prompt del navegador
  private async centerOnUserIfPossible() {
    try {
      // Directly call getCurrentPosition: on web this will trigger the browser prompt
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
      this.center = { lat: position.coords.latitude, lng: position.coords.longitude };
      this.map?.setCenter(this.center);
    } catch (e) {
      // If denied or unavailable, keep default center; optionally surface a UI message later
      console.warn('Geolocation not available or denied', e);
    }
  }

  // Ejecuta Nearby Search según la categoría seleccionada y deduplica/ordena por distancia
  private async searchNearby() {
    if (!this.map) return;
    this.isLoading = true;
    const queries = this.buildQueries(this.selectedCategory);

    const runQuery = async (q: { type?: string; keyword?: string }) => {
      if (q.type) {
        return await this.placesSearchNearbyByType(q.type);
      }
      if (q.keyword) {
        return await this.placesSearchText(q.keyword);
      }
      return [] as any[];
    };

    const batches = await Promise.all(queries.map(runQuery));
    const merged: any[] = ([] as any[]).concat(...batches);
    const seen = new Set<string>();
    const dedup = merged.filter((r: any) => {
      const id = r.id as string;
      if (seen.has(id)) return false;
      seen.add(id); return true;
    });

    this.results = dedup.map((r: any) => {
      const loc = { lat: r.location?.latitude ?? 0, lng: r.location?.longitude ?? 0 };
      const firstPhoto = r.photos?.[0];
      const photoUrl = firstPhoto ? this.buildPhotoUrl(firstPhoto) : null;
      const description = r.editorialSummary?.text
        ?? r.primaryTypeDisplayName?.text
        ?? r.formattedAddress
        ?? (Array.isArray(r.types) ? r.types.slice(0, 3).join(', ') : '');
      return {
        id: r.id as string,
        name: r.displayName?.text ?? r.displayName ?? 'Lugar',
        rating: r.rating,
        userRatingCount: r.userRatingCount,
        address: r.formattedAddress,
        description,
        photoUrl,
        openNow: r.currentOpeningHours?.openNow,
        location: loc,
        distanceKm: this.distanceKm(this.center, loc),
      };
    }).sort((a: any, b: any) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

    this.isLoading = false;
    this.foundCount = this.results.length;
    // Inicializa estados de carga de imágenes
    this.imageLoading = this.results.map(() => true);
    this.imageError = this.results.map(() => false);
    this.renderMarkers();
  }

  // Dibuja marcadores en el mapa y agrega listeners de click
  private renderMarkers() {
    this.clearMarkers();
    this.googleMarkers = this.results.map((r, i) => new google.maps.Marker({
      position: r.location,
      map: this.map!,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: '#48426D',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#ffffff',
      },
    }))
    this.googleMarkers.forEach((m, i) => m.addListener('click', () => this.onMarkerClick(i)));
  }

  // Limpia los marcadores actuales del mapa
  private clearMarkers() {
    this.googleMarkers.forEach(m => m.setMap(null));
    this.googleMarkers = [];
  }

  // Traduce una categoría a una query de Places (type o keyword)
  private buildQueryFromCategory(id: string) {
    switch (id) {
      case 'cinema':
        return { type: 'movie_theater', keyword: undefined as string | undefined };
      case 'cyber':
        return { type: 'internet_cafe', keyword: undefined };
      case 'arcade':
        // Arcades no siempre tienen tipo dedicado, afinamos por keyword
        return { type: undefined, keyword: 'arcade' };
      case 'escape':
        // No existe type oficial, usamos keyword
        return { type: undefined, keyword: 'escape room' };
      case 'entertainment':
        // Lugares de entretenimiento en general (usamos keyword representativa)
        return { type: undefined, keyword: 'entertainment center' };
      default:
        // No default amplio: usa mismo criterio que entretenimiento para evitar “traer todo”
        return { type: undefined, keyword: 'entertainment center' };
    }
  }

  // Construye 1 o N queries (si es "Todos") para Places Nearby Search
  private buildQueries(id: string) {
    if (id !== 'all') return [this.buildQueryFromCategory(id)];
    // Combina los 5 tipos/keywords solicitados
    return [
      { type: 'movie_theater' },
      { type: 'internet_cafe' },
      { keyword: 'arcade' },
      { keyword: 'escape room' },
      { keyword: 'entertainment center' },
    ];
  }

  // Distancia Haversine aproximada en km
  private distanceKm(a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral) {
    const R = 6371; // km
    const dLat = this.toRad(b.lat - a.lat);
    const dLon = this.toRad(b.lng - a.lng);
    const lat1 = this.toRad(a.lat);
    const lat2 = this.toRad(b.lat);
    const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    return R * 2 * Math.asin(Math.sqrt(h));
  }

  private toRad(v: number) { return v * Math.PI / 180; }

  // Acción para "Ver todo" (reservado para futuras vistas de lista completa)
  onSeeAll() {
    
    console.log('Ver todo clicado');
  }

  // Botón "ubicarme": anima, centra y re-ejecuta búsqueda
  async onLocateClick(ev: Event) {
    const btn = ev.currentTarget as HTMLElement | null;
    if (!btn) return;
    btn.classList.add('spin');
    setTimeout(() => btn.classList.remove('spin'), 600);
    await this.centerOnUserIfPossible();
    await this.searchNearby();
  }

  // Refresher: fuerza nueva búsqueda (y opcionalmente obtiene de nuevo la ubicación)
  async onRefresh(ev: CustomEvent) {
    try {
      await this.centerOnUserIfPossible();
      await this.searchNearby();
    } finally {
      (ev.target as HTMLIonRefresherElement)?.complete();
    }
  }

  // Eventos de imagen para manejar skeleton y fallback
  onImgLoad(index: number) { this.imageLoading[index] = false; }
  onImgError(index: number) {
    this.imageLoading[index] = false;
    this.imageError[index] = true;
    // Podría intentarse reintentar con menor resolución si se quisiera
  }

  // Pequeña animación de carga al cambiar de categoría
  private animateSearch() {
    // Simulate a short loading to trigger skeletons
    this.isLoading = true;
    this.results = [];
    setTimeout(() => {
      this.isLoading = false;
      // keep results empty until APIs are wired
    }, 800);
  }

  // Maneja el input de búsqueda y pide predicciones a Autocomplete
  onSearchInput(ev: CustomEvent) {
    const value = (ev as any).detail?.value?.trim();
    if (!value) { this.predictions = []; return; }
    this.fetchAutocomplete(value).then((preds) => this.predictions = preds).catch(() => this.predictions = []);
  }

  // Al seleccionar una predicción: centra el mapa en el lugar y busca de nuevo
  onSelectPrediction(p: { placeId: string; description: string }) {
    if (!this.map) return;
    this.predictions = [];
    this.fetchPlaceDetails(p.placeId).then((loc) => {
      if (!loc) return;
      this.center = loc;
      this.map!.setCenter(this.center);
      this.searchNearby();
    });
  }

  // ===========================
  // Integraciones con Places API (HTTP) usando environment.googlePlaces.apiKey
  // ===========================

  private get placesHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': environment.googlePlaces.apiKey,
    } as Record<string, string>;
  }

  private async placesSearchNearbyByType(type: string) {
    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    const body = {
      languageCode: 'es',
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: this.center.lat, longitude: this.center.lng },
          radius: 3000,
        }
      },
      includedTypes: [type],
    };
    const headers = { ...this.placesHeaders, 'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.location,places.currentOpeningHours.openNow,places.photos,places.editorialSummary,places.primaryTypeDisplayName,places.types' };
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.places ?? []) as any[];
  }

  private async placesSearchText(keyword: string) {
    const url = 'https://places.googleapis.com/v1/places:searchText';
    const body = {
      textQuery: keyword,
      languageCode: 'es',
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: { latitude: this.center.lat, longitude: this.center.lng },
          radius: 3000,
        }
      },
    };
    const headers = { ...this.placesHeaders, 'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.location,places.currentOpeningHours.openNow,places.photos,places.editorialSummary,places.primaryTypeDisplayName,places.types' };
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.places ?? []) as any[];
  }

  private async fetchAutocomplete(input: string) {
    const url = 'https://places.googleapis.com/v1/places:autocomplete';
    const body = {
      input,
      languageCode: 'es',
      locationBias: {
        circle: {
          center: { latitude: this.center.lat, longitude: this.center.lng },
          radius: 5000,
        }
      },
      includedPrimaryTypes: ['establishment'],
    } as any;
    const headers = { ...this.placesHeaders, 'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text' };
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) return [] as { placeId: string; description: string }[];
    const data = await res.json();
    const suggestions = (data.suggestions ?? []) as any[];
    return suggestions
      .map((s) => s.placePrediction)
      .filter(Boolean)
      .map((p: any) => ({ placeId: p.placeId as string, description: (p.text?.text ?? '') as string }));
  }

  private async fetchPlaceDetails(placeId: string) {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const headers = { ...this.placesHeaders, 'X-Goog-FieldMask': 'id,displayName,location' };
    const res = await fetch(url, { headers });
    if (!res.ok) return null as google.maps.LatLngLiteral | null;
    const data = await res.json();
    const lat = data.location?.latitude;
    const lng = data.location?.longitude;
    if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng } as google.maps.LatLngLiteral;
    return null;
  }

  // Construye URL pública de la foto (Places API v1 media endpoint)
  private buildPhotoUrl(photo: any) {
    const name = photo?.name; // Ej: "places/XYZ/photos/ABC"
    if (!name) return null;
    const maxDim = 400; // tamaño razonable para tarjeta
    // Se puede usar header X-Goog-Api-Key pero para <img> es más simple el query param key
    return `https://places.googleapis.com/v1/${encodeURIComponent(name)}/media?maxWidthPx=${maxDim}&maxHeightPx=${maxDim}&key=${environment.googlePlaces.apiKey}`;
  }
}
