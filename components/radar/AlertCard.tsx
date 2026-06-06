import React, { useRef } from 'react';

import {
  Button,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from 'react-native';

import { alertsApiService } from '../../src/services/alertsApi.service';

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

type ActionButtonProps = {
  label: string;
  emoji: string;
  onPress: () => void;
  variant: 'confirm' | 'resolve' | 'details';
  disabled?: boolean;
};

function ActionButton({
  label,
  emoji,
  onPress,
  variant,
  disabled = false,
}: ActionButtonProps): React.ReactElement {
  const scale = useRef(new Animated.Value(1)).current;

  const animatePress = (): void => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = (): void => {
    if (disabled) {
      return;
    }

    animatePress();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        styles[`action_${variant}`],
        pressed && styles.actionPressed,
        disabled && styles.actionDisabled,
      ]}
    >
      <Animated.View style={[styles.actionInner, { transform: [{ scale }] }]}>
        <Text style={styles.actionEmoji}>{emoji}</Text>
        <Text style={styles.actionLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function AlertCard({
  alert,
  showAheadDistance = false,
  onConfirm,
  onResolve,
  onDetails,
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

      <View style={styles.actions}>
        <ActionButton
          label="Confirmar"
          emoji="👍"
          onPress={onConfirm}
          variant="confirm"
          disabled={isResolved}
        />
        <ActionButton
          label="Resolvido"
          emoji="❌"
          onPress={onResolve}
          variant="resolve"
          disabled={isResolved}
        />
        <ActionButton
          label="Detalhes"
          emoji="ℹ️"
          onPress={onDetails}
          variant="details"
        />
      </View>

      <View style={styles.voteActions}>
        <Button
          title="👍 Confirmar"
          onPress={() =>
            alertsApiService.voteAlert(
              alert.id,
              true,
            )
          }
        />
        <Button
          title="👎 Não existe"
          onPress={() =>
            alertsApiService.voteAlert(
              alert.id,
              false,
            )
          }
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

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 8,
  },

  voteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },

  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },

  action_confirm: {
    backgroundColor: '#1d4ed8',
  },

  action_resolve: {
    backgroundColor: '#b91c1c',
  },

  action_details: {
    backgroundColor: '#334155',
  },

  actionPressed: {
    opacity: 0.88,
  },

  actionDisabled: {
    opacity: 0.45,
  },

  actionInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },

  actionEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },

  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
  },
});
