import React from 'react';

import {
  Button,
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';

import { alertsApiService } from '../../src/services/alertsApi.service';
import { navigationService } from '../../src/services/navigation.service';

import type {
  Alert,
  AlertAlongRoute,
  AlertType,
} from '../../src/types/alert.types';

type Props = {
  alert: Alert | AlertAlongRoute | null;
  showAheadDistance?: boolean;
  onConfirm: () => void;
  onResolve: () => void;
  onDetails: () => void;
};

function isAlongRoute(
  alert: Alert | AlertAlongRoute,
): alert is AlertAlongRoute {
  return 'distanceAheadKm' in alert;
}

const TYPE_LABELS: Record<AlertType, string> = {
  fuel: 'Furto combustível',
  pallet: 'Carga / paletes',
  full_attack: 'Ataque completo',
  obstacle: 'Obstáculo na via',
  mechanic: 'Assistência mecânica',
  rest: 'Área de descanso',
  sos: 'Pedido de ajuda SOS',
};

const TYPE_EMOJI: Record<AlertType, string> = {
  fuel: '⛽',
  pallet: '📦',
  full_attack: '🚨',
  obstacle: '🚧',
  mechanic: '🔧',
  rest: '🛌',
  sos: '🆘',
};

function formatDistance(distance: number): string {
  if (!Number.isFinite(distance)) {
    return '—';
  }

  return `${distance.toFixed(1)}km`;
}

export default function AlertCard({
  alert,
  showAheadDistance = false,
  onConfirm: _onConfirm,
  onResolve: _onResolve,
  onDetails: _onDetails,
}: Props): React.ReactElement | null {
  if (!alert) {
    return null;
  }

  const typeLabel = TYPE_LABELS[alert.type] ?? alert.title;
  const typeEmoji = TYPE_EMOJI[alert.type] ?? '🚨';
  const location = alert.locationName ?? 'A determinar';
  const distanceText =
    showAheadDistance && isAlongRoute(alert)
      ? `${alert.distanceAheadKm.toFixed(1)}km à frente`
      : formatDistance(alert.distance);
  const isResolved = alert.resolved;

  return (
    <View style={[styles.card, isResolved && styles.cardResolved]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          {typeEmoji} {typeLabel}
        </Text>
        {isResolved && (
          <View style={styles.resolvedBadge}>
            <Text style={styles.resolvedBadgeText}>Resolvido</Text>
          </View>
        )}
      </View>

      <Text style={styles.row}>📍 {location}</Text>
      <Text style={styles.row}>🕒 {alert.time}</Text>
      <Text style={styles.row}>
        👥 {alert.confirmations}{' '}
        {alert.confirmations === 1 ? 'confirmação' : 'confirmações'}
      </Text>
      <Text style={styles.row}>
        👍 {alert.positiveVotes}
        {' '}
        👎 {alert.negativeVotes}
      </Text>

      <Text
        key={`distance-${alert.id}-${distanceText}`}
        style={styles.row}
      >
        📏 {distanceText}
      </Text>

      {alert.title.length > 0 && alert.title !== typeLabel && (
        <Text style={styles.subtitle}>{alert.title}</Text>
      )}

      <View style={styles.voteActions}>
        <Button
          title="👍 CONFIRMAR"
          onPress={() => {
            alertsApiService.voteAlert(
              alert.id,
              true,
            );
          }}
        />
        <Button
          title="👎 NÃO EXISTE"
          onPress={() => {
            alertsApiService.voteAlert(
              alert.id,
              false,
            );
          }}
        />
      </View>

      <View style={styles.navigationActions}>
        <Button
          title="🗺 GOOGLE MAPS"
          onPress={() => {
            navigationService.openGoogleMaps(
              alert.latitude,
              alert.longitude,
            );
          }}
        />
        <Button
          title="🗺 WAZE"
          onPress={() => {
            navigationService.openWaze(
              alert.latitude,
              alert.longitude,
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    ...Platform.select({
      web: {
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
      },
      default: {
        elevation: 8,
      },
    }),
  },

  cardResolved: {
    opacity: 0.85,
    borderColor: '#334155',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    marginRight: 8,
  },

  resolvedBadge: {
    backgroundColor: '#14532d',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  resolvedBadgeText: {
    color: '#86efac',
    fontSize: 11,
    fontWeight: '700',
  },

  row: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 6,
    lineHeight: 20,
  },

  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 4,
  },

  voteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 8,
  },

  navigationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
});
