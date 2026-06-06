import React from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  background: '#06090D',
  card: 'rgba(18,22,30,0.96)',
  border: 'rgba(255,255,255,0.06)',
  text: '#F3F4F6',
  muted: '#9CA3AF',
  primary: '#D97706',
  success: '#4F7D62',
  danger: '#DC2626',
};

const DEVICES = [
  {
    id: 1,
    name: 'Tank Sensor',
    status: 'Connected',
    battery: '92%',
    icon: 'water-outline',
    active: true,
  },

  {
    id: 2,
    name: 'Cabin Motion',
    status: 'Connected',
    battery: '81%',
    icon: 'shield-outline',
    active: true,
  },

  {
    id: 3,
    name: 'Cargo Vibration',
    status: 'Disconnected',
    battery: '--',
    icon: 'cube-outline',
    active: false,
  },
];

export default function SensorsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          TRUXAFE Sensors
        </Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>
            Bluetooth Monitoring
          </Text>

          <Text style={styles.heroNumber}>
            2 Active
          </Text>

          <Text style={styles.heroSub}>
            Tactical vehicle perimeter monitoring enabled
          </Text>
        </View>

        <View style={styles.listContainer}>
          {DEVICES.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.sensorCard,
                pressed && styles.sensorPressed,
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: item.active
                      ? 'rgba(79,125,98,0.14)'
                      : 'rgba(255,255,255,0.05)',
                  },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={
                    item.active
                      ? COLORS.success
                      : COLORS.muted
                  }
                />
              </View>

              <View style={styles.sensorContent}>
                <Text style={styles.sensorName}>
                  {item.name}
                </Text>

                <Text style={styles.sensorStatus}>
                  {item.status}
                </Text>
              </View>

              <View style={styles.rightBlock}>
                <Text style={styles.batteryText}>
                  {item.battery}
                </Text>

                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: item.active
                        ? COLORS.success
                        : COLORS.danger,
                    },
                  ]}
                />
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.shopCard}>
          <View style={styles.shopTop}>
            <Ionicons
              name="hardware-chip-outline"
              size={24}
              color={COLORS.primary}
            />

            <Text style={styles.shopTitle}>
              TRUXAFE Security Kit
            </Text>
          </View>

          <Text style={styles.shopText}>
            Add wireless tactical sensors for diesel,
            cabin and cargo monitoring.
          </Text>

          <Pressable style={styles.shopButton}>
            <Text style={styles.shopButtonText}>
              Explore Hardware
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 22,
  },

  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    marginTop: 40,
    letterSpacing: 2,
  },

  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 26,
  },

  heroLabel: {
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },

  heroNumber: {
    color: COLORS.primary,
    fontSize: 52,
    fontWeight: '800',
    marginTop: 10,
  },

  heroSub: {
    color: COLORS.text,
    marginTop: 10,
    lineHeight: 22,
  },

  listContainer: {
    gap: 16,
  },

  sensorCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  sensorPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sensorContent: {
    flex: 1,
  },

  sensorName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },

  sensorStatus: {
    color: COLORS.muted,
    marginTop: 4,
  },

  rightBlock: {
    alignItems: 'center',
    gap: 8,
  },

  batteryText: {
    color: COLORS.text,
    fontWeight: '700',
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  shopCard: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    marginTop: 10,
  },

  shopTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  shopTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },

  shopText: {
    color: COLORS.muted,
    marginTop: 14,
    lineHeight: 22,
  },

  shopButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },

  shopButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});