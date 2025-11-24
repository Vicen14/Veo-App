import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';

interface VenueRecord {
  id: number;
  name: string;
  description: string | null;
  created_at: number;
}

export interface Venue {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
}

/**
 * Encapsula el manejo de la base de datos SQLite para la aplicación.
 */
@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private sqlite?: SQLiteConnection;
  private connection?: SQLiteDBConnection;
  private isReady = false;
  private readonly dbName = 'veo.db';

  /**
   * Inicializa la base de datos y crea las tablas necesarias.
   */
  async initialize(): Promise<void> {
    if (this.isReady) {
      return;
    }

    const sqlite = await this.preparePlugin();

    try {
      await sqlite.checkConnectionsConsistency();
    } catch (error: unknown) {
      console.warn('No se pudo validar consistencia de conexiones SQLite', error);
    }

    this.connection = await this.ensureConnection(sqlite);

    const isOpen = await this.connection.isDBOpen();
    if (!isOpen.result) {
      await this.connection.open();
    }

    await this.connection.execute(`
      CREATE TABLE IF NOT EXISTS venues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL
      );
    `);

    await this.persistToStoreIfNeeded(sqlite);

    this.isReady = true;
  }

  /**
   * Inserta un nuevo venue en la tabla.
   */
  async addVenue(name: string, description: string): Promise<void> {
    await this.ensureReady();
    const statement = `
      INSERT INTO venues (name, description, created_at)
      VALUES (?, ?, ?);
    `;
    await this.connection!.run(statement, [name, description, Date.now()]);
    if (this.sqlite) {
      await this.persistToStoreIfNeeded(this.sqlite);
    }
  }

  /**
   * Obtiene todos los venues ordenados por fecha de creación descendente.
   */
  async getVenues(): Promise<Venue[]> {
    await this.ensureReady();
    const result = await this.connection!.query('SELECT * FROM venues ORDER BY created_at DESC;');
    const rows = (result.values ?? []) as VenueRecord[];
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      createdAt: new Date(row.created_at),
    }));
  }

  /**
   * Elimina todos los registros (útil durante las pruebas).
   */
  async clearVenues(): Promise<void> {
    await this.ensureReady();
    await this.connection!.execute('DELETE FROM venues;');
    if (this.sqlite) {
      await this.persistToStoreIfNeeded(this.sqlite);
    }
  }

  private async ensureReady(): Promise<void> {
    if (!this.isReady) {
      await this.initialize();
    }
  }

  private async preparePlugin(): Promise<SQLiteConnection> {
    const sqlite = await this.ensureSQLiteInstance();
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      await this.setupWebStore(sqlite);
    }
    return sqlite;
  }

  private async setupWebStore(sqlite: SQLiteConnection): Promise<void> {
    if (!customElements.get('jeep-sqlite')) {
      // Asegura que el elemento web esté adjunto al DOM antes de inicializar el store.
      const jeepEl = document.createElement('jeep-sqlite');
      document.body.appendChild(jeepEl);
      await customElements.whenDefined('jeep-sqlite');
    }

    await sqlite.initWebStore();
  }

  private async ensureSQLiteInstance(): Promise<SQLiteConnection> {
    if (!this.sqlite) {
      this.sqlite = new SQLiteConnection(CapacitorSQLite);
    }
    return this.sqlite;
  }

  private async ensureConnection(sqlite: SQLiteConnection): Promise<SQLiteDBConnection> {
    if (this.connection) {
      return this.connection;
    }

    try {
      this.connection = await sqlite.retrieveConnection(this.dbName, false);
    } catch {
      this.connection = await sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false);
    }

    return this.connection;
  }

  private async persistToStoreIfNeeded(sqlite: SQLiteConnection): Promise<void> {
    if (Capacitor.getPlatform() !== 'web') {
      return;
    }
    try {
      await sqlite.saveToStore(this.dbName);
    } catch (error: unknown) {
      console.warn('No se pudo guardar la base de datos en IndexedDB', error);
    }
  }
}
