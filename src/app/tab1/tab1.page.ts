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
// Loader para cargar Google Maps JavaScript API con librería de Places
import { Loader } from '@googlemaps/js-api-loader';
// Entornos: claves de API se leen desde environment.ts (ignoradas en git)
import { environment } from '../../environments/environment';
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
  // Estado de Autocomplete (predicciones y token)
  predictions: google.maps.places.AutocompletePrediction[] = [];
  private acService?: google.maps.places.AutocompleteService;
  private acToken?: google.maps.places.AutocompleteSessionToken;

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
      libraries: ['places'],
    });

    await loader.load();
    if (!this.mapEl) return;
  this.acService = new google.maps.places.AutocompleteService();
  this.acToken = new google.maps.places.AutocompleteSessionToken();
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
    const svc = new google.maps.places.PlacesService(this.map);

    const queries = this.buildQueries(this.selectedCategory);

    const runQuery = (q: { type?: string; keyword?: string }) =>
      new Promise<google.maps.places.PlaceResult[]>((resolve) => {
        const req: google.maps.places.PlaceSearchRequest = {
          location: this.center,
          radius: 3000,
          type: q.type as any,
          keyword: q.keyword,
          openNow: false,
        };
        svc.nearbySearch(req, (results, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !results) return resolve([]);
          resolve(results);
        });
      });

    const batches = await Promise.all(queries.map(runQuery));
    const merged: google.maps.places.PlaceResult[] = ([] as google.maps.places.PlaceResult[]).concat(...batches);
    const seen = new Set<string>();
    const dedup = merged.filter((r: google.maps.places.PlaceResult) => {
      const id = r.place_id!;
      if (seen.has(id)) return false;
      seen.add(id); return true;
    });

    this.results = dedup.map((r: google.maps.places.PlaceResult) => {
      const loc = { lat: r.geometry?.location?.lat() ?? 0, lng: r.geometry?.location?.lng() ?? 0 };
      return {
        id: r.place_id!,
        name: r.name,
        rating: r.rating,
        address: r.vicinity,
        openNow: r.opening_hours?.isOpen?.() ?? undefined,
        location: loc,
        distanceKm: this.distanceKm(this.center, loc),
      };
    }).sort((a: any, b: any) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

    this.isLoading = false;
    this.foundCount = this.results.length;
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
    if (!this.acService) return;
    this.acService.getPlacePredictions({
      input: value,
      sessionToken: this.acToken,
      types: ['establishment'],
      locationBias: this.center,
    }, (preds) => {
      this.predictions = preds ?? [];
    });
  }

  // Al seleccionar una predicción: centra el mapa en el lugar y busca de nuevo
  onSelectPrediction(p: google.maps.places.AutocompletePrediction) {
    if (!this.map) return;
    const svc = new google.maps.places.PlacesService(this.map);
    svc.getDetails({ placeId: p.place_id, fields: ['geometry', 'name', 'place_id'] }, (place, status) => {
      this.predictions = [];
      if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) return;
      this.center = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
      this.map!.setCenter(this.center);
      // Reset session token for billing grouping
      this.acToken = new google.maps.places.AutocompleteSessionToken();
      this.searchNearby();
    });
  }
}
