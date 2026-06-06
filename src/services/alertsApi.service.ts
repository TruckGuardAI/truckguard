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

export type { Alert, AlertType, CreateAlertInput, AlertsConnectionStatus };

export type ToastKind = 'created' | 'confirmed' | 'resolved';

type AlertRow = {
  id: string;
  title: string;
  type: string;
  latitude: number;
  longitude: number;
  time: string;
  confirmations: number;
  positive_votes: number | null;
  negative_votes: number | null;
  resolved: boolean;
  location_name: string | null;
  created_at: string;
  expires_at: string | null;
};

type SubscribeOptions = {
  onAlerts: (alerts: Alert[]) => void;
  onStatus?: (status: AlertsConnectionStatus) => void;
  onToast?: (kind: ToastKind) => void;
};

const DEFAULT_TYPE: AlertType = 'fuel';
const TABLE = 'alerts';

function isAlertType(value: unknown): value is AlertType {
  return (
    value === 'fuel' ||
    value === 'pallet' ||
    value === 'full_attack' ||
    value === 'obstacle' ||
    value === 'mechanic' ||
    value === 'rest' ||
    value === 'sos'
  );
}

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

function mapRowToAlert(row: AlertRow): Alert | null {
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);

  if (!isValidCoordinates(lat, lng)) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    type: isAlertType(row.type) ? row.type : DEFAULT_TYPE,
    latitude: lat,
    longitude: lng,
    time: row.time,
    confirmations: row.confirmations ?? 0,
    positiveVotes:
      row.positive_votes ?? 0,
    negativeVotes:
      row.negative_votes ?? 0,
    resolved: Boolean(row.resolved),
    locationName: row.location_name ?? 'A determinar',
    distance: 0,
    createdAt: row.created_at,
    expiresAt:
      row.expires_at ??
      undefined,
  };
}

function sortAlerts(alerts: Alert[]): Alert[] {
  return [...alerts].sort(
    (a, b) => b.id.localeCompare(a.id),
  );
}

