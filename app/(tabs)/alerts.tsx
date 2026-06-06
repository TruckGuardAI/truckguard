import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

import GradientBackground from '../../components/ui/GradientBackground';

const alerts = [
  {
    id: 1,
    type: 'Roubo reportado',
    location: 'BR-116 • Km 220',
    time: '2 minutos atrás',
    color: '#DC2626',
    icon: '🚨',
  },

  {
    id: 2,
    type: 'Área perigosa',
    location: 'Posto abandonado',
    time: '12 minutos atrás',
    color: '#F59E0B',
    icon: '⚠️',
  },

  {
    id: 3,
    type: 'Área segura',
    location: 'Pátio monitorado',
    time: '20 minutos atrás',
    color: '#16A34A',
    icon: '🛡️',
  },
];

export default function AlertsScreen() {
  return (
    <GradientBackground>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Alertas Inteligentes
        </Text>

        <Text style={styles.subtitle}>
          Informações em tempo real da comunidade
        </Text>

        {alerts.map((alert) => (
          <View
            key={alert.id}
            style={[
              styles.card,
              {
                borderLeftColor:
                  alert.color,
              },
            ]}
          >
            <View style={styles.row}>
              <View
                style={[
                  styles.iconWrapper,
                  {
                    backgroundColor:
                      alert.color,
                  },
                ]}
              >
                <Text style={styles.icon}>
                  {alert.icon}
                </Text>
              </View>

              <View style={styles.content}>
                <Text style={styles.cardTitle}>
                  {alert.type}
                </Text>

                <Text style={styles.location}>
                  {alert.location}
                </Text>

                <Text style={styles.time}>
                  {alert.time}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 10,
  },

  subtitle: {
    color: '#94A3B8',
    fontSize: 16,
    marginBottom: 34,
  },

  card: {
    backgroundColor:
      'rgba(15,23,42,0.92)',

    borderRadius: 28,

    padding: 22,

    marginBottom: 22,

    borderLeftWidth: 6,

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.05)',

    boxShadow:
      '0px 0px 25px rgba(0,0,0,0.25)',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconWrapper: {
    width: 64,
    height: 64,

    borderRadius: 20,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 18,
  },

  icon: {
    fontSize: 30,
  },

  content: {
    flex: 1,
  },

  cardTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },

  location: {
    color: '#CBD5E1',
    fontSize: 17,
    marginBottom: 8,
  },

  time: {
    color: '#64748B',
    fontSize: 15,
  },
});