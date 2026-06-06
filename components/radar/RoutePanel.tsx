import React, { useMemo } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import type { AlertAlongRoute } from '../../src/types/alert.types';

import type { CalculatedRoute } from '../../src/types/route.types';

import type { AlertType } from '../../src/types/alert.types';

const TYPE_LABELS: Record<AlertType, string> = {
  fuel: 'Furto combustível',
  pallet: 'Furto carga',
  full_attack: 'Ataque completo',
  obstacle: 'Obstáculo',
  mechanic: 'Mecânica',
  rest: 'Descanso',
  sos: 'SOS',
};

const TYPE_EMOJI: Record<AlertType, string> = {
  fuel: '🚨',
  pallet: '📦',
  full_attack: '🚨',
  obstacle: '⚠️',
  mechanic: '🔧',
  rest: '🛌',
  sos: '🆘',
};

type Props = {
  route: CalculatedRoute | null;
  routeAlerts: AlertAlongRoute[];
  loading?: boolean;
  error?: string | null;
  userProgressKm?: number;
};

function formatAhead(km: number): string {
  return `${km.toFixed(1)}km à frente`;
}

export default function RoutePanel({
  route,
  routeAlerts,
  loading = false,
  error = null,
  userProgressKm,
}: Props): React.ReactElement | null {
  const listItems = useMemo(
    () =>
      routeAlerts.map((alert) => ({
        id: alert.id,
        emoji: TYPE_EMOJI[alert.type] ?? '⚠️',
        label: TYPE_LABELS[alert.type] ?? alert.title,
        ahead: formatAhead(alert.distanceAheadKm),
      })),
    [routeAlerts],
  );

  if (!route && !loading) {
    return null;
  }

  return (
    <View style={styles.panel}>
      {route !== null && (
        <View style={styles.routeHeader}>
          <Text style={styles.routePoint}>
            📍 {route.origin.name}
          </Text>
          <Text style={styles.routeArrow}>⬇</Text>
          <Text style={styles.routePoint}>
            📍 {route.destination.name}
          </Text>
          {userProgressKm !== undefined && (
            <Text style={styles.progress}>
              Percorridos: {userProgressKm.toFixed(1)}km /{' '}
              {route.distanceKm.toFixed(0)}km
            </Text>
          )}
        </View>
      )}

      <Text style={styles.sectionTitle}>
        ⚠️ Alertas na rota:
      </Text>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#f97316" />
          <Text style={styles.loadingText}>
            Calculando rota...
          </Text>
        </View>
      )}

      {error !== null && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {!loading && listItems.length === 0 && (
        <Text style={styles.emptyText}>
          Nenhum alerta na rota (corredor 2km)
        </Text>
      )}

      {listItems.map((item) => (
        <View key={item.id} style={styles.alertRow}>
          <Text style={styles.alertLine}>
            {item.emoji} {item.label}
          </Text>
          <Text style={styles.aheadLine}>{item.ahead}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginBottom: 12,
  },

  routeHeader: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },

  routePoint: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },

  routeArrow: {
    color: '#64748b',
    fontSize: 18,
    marginVertical: 4,
    textAlign: 'center',
  },

  progress: {
    marginTop: 10,
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },

  sectionTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },

  alertRow: {
    marginBottom: 10,
  },

  alertLine: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '700',
  },

  aheadLine: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
    marginLeft: 4,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },

  loadingText: {
    color: '#94a3b8',
    fontSize: 13,
  },

  errorText: {
    color: '#f87171',
    fontSize: 13,
    marginBottom: 8,
  },

  emptyText: {
    color: '#64748b',
    fontSize: 13,
  },
});
