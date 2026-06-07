import AsyncStorage from '@react-native-async-storage/async-storage';

import { isSupabaseConfigured, supabase } from '../lib/supabase';

import type { AlertType } from '../types/alert.types';

import type {
  HistoryAlert,
  HistoryFilter,
  HistoryStatus,
} from '../types/history.types';

import {
  ALERT_SELECT_COLUMNS,
  getErrorMessage,
  logQueryAfterExecute,
  logQueryBeforeExecute,
} from '../utils/supabaseAlertsLog.utils';

import {
  locationService,
  type UserCoordinates,
} from './location.service';

import {
  normalizeText,
  sanitizeEmojiIcon,
} from '../utils/alertNormalize.utils';

import {
  calculateAlertTrust,
} from './alertTrust.service';

import { withTimeout } from '../utils/withTimeout';

const TABLE = 'alerts';
const LOCATION_TIMEOUT_MS = 5_000;
const CACHE_PREFIX = 'truckguard_history_cache_';
const CACHE_TTL_MS = 15_000;

const DEFAULT_TYPE: AlertType = 'fuel';

const TYPE_EMOJI: Record<AlertType, string> = {
  fuel: '⛽',
  pallet: '📦',
  full_attack: '🚨',
  cargo_theft: '📦',
  cabin_attack: '🚗',
  obstacle: '🚧',
  mechanic: '🔧',
  rest: '🛌',
  sos: '🆘',
};

type AlertRow = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  severity: string | null;
  latitude: number;
  longitude: number;
  confirmations: number;
  total_confirmations?: number;
  total_rejections?: number;
  created_at: string;
  expires_at: string | null;
  resolved: boolean;
};

type CacheEntry = {
  data: HistoryAlert[];
  at: number;
};

const memoryCache = new Map<
  HistoryFilter,
  CacheEntry
>();

function isAlertType(
  value: unknown,
): value is AlertType {
  return (
    value === 'fuel' ||
    value === 'pallet' ||
    value === 'full_attack' ||
    value === 'cargo_theft' ||
    value === 'cabin_attack' ||
    value === 'obstacle' ||
    value === 'mechanic' ||
    value === 'rest' ||
    value === 'sos'
  );
}

function getStartOfTodayIso(): string {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  return start.toISOString();
}

function getDaysAgoIso(
  days: number,
): string {
  const date = new Date();
  date.setDate(
    date.getDate() - days,
  );

  return date.toISOString();
}

function getHistoryStatus(
  resolved: boolean,
  expiresAt?: string,
): HistoryStatus {
  if (resolved) {
    return 'resolved';
  }

  if (
    expiresAt &&
    new Date(expiresAt).getTime() <
      Date.now()
  ) {
    return 'expired';
  }

  return 'open';
}

function formatDateLabel(
  createdAt: string,
): string {
  return new Date(
    createdAt,
  ).toLocaleDateString(
    'pt-PT',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  );
}

function formatTimeLabel(
  createdAt: string,
): string {
  return new Date(
    createdAt,
  ).toLocaleTimeString(
    'pt-PT',
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  );
}

export function formatHistoryDistanceKm(
  km: number,
): string {
  if (!Number.isFinite(km)) {
    return '—';
  }

  if (km >= 10) {
    return `${Math.round(km)} km`;
  }

  return `${km.toFixed(1)} km`;
}

function mapRowToHistoryAlert(
  row: AlertRow,
  coords: UserCoordinates | null,
): HistoryAlert | null {
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  const type = isAlertType(row.type)
    ? row.type
    : DEFAULT_TYPE;

  const expiresAt =
    row.expires_at ??
    undefined;

  const distanceKm = coords
    ? locationService.calculateDistanceKm(
        coords.latitude,
        coords.longitude,
        lat,
        lng,
      )
    : 0;

  const positiveVotes =
    row.total_confirmations ??
    row.confirmations ??
    0;

  const negativeVotes =
    row.total_rejections ?? 0;

  const trust = calculateAlertTrust({
    confirmations: positiveVotes,
    rejections: negativeVotes,
  });

  return {
    id: row.id,
    title: row.title,
    type,
    description: normalizeText(
      row.description,
    ),
    latitude: lat,
    longitude: lng,
    positiveVotes,
    negativeVotes,
    trustScore: trust.trustScore,
    trustLevel: trust.trustLevel,
    createdAt: row.created_at,
    expiresAt,
    resolved: Boolean(
      row.resolved,
    ),
    distanceKm,
    status: getHistoryStatus(
      Boolean(row.resolved),
      expiresAt,
    ),
    dateLabel: formatDateLabel(
      row.created_at,
    ),
    timeLabel: formatTimeLabel(
      row.created_at,
    ),
    icon: sanitizeEmojiIcon(
      TYPE_EMOJI[type] ??
        '🚨',
    ),
  };
}

class HistoryService {
  invalidateCache(): void {
    memoryCache.clear();
  }

  private async readPersistentCache(
    filter: HistoryFilter,
  ): Promise<HistoryAlert[]> {
    try {
      const raw = await AsyncStorage.getItem(
        `${CACHE_PREFIX}${filter}`,
      );

      if (!raw) {
        return [];
      }

      const parsed: unknown =
        JSON.parse(raw);

      return Array.isArray(parsed)
        ? (parsed as HistoryAlert[])
        : [];
    } catch (error) {
      console.error(
        'Erro cache histórico:',
        getErrorMessage(error),
      );

      return [];
    }
  }

