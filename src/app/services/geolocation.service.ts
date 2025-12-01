import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  constructor() {}

  async getCurrentPosition(options?: PositionOptions) {
    try {
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      return {
        coords: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        },
        timestamp: pos.timestamp,
      };
    } catch (e) {
      console.warn('Geolocation error', e);
      throw e;
    }
  }

  async watchPosition(callback: (position: any) => void) {
    const watchId = await Geolocation.watchPosition({}, (position, err) => {
      if (err) {
        console.warn('Watch error', err);
        return;
      }
      callback(position);
    });
    return () => Geolocation.clearWatch({ id: watchId as any });
  }
}
