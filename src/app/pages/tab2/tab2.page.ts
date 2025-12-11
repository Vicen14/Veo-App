import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonButton,
  IonSpinner,
  IonText,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonModal,
  IonList,
  IonItem,
  IonLabel,
  IonButtons,
  IonTitle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  timeOutline, 
  folderOpenOutline, 
  locationOutline, 
  trashOutline,
  filmOutline,
  gameControllerOutline,
  cafeOutline,
  extensionPuzzleOutline,
  optionsOutline,
  pricetagOutline,
  closeOutline,
  chevronDownOutline,
  bookmarkOutline,
  createOutline
} from 'ionicons/icons';
import { DatabaseService, Venue } from '../../services/database.service';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { Loader } from '@googlemaps/js-api-loader';
import { environment } from '../../../environments/environment';

interface VenueForm {
  name: string;
  description: string;
  address: string;
  type: string;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButton,
    IonSpinner,
    IonText,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonModal,
    IonList,
    IonItem,
    IonLabel,
    IonButtons,
    IonTitle,
  ]
})
export class Tab2Page implements OnInit, AfterViewInit {
  @ViewChild('mapEl', { static: false }) mapEl?: ElementRef<HTMLDivElement>;
  @ViewChild('addressInput', { static: false }) addressInput?: ElementRef<HTMLInputElement>;
  venues: Venue[] = [];
  loading = true;
  saving = false;
  errorMessage?: string;
  form: VenueForm = { name: '', description: '', address: '', type: '' };
  map?: google.maps.Map;
  marker?: google.maps.Marker;
  geocoder?: google.maps.Geocoder;
  autocomplete?: google.maps.places.Autocomplete;
  isTypeModalOpen = false;
  editingVenueId: number | null = null;

  categories = [
    { id: 'cinema', label: 'Cines', icon: 'film-outline' },
    { id: 'arcade', label: 'Arcades', icon: 'game-controller-outline' },
    { id: 'cyber', label: 'Cibercafés', icon: 'cafe-outline' },
    { id: 'escape', label: 'Escape', icon: 'extension-puzzle-outline' },
    { id: 'entertainment', label: 'Entretenimiento', icon: 'options-outline' },
    { id: 'other', label: 'Otros', icon: 'bookmark-outline' },
  ];

  constructor(
    private readonly database: DatabaseService,
    private readonly auth: AuthService
  ) {
    addIcons({ 
      timeOutline, 
      folderOpenOutline, 
      locationOutline, 
      trashOutline,
      filmOutline,
      gameControllerOutline,
      cafeOutline,
      extensionPuzzleOutline,
      optionsOutline,
      pricetagOutline,
      closeOutline,
      chevronDownOutline,
      bookmarkOutline,
      createOutline
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadVenues(true);
  }

  ngAfterViewInit() {
    this.initMap();
  }

  async initMap() {
    const loader = new Loader({
      apiKey: environment.googleMaps.apiKey,
      version: 'weekly',
      libraries: ['places']
    });

    try {
      await loader.load();
      this.geocoder = new google.maps.Geocoder();
      
      if (this.addressInput) {
        this.autocomplete = new google.maps.places.Autocomplete(this.addressInput.nativeElement);
        this.autocomplete.addListener('place_changed', () => {
          const place = this.autocomplete?.getPlace();
          if (place?.geometry?.location) {
            this.form.address = place.formatted_address || this.addressInput?.nativeElement.value || '';
            this.showMap(place.geometry.location);
          }
        });
      }
    } catch (e) {
      console.error('Error loading Google Maps', e);
    }
  }

  async onAddressChange() {
    if (!this.form.address || !this.geocoder) return;
    const location = await this.geocodeAddress(this.form.address);
    if (location) {
      this.showMap(location);
    }
  }

  private geocodeAddress(address: string): Promise<google.maps.LatLng | null> {
    return new Promise((resolve) => {
      this.geocoder!.geocode({ address: address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          resolve(results[0].geometry.location);
        } else {
          console.error('Geocode was not successful for the following reason: ' + status);
          resolve(null);
        }
      });
    });
  }

  showMap(location: google.maps.LatLng) {
    if (!this.mapEl) return;

    if (!this.map) {
      this.map = new google.maps.Map(this.mapEl.nativeElement, {
        center: location,
        zoom: 15,
        disableDefaultUI: true,
      });
    } else {
      this.map.setCenter(location);
    }

    if (this.marker) {
      this.marker.setMap(null);
    }

    this.marker = new google.maps.Marker({
      map: this.map,
      position: location,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: 'green',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: 'white',
      },
    });
  }

