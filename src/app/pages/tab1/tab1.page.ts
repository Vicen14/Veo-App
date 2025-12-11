// página de búsqueda: tiene mapa, filtros y búsquedas con google places
import { Component, ElementRef, ViewChild, AfterViewInit, ViewChildren, QueryList } from '@angular/core';
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
  IonModal,
  IonButtons,
  IonTitle,
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
  heart,
  heartOutline,
  closeOutline,
  personOutline,
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
// loader para cargar google maps javascript api (el places lo usaremos vía http con su propia key)
import { Loader } from '@googlemaps/js-api-loader';
// entornos: claves de api se leen desde environment.ts (ignoradas en git)
import { environment } from '../../../environments/environment';
// geolocalización del dispositivo/navegador con capacitor
import { GeolocationService } from '../../services/geolocation.service';
import { AuthService } from '../../services/auth.service';
import { DatabaseService } from '../../services/database.service';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';

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
    IonModal,
    IonButtons,
    IonTitle,
  ],
})
export class Tab1Page implements AfterViewInit {
  @ViewChild('mapEl', { static: false }) mapEl?: ElementRef<HTMLDivElement>;
  @ViewChildren('placeCard') placeCards?: QueryList<ElementRef>;
  map?: google.maps.Map;
  infoWindow?: google.maps.InfoWindow;
  googleMarkers: google.maps.Marker[] = [];
  userMarkers: google.maps.Marker[] = [];
  // estado de ui: categorías de filtros
  categories = [
    { id: 'all', label: 'Todos', icon: 'options-outline' },
    { id: 'my-places', label: 'Mis Lugares', icon: 'person-outline' },
    { id: 'cinema', label: 'Cines', icon: 'film-outline' },
    { id: 'arcade', label: 'Arcades', icon: 'game-controller-outline' },
    { id: 'cyber', label: 'Cibercafés', icon: 'cafe-outline' },
    { id: 'escape', label: 'Escape', icon: 'extension-puzzle-outline' },
    { id: 'entertainment', label: 'Entretenimiento', icon: 'options-outline' },
  ];
  selectedCategory: string = 'all';

  // centro por defecto (concon) si no se obtiene ubicación
  center: google.maps.LatLngLiteral = { lat: -32.9167, lng: -71.5167 };
  activeMarker: number | null = null;
  foundCount = 0;

  // resultados y placeholders de carga
  isLoading = false;
  results: any[] = [];
  skeletons = Array.from({ length: 3 });
  // estado de autocompletar (predicciones de places http)
  predictions: { placeId: string; description: string }[] = [];
  // estado de imágenes (carga / error por indice)
  imageLoading: boolean[] = [];
  imageError: boolean[] = [];
  fallbackImg = 'assets/icon/favicon.png';
  favoritesSet = new Set<string>();

  // estado del modal
  isModalOpen = false;
  selectedPlace: any = null;

