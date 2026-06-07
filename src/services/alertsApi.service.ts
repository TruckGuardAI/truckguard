import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

import NetInfo from '@react-native-community/netinfo';

import { isSupabaseConfigured, supabase } from '../lib/supabase';

import type {
  Alert,
  AlertType,
  AlertsConnectionStatus,
  CreateAlertInput,
} from '../types/alert.types';

import {
  alertsCacheService,
  type PendingMutation,
} from './alertsCache.service';

import {
  mapRowToAlert,
  mapRowsToAlerts,
  type AlertRow,
} from '../utils/alertRow.utils';

import {
  filterUnresolvedAlerts,
  UNRESOLVED_ALERTS_SQL,
  unresolvedAlertsOrFilter,
} from '../utils/alertFilters.utils';

import {
  resolveNormalizedLocation,
} from '../utils/locationDescription.utils';

import {
  buildAlertNotificationConfig,
} from './alertPriority.service';

import {
  criticalAlertPushService,
} from './criticalAlertPush.service';

import {
  ALERT_SELECT_COLUMNS,
  getErrorMessage,
  logQueryAfterExecute,
  logQueryBeforeExecute,
} from '../utils/supabaseAlertsLog.utils';

export type { Alert, AlertType, CreateAlertInput, AlertsConnectionStatus };

export type ToastKind = 'created' | 'confirmed' | 'resolved';

type SubscribeOptions = {
  onAlerts: (alerts: Alert[]) => void;
  onStatus?: (status: AlertsConnectionStatus) => void;
  onToast?: (kind: ToastKind) => void;
};

const DEFAULT_TYPE: AlertType = 'fuel';
const TABLE = 'alerts';

function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function sortAlerts(alerts: Alert[]): Alert[] {
  return [...alerts].sort(
    (a, b) => b.id.localeCompare(a.id),
  );
}

function applyUnresolvedFilter(
  alerts: Alert[],
): Alert[] {
  return filterUnresolvedAlerts(alerts);
}

function isLocalAlertId(id: string): boolean {
  return id.startsWith('local-');
}

function matchesLocalPlaceholder(
  local: Alert,
  remote: Alert,
): boolean {
  return (
    local.title === remote.title &&
    local.type === remote.type &&
    Math.abs(local.latitude - remote.latitude) < 0.0001 &&
    Math.abs(local.longitude - remote.longitude) < 0.0001
  );
}

function findLocalAlertIdForMutation(
  alerts: Alert[],
  mutation: PendingMutation & { kind: 'create' },
): string | undefined {
  if (mutation.localAlertId) {
    return mutation.localAlertId;
  }

  const { payload } = mutation;
  const match = alerts.find(
    (alert) =>
      isLocalAlertId(alert.id) &&
      alert.title === payload.title &&
      Math.abs(
        alert.latitude - payload.latitude,
      ) < 0.0001 &&
      Math.abs(
        alert.longitude - payload.longitude,
      ) < 0.0001,
  );

  return match?.id;
}

class AlertsApiService {
  private channel: RealtimeChannel | null = null;

  private isOnline = true;