  async onSubmit(): Promise<void> {
    const name = this.form.name.trim();
    const description = this.form.description.trim();
    const address = this.form.address.trim();
    const type = this.form.type;
    
    if (!name) {
      this.errorMessage = 'Por favor ingresa un nombre.';
      return;
    }

    this.errorMessage = undefined;
    this.saving = true;
    try {
      const user = await firstValueFrom(this.auth.currentUser$);
      if (user) {
        let lat: number | undefined;
        let lng: number | undefined;

        // Si hay dirección pero no hay marcador (o no coincide), intentamos geocodificar antes de guardar
        if (address && !this.marker) {
           const location = await this.geocodeAddress(address);
           if (location) {
             this.showMap(location); // Esto actualiza this.marker
           }
        }

        if (this.marker) {
          const pos = this.marker.getPosition();
          if (pos) {
            lat = pos.lat();
            lng = pos.lng();
          }
        }

        if (this.editingVenueId) {
          await this.database.updateVenue(this.editingVenueId, name, description, address, type, lat, lng);
          this.editingVenueId = null;
        } else {
          await this.database.addVenue(user.id, name, description, address, type, lat, lng);
        }

        this.form = { name: '', description: '', address: '', type: '' };
        if (this.marker) this.marker.setMap(null); // Clear marker
        if (this.map) {
             // Reset map or hide it? Maybe just leave it.
             // Or maybe reset center.
        }
        await this.loadVenues();
      } else {
        this.errorMessage = 'Usuario no autenticado.';
      }
    } catch (error: unknown) {
      this.errorMessage = this.stringifyError(error);
    } finally {
      this.saving = false;
    }
  }

  onEdit(venue: Venue) {
    this.editingVenueId = venue.id;
    this.form = {
      name: venue.name,
      description: venue.description || '',
      address: venue.address || '',
      type: venue.type || ''
    };
    
    // Scroll to top
    document.querySelector('ion-content')?.scrollToTop(500);

    // Show on map if location exists
    if (venue.lat && venue.lng) {
      const location = new google.maps.LatLng(venue.lat, venue.lng);
      this.showMap(location);
    }
  }

  cancelEdit() {
    this.editingVenueId = null;
    this.form = { name: '', description: '', address: '', type: '' };
    if (this.marker) this.marker.setMap(null);
  }

  async onClear(): Promise<void> {
    this.errorMessage = undefined;
    try {
      const user = await firstValueFrom(this.auth.currentUser$);
      if (user) {
        await this.database.clearVenues(user.id);
        await this.loadVenues();
      }
    } catch (error: unknown) {
      this.errorMessage = this.stringifyError(error);
    }
  }

  private async loadVenues(initial = false): Promise<void> {
    if (initial) {
      this.loading = true;
    }
    this.errorMessage = undefined;
    try {
      await this.database.initialize();
      const user = await firstValueFrom(this.auth.currentUser$);
      if (user) {
        this.venues = await this.database.getVenues(user.id);
      } else {
        this.venues = [];
      }
    } catch (error: unknown) {
      this.errorMessage = this.stringifyError(error);
    } finally {
      if (initial) {
        this.loading = false;
      }
    }
  }



  getCategoryLabel(id?: string): string {
    if (!id) return '';
    const category = this.categories.find(c => c.id === id);
    return category ? category.label : id;
  }

  getCategoryIcon(id?: string): string {
    if (!id) return 'pricetag-outline';
    const category = this.categories.find(c => c.id === id);
    return category ? category.icon : 'pricetag-outline';
  }

  openTypeModal() {
    this.isTypeModalOpen = true;
  }

  closeTypeModal() {
    this.isTypeModalOpen = false;
  }

  selectType(id: string) {
    this.form.type = id;
    this.closeTypeModal();
  }

  async onDelete(id: number): Promise<void> {
    try {
      await this.database.deleteVenue(id);
      await this.loadVenues();
    } catch (error: unknown) {
      this.errorMessage = this.stringifyError(error);
    }
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Ocurrió un error inesperado.';
  }
}
