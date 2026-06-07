import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

const CHANNEL_NAME = 'alerts-realtime';
const TABLE = 'alerts';

type AlertsRealtimeListener = () => void;

type AlertChangePayload =
  RealtimePostgresChangesPayload<{
    [key: string]: unknown;
  }>;

class RealtimeService {
  private channel: RealtimeChannel | null =
    null;

  private readonly listeners =
    new Set<AlertsRealtimeListener>();

  startAlertsRealtime(
    onAlertChange: AlertsRealtimeListener,
  ): () => void {
    this.listeners.add(onAlertChange);
    this.ensureChannel();

    return () => {
      this.stopAlertsRealtime(
        onAlertChange,
      );
    };
  }

  stopAlertsRealtime(
    onAlertChange: AlertsRealtimeListener,
  ): void {
    this.listeners.delete(
      onAlertChange,
    );

    if (this.listeners.size === 0) {
      this.teardownChannel();
    }
  }

  private notifyListeners(
    payload: AlertChangePayload,
  ): void {
    console.log(
      'REALTIME_ALERT',
      payload,
    );

    this.listeners.forEach(
      (listener) => {
        listener();
      },
    );
  }

  private ensureChannel(): void {
    if (
      this.channel ||
      !supabase ||
      !isSupabaseConfigured()
    ) {
      return;
    }

    this.channel = supabase
      .channel(CHANNEL_NAME)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLE,
        },
        (payload) => {
          this.notifyListeners(
            payload as AlertChangePayload,
          );
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(
            'REALTIME_CONNECTED',
          );
        }

        if (
          status === 'CLOSED' ||
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT'
        ) {
          console.log(
            'REALTIME_DISCONNECTED',
            status,
          );
        }
      });
  }

  private teardownChannel(): void {
    if (!this.channel) {
      return;
    }

    console.log(
      'REALTIME_DISCONNECTED',
    );

    this.channel.unsubscribe();
    this.channel = null;
  }
}

export const realtimeService =
  new RealtimeService();

export function startAlertsRealtime(
  onAlertChange: AlertsRealtimeListener,
): () => void {
  return realtimeService.startAlertsRealtime(
    onAlertChange,
  );
}

export function stopAlertsRealtime(
  onAlertChange: AlertsRealtimeListener,
): void {
  realtimeService.stopAlertsRealtime(
    onAlertChange,
  );
}
