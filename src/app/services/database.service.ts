import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { Platform } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';

export interface Venue {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface User {
  id: number;
  email: string;
  password?: string;
  name?: string;
  created_at?: number;
}

export interface Favorite {
  id: number;
  userId: number;
  placeId: string;
  name: string;
  address?: string;
  photoUrl?: string;
  rating?: number;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private db: SQLiteObject | null = null;
  private isWeb: boolean = false;

  private readonly USERS_KEY = 'users';
  private readonly VENUES_KEY = 'venues';
  private readonly FAVORITES_KEY = 'favorites';

  constructor(private sqlite: SQLite, private platform: Platform) {
    this.isWeb = !this.platform.is('hybrid');
  }

  async initialize(): Promise<void> {
    await this.platform.ready();
    
    if (this.isWeb) {
      console.log('Running on Web, using Preferences (Storage) fallback.');
      return;
    }

    try {
      this.db = await this.sqlite.create({
        name: 'veo.db',
        location: 'default'
      });
      await this.createTables();
    } catch (e) {
      console.error('Error initializing SQLite', e);
      // Fallback to Web mode if SQLite fails
      this.isWeb = true;
    }
  }

  private async createTables() {
    if (!this.db) return;
    
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT,
        created_at INTEGER
      )
    `, []);

    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS venues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        created_at INTEGER
      )
    `, []);

    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        place_id TEXT,
        name TEXT,
        address TEXT,
        photo_url TEXT,
        rating REAL,
        created_at INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `, []);
  }

  // --- Helpers for Preferences ---

  private async getPrefs<T>(key: string): Promise<T[]> {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : [];
  }

  private async setPrefs<T>(key: string, data: T[]): Promise<void> {
    await Preferences.set({ key, value: JSON.stringify(data) });
  }

  // --- venues ---

  async addVenue(name: string, description: string): Promise<void> {
    const createdAt = Date.now();
    if (this.isWeb) {
      const venues = await this.getPrefs<any>(this.VENUES_KEY);
      venues.push({ id: Date.now(), name, description, created_at: createdAt });
      await this.setPrefs(this.VENUES_KEY, venues);
    } else {
      if (!this.db) return;
      await this.db.executeSql(
        'INSERT INTO venues (name, description, created_at) VALUES (?, ?, ?)',
        [name, description, createdAt]
      );
    }
  }

  async getVenues(): Promise<Venue[]> {
    if (this.isWeb) {
      const venues = await this.getPrefs<any>(this.VENUES_KEY);
      return venues.map(v => ({
        id: v.id,
        name: v.name,
        description: v.description,
        createdAt: new Date(v.created_at)
      })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else {
      if (!this.db) return [];
      const res = await this.db.executeSql('SELECT * FROM venues ORDER BY created_at DESC', []);
      const venues: Venue[] = [];
      for (let i = 0; i < res.rows.length; i++) {
        const item = res.rows.item(i);
        venues.push({
          id: item.id,
          name: item.name,
          description: item.description,
          createdAt: new Date(item.created_at)
        });
      }
      return venues;
    }
  }

  async clearVenues(): Promise<void> {
    if (this.isWeb) {
      await Preferences.remove({ key: this.VENUES_KEY });
    } else {
      if (!this.db) return;
      await this.db.executeSql('DELETE FROM venues', []);
    }
  }

  // --- usuarios ---

  async createUser(email: string, password: string, name: string): Promise<number> {
    const createdAt = Date.now();
    if (this.isWeb) {
      const users = await this.getPrefs<User>(this.USERS_KEY);
      if (users.find(u => u.email === email)) throw new Error('User already exists');
      const newUser = { id: Date.now(), email, password, name, created_at: createdAt };
      users.push(newUser);
      await this.setPrefs(this.USERS_KEY, users);
      return newUser.id;
    } else {
      if (!this.db) throw new Error('DB not initialized');
      const check = await this.db.executeSql('SELECT id FROM users WHERE email = ?', [email]);
      if (check.rows.length > 0) throw new Error('User already exists');
      const res = await this.db.executeSql(
        'INSERT INTO users (email, password, name, created_at) VALUES (?, ?, ?, ?)',
        [email, password, name, createdAt]
      );
      return res.insertId;
    }
  }

  async getUserByEmail(email: string): Promise<{ id: number; email: string; password: string; name: string } | null> {
    if (this.isWeb) {
      const users = await this.getPrefs<any>(this.USERS_KEY);
      return users.find(u => u.email === email) || null;
    } else {
      if (!this.db) return null;
      const res = await this.db.executeSql('SELECT * FROM users WHERE email = ?', [email]);
      if (res.rows.length > 0) return res.rows.item(0);
      return null;
    }
  }

  async getUsers(): Promise<User[]> {
    if (this.isWeb) {
      const users = await this.getPrefs<User>(this.USERS_KEY);
      return users.map(u => ({ id: u.id, email: u.email, name: u.name }));
    } else {
      if (!this.db) return [];
      const res = await this.db.executeSql('SELECT id, email, name FROM users', []);
      const users: User[] = [];
      for (let i = 0; i < res.rows.length; i++) {
        users.push(res.rows.item(i));
      }
      return users;
    }
  }

  async updateUser(id: number, name: string): Promise<void> {
    if (this.isWeb) {
      const users = await this.getPrefs<User>(this.USERS_KEY);
      const index = users.findIndex(u => u.id === id);
      if (index !== -1) {
        users[index].name = name;
        await this.setPrefs(this.USERS_KEY, users);
      }
    } else {
      if (!this.db) return;
      await this.db.executeSql('UPDATE users SET name = ? WHERE id = ?', [name, id]);
    }
  }

  async updateUserPassword(email: string, password: string): Promise<void> {
    if (this.isWeb) {
      const users = await this.getPrefs<User>(this.USERS_KEY);
      const index = users.findIndex(u => u.email === email);
      if (index !== -1) {
        users[index].password = password;
        await this.setPrefs(this.USERS_KEY, users);
      }
    } else {
      if (!this.db) return;
      await this.db.executeSql('UPDATE users SET password = ? WHERE email = ?', [password, email]);
    }
  }

  async deleteUser(id: number): Promise<void> {
    if (this.isWeb) {
      let users = await this.getPrefs<User>(this.USERS_KEY);
      users = users.filter(u => u.id !== id);
      await this.setPrefs(this.USERS_KEY, users);
    } else {
      if (!this.db) return;
      await this.db.executeSql('DELETE FROM users WHERE id = ?', [id]);
    }
  }

  // --- favoritos ---

  async addFavorite(userId: number, place: { id: string; name: string; address?: string; photoUrl?: string; rating?: number }): Promise<void> {
    const createdAt = Date.now();
    if (this.isWeb) {
      const favorites = await this.getPrefs<any>(this.FAVORITES_KEY);
      if (favorites.some((f: any) => f.user_id === userId && f.place_id === place.id)) return;
      favorites.push({
        id: Date.now(),
        user_id: userId,
        place_id: place.id,
        name: place.name,
        address: place.address,
        photo_url: place.photoUrl,
        rating: place.rating,
        created_at: createdAt
      });
      await this.setPrefs(this.FAVORITES_KEY, favorites);
    } else {
      if (!this.db) return;
      const check = await this.db.executeSql(
        'SELECT id FROM favorites WHERE user_id = ? AND place_id = ?',
        [userId, place.id]
      );
      if (check.rows.length > 0) return;
      await this.db.executeSql(
        'INSERT INTO favorites (user_id, place_id, name, address, photo_url, rating, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, place.id, place.name, place.address || '', place.photoUrl || '', place.rating || 0, createdAt]
      );
    }
  }

  async removeFavorite(userId: number, placeId: string): Promise<void> {
    if (this.isWeb) {
      let favorites = await this.getPrefs<any>(this.FAVORITES_KEY);
      favorites = favorites.filter((f: any) => !(f.user_id === userId && f.place_id === placeId));
      await this.setPrefs(this.FAVORITES_KEY, favorites);
    } else {
      if (!this.db) return;
      await this.db.executeSql(
        'DELETE FROM favorites WHERE user_id = ? AND place_id = ?',
        [userId, placeId]
      );
    }
  }

  async getFavorites(userId: number): Promise<Favorite[]> {
    if (this.isWeb) {
      const favorites = await this.getPrefs<any>(this.FAVORITES_KEY);
      return favorites
        .filter((f: any) => f.user_id === userId)
        .map((f: any) => ({
          id: f.id,
          userId: f.user_id,
          placeId: f.place_id,
          name: f.name,
          address: f.address,
          photoUrl: f.photo_url,
          rating: f.rating,
          createdAt: new Date(f.created_at)
        }))
        .sort((a: Favorite, b: Favorite) => b.createdAt.getTime() - a.createdAt.getTime());
    } else {
      if (!this.db) return [];
      const res = await this.db.executeSql(
        'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      const favorites: Favorite[] = [];
      for (let i = 0; i < res.rows.length; i++) {
        const item = res.rows.item(i);
        favorites.push({
          id: item.id,
          userId: item.user_id,
          placeId: item.place_id,
          name: item.name,
          address: item.address,
          photoUrl: item.photo_url,
          rating: item.rating,
          createdAt: new Date(item.created_at)
        });
      }
      return favorites;
    }
  }

  async isFavorite(userId: number, placeId: string): Promise<boolean> {
    if (this.isWeb) {
      const favorites = await this.getPrefs<any>(this.FAVORITES_KEY);
      return favorites.some((f: any) => f.user_id === userId && f.place_id === placeId);
    } else {
      if (!this.db) return false;
      const res = await this.db.executeSql(
        'SELECT id FROM favorites WHERE user_id = ? AND place_id = ?',
        [userId, placeId]
      );
      return res.rows.length > 0;
    }
  }
}