  private async writePersistentCache(
    filter: HistoryFilter,
    data: HistoryAlert[],
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${CACHE_PREFIX}${filter}`,
        JSON.stringify(data),
      );
    } catch (error) {
      console.error(
        'Erro guardar cache histórico:',
        getErrorMessage(error),
      );
    }
  }

  private async resolveUserLocationOptional():
  Promise<UserCoordinates | null> {
    const lastKnown =
      locationService.getLastKnownLocation();

    if (lastKnown) {
      return lastKnown;
    }

    try {
      return await withTimeout(
        locationService.getCurrentLocation(),
        LOCATION_TIMEOUT_MS,
      );
    } catch (error) {
      console.error(
        'Erro localização histórico:',
        getErrorMessage(error),
      );

      return null;
    }
  }

  private async fetchAlerts(
    filter: HistoryFilter,
  ): Promise<HistoryAlert[]> {
    console.log('HISTORY_FETCH_START', {
      filter,
    });

    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      const cached =
        await this.readPersistentCache(
          filter,
        );

      console.log('MAPPED_ALERTS', cached);
      console.log('HISTORY_SERVICE_RESULT', {
        rawRows: cached.length,
        mappedCount: cached.length,
      });
      console.log('HISTORY_FETCH_SUCCESS', {
        filter,
        count: cached.length,
        hasLocation: false,
        source: 'persistent_cache',
      });

      return cached;
    }

    let query = supabase
      .from(TABLE)
      .select(ALERT_SELECT_COLUMNS)
      .order('created_at', {
        ascending: false,
      });

    let dateFilter = '';

    if (filter === 'today') {
      dateFilter = `created_at >= '${getStartOfTodayIso()}'`;
      query = query.gte(
        'created_at',
        getStartOfTodayIso(),
      );
    } else if (
      filter === '7days'
    ) {
      dateFilter = `created_at >= '${getDaysAgoIso(7)}'`;
      query = query.gte(
        'created_at',
        getDaysAgoIso(7),
      );
    } else if (
      filter === '30days'
    ) {
      dateFilter = `created_at >= '${getDaysAgoIso(30)}'`;
      query = query.gte(
        'created_at',
        getDaysAgoIso(30),
      );
    }

    const sql =
      `SELECT ${ALERT_SELECT_COLUMNS} FROM ${TABLE}` +
      (dateFilter ? ` WHERE ${dateFilter}` : '') +
      ` ORDER BY created_at DESC`;

    logQueryBeforeExecute(sql);

    const { data, error } =
      await query;

    logQueryAfterExecute(data, error, sql);

    if (error) {
      throw error;
    }

    const coords =
      await this.resolveUserLocationOptional();

    const mapped = (data as AlertRow[])
      .map((row) =>
        mapRowToHistoryAlert(
          row,
          coords,
        ),
      )
      .filter(
        (
          item,
        ): item is HistoryAlert =>
          item !== null,
      );

    console.log('MAPPED_ALERTS', mapped);
    console.log('HISTORY_SERVICE_RESULT', {
      rawRows: data?.length ?? 0,
      mappedCount: mapped.length,
    });
    console.log('HISTORY_FETCH_SUCCESS', {
      filter,
      count: mapped.length,
      hasLocation: Boolean(coords),
      rawRows: data?.length ?? 0,
    });

    return mapped;
  }

  private async getByFilter(
    filter: HistoryFilter,
    forceRefresh = false,
  ): Promise<HistoryAlert[]> {
    const now = Date.now();
    const cached =
      memoryCache.get(filter);

    if (
      !forceRefresh &&
      cached &&
      now - cached.at <
        CACHE_TTL_MS
    ) {
      return cached.data;
    }

    try {
      const data =
        await this.fetchAlerts(
          filter,
        );

      memoryCache.set(
        filter,
        {
          data,
          at: now,
        },
      );

      await this.writePersistentCache(
        filter,
        data,
      );

      console.log(
        'HISTORY_LOAD',
        {
          filter,
          count: data.length,
        },
      );

      return data;
    } catch (error) {
      console.error(
        'QUERY_ERROR',
        getErrorMessage(error),
      );

      if (cached) {
        return cached.data;
      }

      return this.readPersistentCache(
        filter,
      );
    }
  }

  async getHistoryToday(
    forceRefresh = false,
  ): Promise<HistoryAlert[]> {
    return this.getByFilter(
      'today',
      forceRefresh,
    );
  }

  async getHistoryLast7Days(
    forceRefresh = false,
  ): Promise<HistoryAlert[]> {
    return this.getByFilter(
      '7days',
      forceRefresh,
    );
  }

  async getHistoryLast30Days(
    forceRefresh = false,
  ): Promise<HistoryAlert[]> {
    return this.getByFilter(
      '30days',
      forceRefresh,
    );
  }

  async getHistoryAll(
    forceRefresh = false,
  ): Promise<HistoryAlert[]> {
    return this.getByFilter(
      'all',
      forceRefresh,
    );
  }

  async getHistory(
    filter: HistoryFilter,
    forceRefresh = false,
  ): Promise<HistoryAlert[]> {
    console.log(
      'HISTORY_FILTER',
      filter,
    );

    switch (filter) {
      case 'today':
        return this.getHistoryToday(
          forceRefresh,
        );
      case '7days':
        return this.getHistoryLast7Days(
          forceRefresh,
        );
      case '30days':
        return this.getHistoryLast30Days(
          forceRefresh,
        );
      case 'all':
        return this.getHistoryAll(
          forceRefresh,
        );
    }
  }
}

export const historyService =
  new HistoryService();
