import { Injectable } from '@angular/core';
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
  password?: string; // Optional in interface but required in storage
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
  private readonly USERS_KEY = 'users';
  private readonly VENUES_KEY = 'venues';
  private readonly FAVORITES_KEY = 'favorites';

  constructor() {}

  async initialize(): Promise<void> {
    // No initialization needed for Preferences, but keeping method for compatibility
    return Promise.resolve();
  }

  // --- HELPERS ---

  private async getData<T>(key: string): Promise<T[]> {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : [];
  }

  private async setData<T>(key: string, data: T[]): Promise<void> {
    await Preferences.set({ key, value: JSON.stringify(data) });
  }

  // --- VENUES ---

  async addVenue(name: string, description: string): Promise<void> {
    const venues = await this.getData<any>(this.VENUES_KEY);
    const newVenue = {
      id: Date.now(), // Simple ID generation
      name,
      description,
      created_at: Date.now()
    };
    venues.push(newVenue);
    await this.setData(this.VENUES_KEY, venues);
  }

  async getVenues(): Promise<Venue[]> {
    const venues = await this.getData<any>(this.VENUES_KEY);
    return venues.map(v => ({
      id: v.id,
      name: v.name,
      description: v.description,
      createdAt: new Date(v.created_at)
    })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async clearVenues(): Promise<void> {
    await Preferences.remove({ key: this.VENUES_KEY });
  }

  // --- USERS ---

  async createUser(email: string, password: string, name: string): Promise<number> {
    const users = await this.getData<User>(this.USERS_KEY);
    
    if (users.find(u => u.email === email)) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: Date.now(),
      email,
      password,
      name,
      created_at: Date.now()
    };

    users.push(newUser);
    await this.setData(this.USERS_KEY, users);
    return newUser.id;
  }

  async getUserByEmail(email: string): Promise<{ id: number; email: string; password: string; name: string } | null> {
    const users = await this.getData<any>(this.USERS_KEY);
    const user = users.find(u => u.email === email);
    return user || null;
  }

  async getUsers(): Promise<User[]> {
    const users = await this.getData<User>(this.USERS_KEY);
    return users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name
    }));
  }

  async updateUser(id: number, name: string): Promise<void> {
    const users = await this.getData<User>(this.USERS_KEY);
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index].name = name;
      await this.setData(this.USERS_KEY, users);
    }
  }

  async updateUserPassword(email: string, password: string): Promise<void> {
    const users = await this.getData<User>(this.USERS_KEY);
    const index = users.findIndex(u => u.email === email);
    if (index !== -1) {
      users[index].password = password;
      await this.setData(this.USERS_KEY, users);
    }
  }

  async deleteUser(id: number): Promise<void> {
    let users = await this.getData<User>(this.USERS_KEY);
    users = users.filter(u => u.id !== id);
    await this.setData(this.USERS_KEY, users);
  }

  // --- FAVORITES ---

  async addFavorite(userId: number, place: { id: string; name: string; address?: string; photoUrl?: string; rating?: number }): Promise<void> {
    const favorites = await this.getData<any>(this.FAVORITES_KEY);
    
    // Check if already exists
    if (favorites.some((f: any) => f.user_id === userId && f.place_id === place.id)) {
      return;
    }

    const newFavorite = {
      id: Date.now(),
      user_id: userId,
      place_id: place.id,
      name: place.name,
      address: place.address,
      photo_url: place.photoUrl,
      rating: place.rating,
      created_at: Date.now()
    };

    favorites.push(newFavorite);
    await this.setData(this.FAVORITES_KEY, favorites);
  }

  async removeFavorite(userId: number, placeId: string): Promise<void> {
    let favorites = await this.getData<any>(this.FAVORITES_KEY);
    favorites = favorites.filter((f: any) => !(f.user_id === userId && f.place_id === placeId));
    await this.setData(this.FAVORITES_KEY, favorites);
  }

  async getFavorites(userId: number): Promise<Favorite[]> {
    const favorites = await this.getData<any>(this.FAVORITES_KEY);
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
  }

  async isFavorite(userId: number, placeId: string): Promise<boolean> {
    const favorites = await this.getData<any>(this.FAVORITES_KEY);
    return favorites.some((f: any) => f.user_id === userId && f.place_id === placeId);
  }
}