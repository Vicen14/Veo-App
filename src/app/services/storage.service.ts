import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

/**
 * wrapper de almacenamiento simple usando capacitor preferences como respaldo.
 * para soporte de producción/nativo sqlite puedes reemplazar los internos con
 * capacitor community sqlite o @ionic/storage-angular respaldado por sqlite.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private prefix = 'cache:';

  constructor() {}

  private key(k: string) {
    return `${this.prefix}${k}`;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await Preferences.set({ key: this.key(key), value: JSON.stringify(value) });
  }

  async get<T>(key: string): Promise<T | null> {
    const res = await Preferences.get({ key: this.key(key) });
    if (!res.value) return null;
    try {
      return JSON.parse(res.value) as T;
    } catch {
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key: this.key(key) });
  }

  async clearAll(): Promise<void> {
    // la api de preferences no proporciona un borrado con espacio de nombres, así que esto es una operación nula aquí.
    // considera usar un motor de almacenamiento dedicado si necesitas esta característica.
    return Promise.resolve();
  }
}