  private async checkNetwork(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      const connected =
        state.isConnected === true &&
        state.isInternetReachable !== false;

      this.isOnline = connected;
      return connected;
    } catch {
      this.isOnline = false;
      return false;
    }
  }

  private async publishAlerts(
    alerts: Alert[],
    onAlerts: (alerts: Alert[]) => void,
  ): Promise<void> {
    const sorted = sortAlerts(alerts);
    await alertsCacheService.saveAlerts(sorted);
    onAlerts(applyUnresolvedFilter(sorted));
  }

  private async loadFromCache(
    onAlerts: (alerts: Alert[]) => void,
  ): Promise<void> {
    const cached = await alertsCacheService.getAlerts();
    onAlerts(applyUnresolvedFilter(cached));
  }

  private async probeAlertsTable(): Promise<void> {
    if (!supabase) {
      return;
    }

    console.log('QUERY_BEFORE_EXECUTE');

    const result = await supabase
      .from('alerts')
      .select('*');

    console.log('RAW_ALERTS', result.data);
    console.log('QUERY_AFTER_EXECUTE', {
      rows: result.data?.length,
      error: result.error,
    });

    if (result.error) {
      console.error('QUERY_ERROR', result.error);
    }
  }

  private async fetchRemoteAlerts(): Promise<Alert[]> {
    if (!supabase) {
      throw new Error('Supabase não configurado');
    }

    await this.probeAlertsTable();

    const nowIso = new Date().toISOString();
    const sql =
      `SELECT ${ALERT_SELECT_COLUMNS} FROM ${TABLE} ` +
      `WHERE ${UNRESOLVED_ALERTS_SQL} ` +
      `ORDER BY created_at DESC LIMIT 100`;

    logQueryBeforeExecute(sql);

    const { data, error } = await supabase
      .from(TABLE)
      .select(ALERT_SELECT_COLUMNS)
      .eq('resolved', false)
      .or(unresolvedAlertsOrFilter(nowIso))
      .order('created_at', {
        ascending: false,
      })
      .limit(100);

    logQueryAfterExecute(data, error, sql);

    if (error) {
      throw error;
    }

    const alerts = applyUnresolvedFilter(
      mapRowsToAlerts(
        (data ?? []) as AlertRow[],
      ),
    );

    console.log('ALERTS_API_RESULT', {
      rawCount: data?.length ?? 0,
      mappedCount: alerts.length,
    });

    return alerts;
  }

  async getAlerts(): Promise<Alert[]> {
    const online = await this.checkNetwork();

    if (!online || !isSupabaseConfigured()) {
      const cacheSql =
        `CACHE ${TABLE} WHERE ${UNRESOLVED_ALERTS_SQL}`;

      logQueryBeforeExecute(cacheSql);

      try {
        const cached =
          await alertsCacheService.getAlerts();

        logQueryAfterExecute(
          cached,
          null,
          cacheSql,
        );

        const filtered =
          applyUnresolvedFilter(cached);

        console.log('ALERTS_API_RESULT', {
          rawCount: cached.length,
          mappedCount: filtered.length,
        });

        return filtered;
      } catch (error) {
        logQueryAfterExecute(
          null,
          error,
          cacheSql,
        );

        throw error;
      }
    }

    try {
      const alerts =
        await this.fetchRemoteAlerts();

      await alertsCacheService.saveAlerts(
        alerts,
      );

      return alerts;
    } catch (error) {
      console.error(
        'QUERY_ERROR',
        getErrorMessage(error),
      );

      const cacheSql =
        `CACHE FALLBACK ${TABLE} WHERE ${UNRESOLVED_ALERTS_SQL}`;

      logQueryBeforeExecute(cacheSql);

      const cached =
        await alertsCacheService.getAlerts();

      logQueryAfterExecute(
        cached,
        null,
        cacheSql,
      );

      const filtered =
        applyUnresolvedFilter(cached);

      console.log('ALERTS_API_RESULT', {
        rawCount: cached.length,
        mappedCount: filtered.length,
      });

      return filtered;
    }
  }

  private async buildInsertPayload(
    input: CreateAlertInput,
  ): Promise<{
    title: string;
    type: AlertType;
    time: string;
    description: string;
    location_text: string;
    city: string | null;
    region: string | null;
    country: string | null;
    severity: string;
    notification_priority: string;
    notification_sound: string;
    latitude: number;
    longitude: number;
    confirmations: number;
    resolved: boolean;
    expires_at: string;
    user_id: string | null;
  } | null> {
    const lat = Number(input.latitude);
    const lng = Number(input.longitude);

    if (!isValidCoordinates(lat, lng)) {
      return null;
    }

    const location =
      await resolveNormalizedLocation(
        lat,
        lng,
      );

    let userId: string | null = null;

    if (supabase) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      userId = session?.user?.id ?? null;
    }

    const alertType =
      input.type ?? DEFAULT_TYPE;

    const notificationConfig =
      buildAlertNotificationConfig(
        alertType,
      );

    const userNote =
      input.description?.trim();

    const mergedDescription = userNote
      ? location.description
        ? `${location.description}\n\n${userNote}`
        : userNote
      : location.description;

    const payload = {
      title: input.title,
      type: alertType,
      time: new Date().toLocaleTimeString(),
      description: mergedDescription,
      location_text:
        location.location_text,
      city: location.city,
      region: location.region,
      country: location.country,
      severity:
        notificationConfig.priority ===
        'CRITICAL'
          ? 'critical'
          : notificationConfig.priority ===
              'HIGH'
            ? 'high'
            : 'medium',
      notification_priority:
        notificationConfig.priority,
      notification_sound:
        notificationConfig.sound,
      latitude: lat,
      longitude: lng,
      confirmations: 0,
      resolved: false,
      expires_at: new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString(),
      user_id: userId,
    };

    console.log(
      'ALERT_INSERT_PAYLOAD',
      payload,
    );

    return payload;
  }

  private async createOfflineAlert(
    input: CreateAlertInput,
    payload: {
      title: string;
      type: AlertType;
      description: string;
      location_text: string;
      city: string | null;
      region: string | null;
      country: string | null;
      latitude: number;
      longitude: number;
      user_id: string | null;
    },
  ): Promise<Alert> {
    const localAlertId = `local-${Date.now()}`;
    const tempAlert: Alert = {
      id: localAlertId,
      title: payload.title,
      type: payload.type as AlertType,
      latitude: payload.latitude,
      longitude: payload.longitude,
      time: new Date().toLocaleTimeString(),
      confirmations: 0,
      positiveVotes: 0,
      negativeVotes: 0,
      resolved: false,
      locationName:
        payload.location_text ||
        payload.description,
      distance: 0,
      createdAt: new Date().toISOString(),
      userId: payload.user_id,
    };

    const cached = await alertsCacheService.getAlerts();
    cached.unshift(tempAlert);
    await alertsCacheService.saveAlerts(cached);

    await alertsCacheService.enqueuePending({
      id: `pending-${Date.now()}`,
      kind: 'create',
      localAlertId,
      payload: {
        ...input,
        description: payload.description,
        location_text: payload.location_text,
        city: payload.city ?? undefined,
        region: payload.region ?? undefined,
        country: payload.country ?? undefined,
      },
      createdAt: new Date().toISOString(),
    });

    console.log('LOG_OFFLINE_ALERT_CREATED', {
      localAlertId,
      title: tempAlert.title,
      type: tempAlert.type,
      latitude: tempAlert.latitude,
      longitude: tempAlert.longitude,
    });

    return tempAlert;
  }

  private async replaceLocalAlertAfterSync(
    localAlertId: string | undefined,
    remoteAlert: Alert,
  ): Promise<{
    replaced: boolean;
    duplicateRemoved: boolean;
  }> {
    const cached = await alertsCacheService.getAlerts();
    let replaced = false;
    let duplicateRemoved = false;

    const withoutLocal = cached.filter((alert) => {
      if (
        localAlertId &&
        alert.id === localAlertId
      ) {
        replaced = true;
        return false;
      }

      if (
        isLocalAlertId(alert.id) &&
        matchesLocalPlaceholder(
          alert,
          remoteAlert,
        )
      ) {
        duplicateRemoved = true;
        return false;
      }

      if (alert.id === remoteAlert.id) {
        duplicateRemoved = true;
        return false;
      }

      return true;
    });

    const next = sortAlerts([
      remoteAlert,
      ...withoutLocal,
    ]);

    await alertsCacheService.saveAlerts(next);

    if (replaced) {
      console.log('LOG_OFFLINE_ALERT_REPLACED', {
        localAlertId,
        remoteAlertId: remoteAlert.id,
      });
    }

    if (duplicateRemoved) {
      console.log(
        'LOG_OFFLINE_ALERT_DUPLICATE_REMOVED',
        {
          localAlertId,
          remoteAlertId: remoteAlert.id,
        },
      );
    }

    return { replaced, duplicateRemoved };
  }

  async createAlert(
    input: CreateAlertInput,
  ): Promise<Alert | null> {
    const payload =
      await this.buildInsertPayload(input);

    if (!payload) {
      return null;
    }

    const online = await this.checkNetwork();

    if (!online || !supabase) {
      return this.createOfflineAlert(
        input,
        payload,
      );
    }

    try {
      const sql =
        `INSERT INTO ${TABLE} (...) RETURNING ${ALERT_SELECT_COLUMNS}`;

      logQueryBeforeExecute(sql);

      const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select(ALERT_SELECT_COLUMNS)
        .single();

      logQueryAfterExecute(data, error, sql);

      if (error) {
        throw error;
      }

      const created = mapRowToAlert(
        data as AlertRow,
      );

      if (created && !input.skipPush) {
        void criticalAlertPushService.notifyNearbyUsersForAlert(
          created,
          payload.user_id,
        );
      }

      return created;
    } catch (error) {
      console.error(
        'QUERY_ERROR',
        getErrorMessage(error),
      );

      await alertsCacheService.enqueuePending({
        id: `pending-${Date.now()}`,
        kind: 'create',
        payload: input,
        createdAt: new Date().toISOString(),
      });

      return null;
    }
  }

  async deleteAlert(id: string): Promise<boolean> {
    const online = await this.checkNetwork();

    if (!online || !supabase) {
      const cached = await alertsCacheService.getAlerts();
      const filtered = cached.filter((item) => item.id !== id);
      await alertsCacheService.saveAlerts(filtered);

      await alertsCacheService.enqueuePending({
        id: `pending-${Date.now()}`,
        kind: 'delete',
        alertId: id,
        createdAt: new Date().toISOString(),
      });

      return true;
    }

    try {
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error(
        'Erro deleteAlert:',
        getErrorMessage(error),
      );
      return false;
    }
  }

  async getAlertById(id: string): Promise<Alert | undefined> {
    const cached = await alertsCacheService.getAlerts();
    const fromCache = cached.find((item) => item.id === id);

    if (fromCache) {
      return fromCache;
    }

    if (!supabase) {
      return undefined;
    }

    try {
      const sql =
        `SELECT ${ALERT_SELECT_COLUMNS} FROM ${TABLE} WHERE id = '${id}'`;

      logQueryBeforeExecute(sql);

      const { data, error } = await supabase
        .from(TABLE)
        .select(ALERT_SELECT_COLUMNS)
        .eq('id', id)
        .maybeSingle();

      logQueryAfterExecute(data, error, sql);

      if (error || !data) {
        return undefined;
      }

      return mapRowToAlert(data as AlertRow) ?? undefined;
    } catch (error) {
      console.error(
        'QUERY_ERROR',
        getErrorMessage(error),
      );

      return undefined;
    }
  }

  private async applyRemoteList(
    onAlerts: (alerts: Alert[]) => void,
  ): Promise<void> {
    const alerts = await this.fetchRemoteAlerts();
    await this.publishAlerts(alerts, onAlerts);
  }

  private mergeChange(
    alerts: Alert[],
    payload: RealtimePostgresChangesPayload<AlertRow>,
  ): Alert[] {
    if (payload.eventType === 'DELETE') {
      const oldId = payload.old.id;
      return alerts.filter((item) => item.id !== oldId);
    }

    const row = payload.new as AlertRow;
    const mapped = mapRowToAlert(row);

    if (!mapped) {
      return alerts;
    }

    const without = alerts.filter((item) => {
      if (item.id === mapped.id) {
        return false;
      }

      if (
        payload.eventType === 'INSERT' &&
        isLocalAlertId(item.id) &&
        matchesLocalPlaceholder(
          item,
          mapped,
        )
      ) {
        console.log(
          'LOG_OFFLINE_ALERT_DUPLICATE_REMOVED',
          {
            localAlertId: item.id,
            remoteAlertId: mapped.id,
            source: 'realtime_merge',
          },
        );
        return false;
      }

      return true;
    });

    return [mapped, ...without];
  }

  private async syncPendingMutations(): Promise<void> {
    if (!supabase) {
      return;
    }

    const pending = await alertsCacheService.getPending();

    if (pending.length === 0) {
      return;
    }

    const createMutations = pending.filter(
      (mutation) => mutation.kind === 'create',
    );

    if (createMutations.length > 0) {
      console.log('LOG_OFFLINE_ALERT_SYNC_START', {
        pendingCount: pending.length,
        createCount: createMutations.length,
        localAlertIds: createMutations.map(
          (mutation) =>
            mutation.kind === 'create'
              ? mutation.localAlertId
              : undefined,
        ),
      });
    }

    const remaining: PendingMutation[] = [];

    for (const mutation of pending) {
      try {
        if (mutation.kind === 'create') {
          const built =
            await this.buildInsertPayload(
              mutation.payload,
            );

          if (!built) {
            throw new Error(
              'Coordenadas inválidas no alerta pendente',
            );
          }

          const cached =
            await alertsCacheService.getAlerts();

          const localAlertId =
            findLocalAlertIdForMutation(
              cached,
              mutation,
            );

          const { data, error } = await supabase
            .from(TABLE)
            .insert(built)
            .select(ALERT_SELECT_COLUMNS)
            .single();

          if (error) {
            throw error;
          }

          const remoteAlert = mapRowToAlert(
            data as AlertRow,
          );

          if (!remoteAlert) {
            throw new Error(
              'Resposta inválida ao sincronizar alerta offline',
            );
          }

          console.log(
            'LOG_OFFLINE_ALERT_SYNC_SUCCESS',
            {
              localAlertId,
              remoteAlertId: remoteAlert.id,
              pendingMutationId: mutation.id,
            },
          );

          await this.replaceLocalAlertAfterSync(
            localAlertId,
            remoteAlert,
          );

          if (
            !mutation.payload.skipPush
          ) {
            void criticalAlertPushService.notifyNearbyUsersForAlert(
              remoteAlert,
              built.user_id,
            );
          }
        }

        if (mutation.kind === 'delete') {
          if (
            isLocalAlertId(mutation.alertId)
          ) {
            continue;
          }

          const { error } = await supabase
            .from(TABLE)
            .delete()
            .eq('id', mutation.alertId);

          if (error) {
            throw error;
          }
        }
      } catch (error) {
        console.error(
          'Erro syncPendingMutations:',
          {
            mutationId: mutation.id,
            kind: mutation.kind,
            error: getErrorMessage(error),
          },
        );
        remaining.push(mutation);
      }
    }

    await alertsCacheService.savePending(remaining);
  }

  subscribeAlerts(
    onAlerts: (alerts: Alert[]) => void,
    onStatus?: (status: AlertsConnectionStatus) => void,
  ): () => void {
    return this.subscribeAlertsAdvanced({
      onAlerts,
      onStatus,
    });
  }

  subscribeAlertsAdvanced(
    options: SubscribeOptions,
  ): () => void {
    const { onAlerts, onStatus, onToast } = options;

    let disposed = false;

    const setStatus = (status: AlertsConnectionStatus): void => {
      if (!disposed) {
        onStatus?.(status);
      }
    };

    const refresh = async (
      statusAfter?: AlertsConnectionStatus,
    ): Promise<void> => {
      if (disposed) {
        return;
      }

      try {
        const online = await this.checkNetwork();

        if (!online || !isSupabaseConfigured()) {
          await this.loadFromCache(onAlerts);
          setStatus('offline');
          return;
        }

        await this.applyRemoteList(onAlerts);
        setStatus(statusAfter ?? 'online');
      } catch (error) {
        console.error(
          'QUERY_ERROR',
          getErrorMessage(error),
        );
        await this.loadFromCache(onAlerts);
        setStatus('error');
      }
    };

    const bootstrap = async (): Promise<void> => {
      setStatus('loading');
      await this.loadFromCache(onAlerts);
      await refresh('loading');

      const online = await this.checkNetwork();

      if (online && isSupabaseConfigured()) {
        await this.syncPendingMutations();
        await refresh('online');
        setupRealtime();
      } else {
        setStatus('offline');
      }
    };

    const setupRealtime = (): void => {
      if (!supabase || disposed) {
        return;
      }

      this.channel?.unsubscribe();

      this.channel = supabase
        .channel('truckguard-alerts')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: TABLE,
          },
          async (payload) => {
            const cached = await alertsCacheService.getAlerts();
            const merged = this.mergeChange(
              cached,
              payload as RealtimePostgresChangesPayload<AlertRow>,
            );

            await this.publishAlerts(merged, onAlerts);
            setStatus('online');

            if (payload.eventType === 'INSERT' && onToast) {
              onToast('created');
            }

            if (
              payload.eventType === 'UPDATE' &&
              onToast
            ) {
              const row = payload.new as AlertRow;
              const old = payload.old as Partial<AlertRow>;

              if (
                row.resolved &&
                !old.resolved
              ) {
                onToast('resolved');
              } else if (
                typeof row.confirmations === 'number' &&
                typeof old.confirmations === 'number' &&
                row.confirmations > old.confirmations
              ) {
                onToast('confirmed');
              }
            }
          },
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setStatus('online');
          }

          if (
            status === 'CHANNEL_ERROR' ||
            status === 'TIMED_OUT'
          ) {
            setStatus('error');
          }

          if (status === 'CLOSED') {
            setStatus('reconnecting');
          }
        });
    };

    void bootstrap();

    const netUnsubscribe = NetInfo.addEventListener(
      async (state) => {
        const connected =
          state.isConnected === true &&
          state.isInternetReachable !== false;

        this.isOnline = connected;

        if (!connected) {
          setStatus('offline');
          await this.loadFromCache(onAlerts);
          return;
        }

        setStatus('reconnecting');
        await this.syncPendingMutations();
        await refresh('online');

        if (!this.channel) {
          setupRealtime();
        }
      },
    );

    return () => {
      disposed = true;
      netUnsubscribe();
      this.channel?.unsubscribe();
      this.channel = null;
    };
  }
}

export const alertsApiService = new AlertsApiService();
