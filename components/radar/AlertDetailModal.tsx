import React, {
  useCallback,
  useEffect,
} from 'react';

import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import type {
  Alert,
  AlertAlongRoute,
} from '../../src/types/alert.types';

import type { AlertVotesSummary } from '../../src/services/vote.service';

import AlertCard from './AlertCard';

type Props = {
  visible: boolean;
  alert: Alert | AlertAlongRoute | null;
  showAheadDistance?: boolean;
  onClose: () => void;
  onVoted?: (
    summary: AlertVotesSummary,
  ) => void;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },

  cardWrapper: {
    maxHeight: '88%',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  cardScroll: {
    flexGrow: 0,
  },
});

export default function AlertDetailModal({
  visible,
  alert,
  showAheadDistance = false,
  onClose,
  onVoted,
}: Props): React.ReactElement {
  const handleClose = useCallback(() => {
    console.log('LOG_ALERT_MODAL_CLOSE', {
      alertId: alert?.id ?? null,
    });

    onClose();
  }, [alert?.id, onClose]);

  useEffect(() => {
    if (!visible || !alert) {
      return;
    }

    console.log('LOG_ALERT_MODAL_OPEN', {
      alertId: alert.id,
    });
  }, [visible, alert]);

  return (
    <Modal
      visible={visible && Boolean(alert)}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdropPressable}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        />

        {alert ? (
          <View style={styles.cardWrapper}>
            <ScrollView
              style={styles.cardScroll}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={
                false
              }
            >
              <AlertCard
                alert={alert}
                showAheadDistance={
                  showAheadDistance
                }
                onClose={handleClose}
                onVoted={onVoted}
              />
            </ScrollView>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
