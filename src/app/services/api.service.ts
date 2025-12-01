import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { environment } from '../../environments/environment';

/**
 * apiservice: centraliza todas las comunicaciones externas.
 * - gestiona llamadas a google places api.
 * - mantiene la lógica de caché y manejo de errores.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private jsonPlaceholderBase = 'https://jsonplaceholder.typicode.com';
  private placesBase = 'https://places.googleapis.com/v1/places';

  constructor(private http: HttpClient, private storage: StorageService) {}

  // --- helpers ---

  private cacheKey(url: string) {
    return encodeURIComponent(url);
  }

  private get placesHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': environment.googlePlaces.apiKey,
    });
  }

  // --- métodos genéricos (ejemplo) ---

  get<T>(path: string, useCache = true): Observable<T> {
    const url = path.startsWith('http') ? path : `${this.jsonPlaceholderBase}${path}`;
    const key = this.cacheKey(url);

    return this.http.get<T>(url).pipe(
      tap(async (res) => {
        try {
          await this.storage.set<T>(key, res);
        } catch (e) {
          console.warn('Storage set error', e);
        }
      }),
      catchError((err) => {
        console.warn('HTTP error fetching', url, err);
        return from(this.storage.get<T>(key)).pipe(
          switchMap((cached) => {
            if (cached !== null) return of(cached as T);
            throw err;
          })
        );
      })
    );
  }

  // --- google places api ---

  /**
   * busca lugares cercanos por tipo.
   */
  searchNearbyByType(lat: number, lng: number, radius: number, type: string): Observable<any[]> {
    const url = `${this.placesBase}:searchNearby`;
    const body = {
      languageCode: 'es',
      maxResultCount: 20,
      rankPreference: 'DISTANCE',
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng }
        }
      },
      includedTypes: [type],
    };
    
    // definimos los campos que queremos recibir (fieldmask)
    const headers = this.placesHeaders.set(
      'X-Goog-FieldMask', 
      'places.id,places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.location,places.currentOpeningHours.openNow,places.photos,places.editorialSummary,places.primaryTypeDisplayName,places.types'
    );

    return this.http.post<any>(url, body, { headers }).pipe(
      map(response => response.places ?? []),
      catchError(err => {
        console.error('Error en searchNearbyByType', err);
        return of([]);
      })
    );
  }

  /**
   * busca lugares por texto libre (keyword).
   */
  searchByText(lat: number, lng: number, radius: number, keyword: string): Observable<any[]> {
    const url = `${this.placesBase}:searchText`;
    const body = {
      textQuery: keyword,
      languageCode: 'es',
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radius,
        }
      },
    };

    const headers = this.placesHeaders.set(
      'X-Goog-FieldMask', 
      'places.id,places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.location,places.currentOpeningHours.openNow,places.photos,places.editorialSummary,places.primaryTypeDisplayName,places.types'
    );

    return this.http.post<any>(url, body, { headers }).pipe(
      map(response => response.places ?? []),
      catchError(err => {
        console.error('Error en searchByText', err);
        return of([]);
      })
    );
  }

  /**
   * autocompletado de lugares.
   */
  getAutocomplete(input: string, lat: number, lng: number, radius: number): Observable<{ placeId: string; description: string }[]> {
    const url = `${this.placesBase}:autocomplete`;
    const body = {
      input,
      languageCode: 'es',
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radius,
        }
      },
      includedPrimaryTypes: ['establishment'],
    };

    const headers = this.placesHeaders.set(
      'X-Goog-FieldMask', 
      'suggestions.placePrediction.placeId,suggestions.placePrediction.text'
    );

    return this.http.post<any>(url, body, { headers }).pipe(
      map(response => {
        const suggestions = response.suggestions ?? [];
        return suggestions
          .map((s: any) => s.placePrediction)
          .filter(Boolean)
          .map((p: any) => ({ 
            placeId: p.placeId as string, 
            description: (p.text?.text ?? '') as string 
          }));
      }),
      catchError(err => {
        console.error('Error en getAutocomplete', err);
        return of([]);
      })
    );
  }

  /**
   * obtiene detalles de un lugar específico (coordenadas).
   */
  getPlaceDetails(placeId: string): Observable<google.maps.LatLngLiteral | null> {
    const url = `${this.placesBase}/${encodeURIComponent(placeId)}`;
    const headers = this.placesHeaders.set('X-Goog-FieldMask', 'location');

    return this.http.get<any>(url, { headers }).pipe(
      map(data => {
        const lat = data.location?.latitude;
        const lng = data.location?.longitude;
        if (typeof lat === 'number' && typeof lng === 'number') {
          return { lat, lng } as google.maps.LatLngLiteral;
        }
        return null;
      }),
      catchError(err => {
        console.error('Error en getPlaceDetails', err);
        return of(null);
      })
    );
  }

  /**
   * construye la url de la foto.
   * nota: este método es síncrono y solo devuelve un string, no hace petición http.
   */
  getPhotoUrl(photoName: string, maxDim = 400): string {
    if (!photoName) return '';
    return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxDim}&maxHeightPx=${maxDim}&key=${environment.googlePlaces.apiKey}`;
  }

  // método de ejemplo para post con persistencia local opcional
  post<T>(path: string, body: any): Observable<T> {
    const url = path.startsWith('http') ? path : `${this.jsonPlaceholderBase}${path}`;
    return this.http.post<T>(url, body).pipe(
      catchError((err) => {
        // en este ejemplo no persistimos posts, simplemente pasar el error
        throw err;
      })
    );
  }
}