function activeAlerts(
  alerts: Alert[],
): Alert[] {
  return alerts.filter(
    (item) =>
      !item.resolved &&
      (item.negativeVotes ?? 0) < 5
  );
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
    onAlerts(activeAlerts(sorted));
  }

  private async loadFromCache(
    onAlerts: (alerts: Alert[]) => void,
  ): Promise<void> {
    const cached = await alertsCacheService.getAlerts();
    onAlerts(activeAlerts(cached));
  }

  private async fetchRemoteAlerts(): Promise<Alert[]> {
    if (!supabase) {
      throw new Error('Supabase não configurado');
    }

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .gt(
        'expires_at',
        new Date().toISOString()
      )
      .order('created_at', {
        ascending: false,
      })
      .limit(100);

    if (error) {
      throw error;
    }

    return (data as AlertRow[])
      .map(mapRowToAlert)
      .filter((item): item is Alert => item !== null);
  }

  async getAlerts(): Promise<Alert[]> {
    const online = await this.checkNetwork();

    if (!online || !isSupabaseConfigured()) {
      return activeAlerts(await alertsCacheService.getAlerts());
    }

    try {
      const alerts = await this.fetchRemoteAlerts();
      await alertsCacheService.saveAlerts(alerts);
      return activeAlerts(alerts);
    } catch (error) {
      console.log('Erro getAlerts:', error);
      return activeAlerts(await alertsCacheService.getAlerts());
    }
  }

  async createAlert(
    input: CreateAlertInput,
  ): Promise<Alert | null> {
    const lat = Number(input.latitude);
    const lng = Number(input.longitude);

    if (!isValidCoordinates(lat, lng)) {
      return null;
    }

    const payload = {
      title: input.title,
      type: input.type ?? DEFAULT_TYPE,
      latitude: lat,
      longitude: lng,
      time: new Date().toLocaleTimeString(),
      confirmations: 0,
      resolved: false,
      location_name: input.locationName ?? 'A determinar',
      expires_at: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString(),
    };

    const online = await this.checkNetwork();

    if (!online || !supabase) {
      const tempAlert: Alert = {
        id: `local-${Date.now()}`,
        title: payload.title,
        type: payload.type as AlertType,
        latitude: lat,
        longitude: lng,
        time: payload.time,
        confirmations: 0,
        resolved: false,
        locationName: payload.location_name,
        distance: 0,
        createdAt: new Date().toISOString(),
      };

      const cached = await alertsCacheService.getAlerts();
      cached.unshift(tempAlert);
      await alertsCacheService.saveAlerts(cached);

      await alertsCacheService.enqueuePending({
        id: `pending-${Date.now()}`,
        kind: 'create',
        payload: input,
        createdAt: new Date().toISOString(),
      });

      return tempAlert;
    }

    try {
      const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return mapRowToAlert(data as AlertRow);
    } catch (error) {
      console.log('Erro createAlert:', error);

      await alertsCacheService.enqueuePending({
        id: `pending-${Date.now()}`,
        kind: 'create',
        payload: input,
        createdAt: new Date().toISOString(),
      });

      return null;
    }
  }

  async confirmAlert(id: string): Promise<Alert | null> {
    const online = await this.checkNetwork();

    if (!online || !supabase) {
      const cached = await alertsCacheService.getAlerts();
      const index = cached.findIndex((item) => item.id === id);

      if (index === -1) {
        return null;
      }

      cached[index] = {
        ...cached[index],
        confirmations: cached[index].confirmations + 1,
      };

      await alertsCacheService.saveAlerts(cached);

      await alertsCacheService.enqueuePending({
        id: `pending-${Date.now()}`,
        kind: 'confirm',
        alertId: id,
        createdAt: new Date().toISOString(),
      });

      return cached[index];
    }

    try {
      const current = await this.getAlertById(id);

      if (!current) {
        return null;
      }

      const { data, error } = await supabase
        .from(TABLE)
        .update({
          confirmations: current.confirmations + 1,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return mapRowToAlert(data as AlertRow);
    } catch (error) {
      console.log('Erro confirmAlert:', error);
      return null;
    }
  }

  async resolveAlert(id: string): Promise<Alert | null> {
    const online = await this.checkNetwork();

    if (!online || !supabase) {
      const cached = await alertsCacheService.getAlerts();
      const index = cached.findIndex((item) => item.id === id);

      if (index === -1) {
        return null;
      }

      cached[index] = {
        ...cached[index],
        resolved: true,
      };

      await alertsCacheService.saveAlerts(cached);

      await alertsCacheService.enqueuePending({
        id: `pending-${Date.now()}`,
        kind: 'resolve',
        alertId: id,
        createdAt: new Date().toISOString(),
      });

      return cached[index];
    }

    try {
      const { data, error } = await supabase
        .from(TABLE)
        .update({ resolved: true })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return mapRowToAlert(data as AlertRow);
    } catch (error) {
      console.log('Erro resolveAlert:', error);
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
      console.log('Erro deleteAlert:', error);
      return false;
    }
  }

  async voteAlert(
    alertId: string,
    positive: boolean,
  ): Promise<boolean> {
    if (!supabase) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('positive_votes, negative_votes')
        .eq('id', alertId)
        .maybeSingle();

      if (error || !data) {
        throw error ?? new Error('Alerta não encontrado');
      }

      const field = positive
        ? 'positive_votes'
        : 'negative_votes';

      const currentValue = Number(data[field] ?? 0);

      const { error: updateError } = await supabase
        .from(TABLE)
        .update({
          [field]: currentValue + 1,
        })
        .eq('id', alertId);

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (error) {
      console.log('Erro voteAlert:', error);
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
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        return undefined;
      }

      return mapRowToAlert(data as AlertRow) ?? undefined;
    } catch {
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

    const without = alerts.filter((item) => item.id !== mapped.id);
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

    const remaining: PendingMutation[] = [];

    for (const mutation of pending) {
      try {
        if (mutation.kind === 'create') {
          const lat = Number(mutation.payload.latitude);
          const lng = Number(mutation.payload.longitude);

          const { error } = await supabase.from(TABLE).insert({
            title: mutation.payload.title,
            type: mutation.payload.type ?? DEFAULT_TYPE,
            latitude: lat,
            longitude: lng,
            time: new Date().toLocaleTimeString(),
            confirmations: 0,
            resolved: false,
            location_name:
              mutation.payload.locationName ?? 'A determinar',
            expires_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
          });

          if (error) {
            throw error;
          }
        }

        if (mutation.kind === 'confirm') {
          const current = await this.getAlertById(
            mutation.alertId,
          );

          if (!current) {
            throw new Error('Alerta não encontrado');
          }

          const { error } = await supabase
            .from(TABLE)
            .update({
              confirmations: current.confirmations + 1,
            })
            .eq('id', mutation.alertId);

          if (error) {
            throw error;
          }
        }

        if (mutation.kind === 'resolve') {
          const { error } = await supabase
            .from(TABLE)
            .update({ resolved: true })
            .eq('id', mutation.alertId);

          if (error) {
            throw error;
          }
        }

        if (mutation.kind === 'delete') {
          const { error } = await supabase
            .from(TABLE)
            .delete()
            .eq('id', mutation.alertId);

          if (error) {
            throw error;
          }
        }
      } catch {
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
        console.log('Erro refresh alertas:', error);
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
