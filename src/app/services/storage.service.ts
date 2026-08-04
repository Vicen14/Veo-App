import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

/**
 * wrapper de almacenamiento usando @ionic/storage-angular (IndexedDB) como respaldo en web.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private prefix = 'cache:';
  private isInitialized = false;

  constructor(private storage: Storage) {
    this.init();
  }

  private async init() {
    await this.storage.create();
    this.isInitialized = true;
  }

  private key(k: string) {
    return `${this.prefix}${k}`;
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.isInitialized) await this.init();
    await this.storage.set(this.key(key), value);
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isInitialized) await this.init();
    const res = await this.storage.get(this.key(key));
    if (res === null || res === undefined) return null;
    return res as T;
  }

  async remove(key: string): Promise<void> {
    if (!this.isInitialized) await this.init();
    await this.storage.remove(this.key(key));
  }

  async clearAll(): Promise<void> {
    if (!this.isInitialized) await this.init();
    await this.storage.clear();
  }
}