  constructor(
    private auth: AuthService, 
    private db: DatabaseService, 
    private geo: GeolocationService,
    private api: ApiService
  ) {
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
      heart,
      heartOutline,
      closeOutline,
      personOutline,
    });
  }

  // inicializa mapas/places, intenta centrar en el usuario y realiza la primera búsqueda
  async ngAfterViewInit() {
    const loader = new Loader({
      apiKey: environment.googleMaps.apiKey,
      version: 'weekly',
      libraries: ['places'],
    });

    await loader.load();
    if (!this.mapEl) return;
    this.map = new google.maps.Map(this.mapEl.nativeElement, {
      center: this.center,
      zoom: 13,
      disableDefaultUI: true,
      mapId: undefined,
    });

    this.infoWindow = new google.maps.InfoWindow({
      disableAutoPan: true, // evita que el mapa se mueva solo al abrir el popup
    });

    await this.centerOnUserIfPossible();
    await this.searchNearby();
    await this.loadUserVenues();
  }

  ionViewWillEnter() {
    this.loadUserVenues();
  }

  async loadUserVenues() {
    console.log('loadUserVenues called');
    // Limpiar marcadores anteriores
    this.userMarkers.forEach(marker => marker.setMap(null));
    this.userMarkers = [];

    if (!this.map) {
      console.log('Map not initialized yet, skipping loadUserVenues');
      return;
    }

    try {
      const user = await firstValueFrom(this.auth.currentUser$);
      if (user) {
        const venues = await this.db.getVenues(user.id);
        console.log('Venues loaded:', venues);
        venues.forEach(venue => {
          // Filter out 'other' type venues unless we are in 'my-places' mode
          if (venue.type === 'other' && this.selectedCategory !== 'my-places') {
            return;
          }

          console.log('Processing venue:', venue);
          if (venue.lat && venue.lng) {
            console.log('Adding marker for venue:', venue.name, venue.lat, venue.lng);
            const marker = new google.maps.Marker({
              position: { lat: venue.lat, lng: venue.lng },
              map: this.map,
              title: venue.name,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: 'green',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: 'white',
              },
            });

            marker.addListener('click', () => {
              this.infoWindow?.setContent(`
                <div style="padding: 8px;">
                  <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 600;">${venue.name}</h3>
                  <p style="margin: 0; font-size: 14px; color: #666;">${venue.description || ''}</p>
                  <p style="margin: 4px 0 0; font-size: 12px; color: #888;">${venue.address || ''}</p>
                </div>
              `);
              this.infoWindow?.open(this.map, marker);
            });

            this.userMarkers.push(marker);
          } else {
            console.warn('Venue missing lat/lng:', venue);
          }
        });
      }
    } catch (e) {
      console.error('Error loading user venues', e);
    }
  }

  // cambia de categoría y vuelve a buscar
  selectCategory(id: string) {
    if (this.selectedCategory === id) return;
    this.selectedCategory = id;
    this.results = [];
    
    // Clear user markers so they are reloaded with correct filtering
    this.userMarkers.forEach(m => m.setMap(null));
    this.userMarkers = [];
    
    this.searchNearby();
  }

  // realza el marcador clicado en el mapa
  onMarkerClick(index: number) {
    this.activeMarker = index;
    const m = this.googleMarkers[index];
    const r = this.results[index];
    
    if (m && this.map) {
      m.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => m.setAnimation(null), 700);
      
      // centrar mapa en el marcador
      this.map.panTo(m.getPosition()!);
    }

    // abrir modal con detalles
    this.selectedPlace = r;
    this.isModalOpen = true;
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    if (!isOpen) {
      this.selectedPlace = null;
    }
  }

  // intenta obtener la ubicación actual; en web dispara el prompt del navegador
  private async centerOnUserIfPossible() {
    try {
      // llama directamente a getcurrentposition: en web esto activará el prompt del navegador
      const position = await this.geo.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
      this.center = { lat: position.coords.latitude, lng: position.coords.longitude };
      this.map?.setCenter(this.center);
    } catch (e) {
      // si se deniega o no está disponible, mantener el centro predeterminado; opcionalmente mostrar un mensaje de ui más tarde
      console.warn('Geolocation not available or denied', e);
    }
  }

  // ejecuta nearby search segun la categoria seleccionada y ordena por distancia
  private async searchNearby() {
    if (!this.map) return;
    this.isLoading = true;
    
    try {
      await this.loadFavorites();

      if (this.selectedCategory === 'my-places') {
        this.userMarkers.forEach(m => m.setMap(null));
        this.userMarkers = [];

        const user = await firstValueFrom(this.auth.currentUser$);
        if (user) {
          const venues = await this.db.getVenues(user.id);
          this.results = venues.map((v: any) => ({
            id: v.id,
            name: v.name,
            rating: null,
            userRatingCount: null,
            address: v.address,
            description: v.description,
            photoUrl: v.image || null,
            photoUrls: v.image ? [v.image] : [],
            openNow: null,
            location: { lat: v.lat, lng: v.lng },
            distanceKm: v.lat && v.lng ? this.distanceKm(this.center, { lat: v.lat, lng: v.lng }) : 0,
            isFavorite: false,
            types: ['user_place']
          })).sort((a: any, b: any) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
        } else {
          this.results = [];
        }
        
        this.foundCount = this.results.length;
        this.imageLoading = this.results.map(() => true);
        this.imageError = this.results.map(() => false);
        this.renderMarkers();
        this.isLoading = false;
        return;
      }

      if (this.userMarkers.length === 0) {
        this.loadUserVenues();
      }

      const queries = this.buildQueries(this.selectedCategory);

      const runQuery = async (q: { type?: string; keyword?: string }) => {
        if (q.type) {
          return await firstValueFrom(this.api.searchNearbyByType(this.center.lat, this.center.lng, 5000, q.type));
        }
        if (q.keyword) {
          return await firstValueFrom(this.api.searchByText(this.center.lat, this.center.lng, 5000, q.keyword));
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
        const photoUrl = firstPhoto ? this.api.getPhotoUrl(firstPhoto.name) : null;
        const photoUrls = r.photos?.map((p: any) => this.api.getPhotoUrl(p.name)).filter((u: string | null) => u !== null) ?? [];

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
          photoUrls,
          openNow: r.currentOpeningHours?.openNow,
          location: loc,
          distanceKm: this.distanceKm(this.center, loc),
          isFavorite: this.favoritesSet.has(r.id as string),
          types: r.types,
        };
      }).sort((a: any, b: any) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

      this.foundCount = this.results.length;
      // inicializa estados de carga de imágenes
      this.imageLoading = this.results.map(() => true);
      this.imageError = this.results.map(() => false);
      this.renderMarkers();
    } catch (error) {
      console.error('Error in searchNearby:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // dibuja marcadores en el mapa y agrega listeners de click
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

  // limpia los marcadores actuales del mapa
  private clearMarkers() {
    this.googleMarkers.forEach(m => m.setMap(null));
    this.googleMarkers = [];
  }

  // traduce una categoría a una query de places (type o keyword)
  private buildQueryFromCategory(id: string) {
    switch (id) {
      case 'cinema':
        return { type: 'movie_theater' };
      case 'cyber':
        return { type: 'internet_cafe' };
      case 'arcade':
        return { type: 'amusement_center' };
      case 'escape':
        return { keyword: 'escape room' };
      case 'entertainment':
        return { keyword: 'centro de entretenimiento' };
      default:
        return { keyword: 'lugar de entretenimiento' };
    }
  }

  // construye 1 o n queries (si es "todos") para places nearby search
  private buildQueries(id: string) {
    if (id !== 'all') return [this.buildQueryFromCategory(id)];
    // combina los 5 tipos/keywords solicitados
    return [
      { type: 'movie_theater' },
      { type: 'internet_cafe' },
      { type: 'amusement_center' },
      { keyword: 'escape room' },
      { keyword: 'centro de entretenimiento' },
    ];
  }

  // distancia haversine aproximada en km
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

  // acción para "ver todo" (reservado para futuras vistas de lista completa)
  onSeeAll() {
    
    console.log('Ver todo clicado');
  }

  // botón "ubicarme": anima, centra y re-ejecuta búsqueda
  async onLocateClick(ev: Event) {
    const btn = ev.currentTarget as HTMLElement | null;
    if (!btn) return;
    btn.classList.add('spin');
    setTimeout(() => btn.classList.remove('spin'), 600);
    await this.centerOnUserIfPossible();
    await this.searchNearby();
  }

  // refresher: fuerza nueva búsqueda (y opcionalmente obtiene de nuevo la ubicación)
  async onRefresh(ev: CustomEvent) {
    try {
      await this.centerOnUserIfPossible();
      await this.searchNearby();
    } finally {
      (ev.target as HTMLIonRefresherElement)?.complete();
    }
  }

  async loadFavorites() {
    try {
      const user = this.auth.currentUserValue;
      if (user) {
        const favs = await this.db.getFavorites(user.id);
        this.favoritesSet = new Set(favs.map(f => f.placeId));
      } else {
        this.favoritesSet.clear();
      }
    } catch (e) {
      console.error('Error loading favorites', e);
      this.favoritesSet.clear();
    }
  }

  async toggleFavorite(event: Event, place: any) {
    event.stopPropagation();
    const user = this.auth.currentUserValue;
    if (!user) {
      alert('Debes iniciar sesión para guardar favoritos');
      return;
    }

    if (place.isFavorite) {
      await this.db.removeFavorite(user.id, place.id);
      place.isFavorite = false;
      this.favoritesSet.delete(place.id);
    } else {
      await this.db.addFavorite(user.id, {
        id: place.id,
        name: place.name,
        address: place.address,
        photoUrl: place.photoUrl,
        rating: place.rating
      });
      place.isFavorite = true;
      this.favoritesSet.add(place.id);
    }
  }

  // eventos de imagen para manejar skeleton y fallback
  onImgLoad(index: number) { this.imageLoading[index] = false; }
  onImgError(index: number) {
    this.imageLoading[index] = false;
    this.imageError[index] = true;
    // podría intentarse reintentar con menor resolución si se quisiera
  }

  // maneja el input de búsqueda y pide predicciones a autocomplete
  onSearchInput(ev: CustomEvent) {
    const value = (ev as any).detail?.value?.trim();
    if (!value) { this.predictions = []; return; }
    firstValueFrom(this.api.getAutocomplete(value, this.center.lat, this.center.lng, 5000))
      .then((preds) => this.predictions = preds)
      .catch(() => this.predictions = []);
  }

  // al seleccionar una predicción: centra el mapa en el lugar y busca de nuevo
  onSelectPrediction(p: { placeId: string; description: string }) {
    if (!this.map) return;
    this.predictions = [];
    firstValueFrom(this.api.getPlaceDetails(p.placeId)).then((loc) => {
      if (!loc) return;
      this.center = loc;
      this.map!.setCenter(this.center);
      this.searchNearby();
    });
  }
}
