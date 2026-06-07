import AsyncStorage from '@react-native-async-storage/async-storage';

import { normalizeLocationKey } from '../utils/locationNormalize.utils';

const CACHE_KEY = 'truckguard_geocode_cache_v2';

export type GeocodeCacheSource = 'nominatim';

export type GeocodeCacheEntry = {
  latitude: number;
  longitude: number;
  displayName: string;
  source: GeocodeCacheSource;
  cachedAt: string;
};

type GeocodeCacheStore = Record<
  string,
  GeocodeCacheEntry
>;

class GeocodeCacheService {
  private memory = new Map<
    string,
    GeocodeCacheEntry
  >();

  private loaded = false;

  private loadPromise: Promise<void> | null =
    null;

  private buildKey(rawInput: string): string {
    return normalizeLocationKey(rawInput);
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) {
      return;
    }

    if (this.loadPromise) {
      await this.loadPromise;
      return;
    }

    this.loadPromise = this.loadFromStorage();
    await this.loadPromise;
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(
        CACHE_KEY,
      );

      if (!raw) {
        this.loaded = true;
        return;
      }

      const parsed = JSON.parse(
        raw,
      ) as GeocodeCacheStore;

      for (const [key, entry] of Object.entries(
        parsed,
      )) {
        this.memory.set(key, entry);
      }
    } catch (error) {
      console.log(
        'Erro cache geocode:',
        error,
      );
    } finally {
      this.loaded = true;
      this.loadPromise = null;
    }
  }

  private async persist(): Promise<void> {
    try {
      const store: GeocodeCacheStore = {};

      for (const [key, entry] of this.memory.entries()) {
        store[key] = entry;
      }

      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify(store),
      );
    } catch (error) {
      console.log(
        'Erro guardar cache geocode:',
        error,
      );
    }
  }

  getSync(
    rawInput: string,
  ): GeocodeCacheEntry | null {
    const key = this.buildKey(rawInput);

    return this.memory.get(key) ?? null;
  }

  async get(
    rawInput: string,
  ): Promise<GeocodeCacheEntry | null> {
    await this.ensureLoaded();

    return this.getSync(rawInput);
  }

  async set(
    rawInput: string,
    entry: Omit<
      GeocodeCacheEntry,
      'cachedAt'
    >,
  ): Promise<void> {
    await this.ensureLoaded();

    const key = this.buildKey(rawInput);
    const stored: GeocodeCacheEntry = {
      ...entry,
      cachedAt: new Date().toISOString(),
    };

    this.memory.set(key, stored);

    console.log('LOG_GEOCODE_CACHE', {
      query: rawInput,
      key,
      hit: false,
      stored: true,
      source: entry.source,
      displayName: entry.displayName,
      latitude: entry.latitude,
      longitude: entry.longitude,
    });

    await this.persist();
  }

  logCacheHit(
    rawInput: string,
    entry: GeocodeCacheEntry,
  ): void {
    console.log('LOG_GEOCODE_CACHE', {
      query: rawInput,
      key: this.buildKey(rawInput),
      hit: true,
      stored: false,
      source: entry.source,
      displayName: entry.displayName,
      latitude: entry.latitude,
      longitude: entry.longitude,
    });
  }
}

export const geocodeCacheService =
  new GeocodeCacheService();
