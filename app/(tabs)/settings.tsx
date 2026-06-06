import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';

import GradientBackground from '../../components/ui/GradientBackground';

export default function SettingsScreen() {
  return (
    <GradientBackground>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Configurações
        </Text>

        <Text style={styles.subtitle}>
          Personalize seu sistema TruckGuard AI
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.cardTitle}>
                Monitoramento Inteligente
              </Text>

              <Text style={styles.cardText}>
                IA monitora áreas perigosas
              </Text>
            </View>

            <Switch value />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.cardTitle}>
                Alertas em Tempo Real
              </Text>

              <Text style={styles.cardText}>
                Receber alertas da comunidade
              </Text>
            </View>

            <Switch value />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.cardTitle}>
                Compartilhar location
              </Text>

              <Text style={styles.cardText}>
                Compartilhamento seguro da rota
              </Text>
            </View>

            <Switch value={false} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.cardTitle}>
                Modo Comboio
              </Text>

              <Text style={styles.cardText}>
                Detectar caminhões próximos
              </Text>
            </View>

            <Switch value />
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            TruckGuard AI Enterprise
          </Text>

          <Text style={styles.infoText}>
            Sistema avançado de proteção,
            rastreamento e inteligência logística.
          </Text>
        </View>
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

    padding: 24,

    marginBottom: 22,

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.05)',

    boxShadow:
      '0px 0px 25px rgba(0,0,0,0.25)',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },

  cardText: {
    color: '#94A3B8',
    fontSize: 15,
    maxWidth: 220,
    lineHeight: 24,
  },

  infoCard: {
    backgroundColor:
      'rgba(255,122,0,0.12)',

    borderRadius: 30,

    padding: 28,

    marginTop: 10,

    marginBottom: 50,

    borderWidth: 1,

    borderColor:
      'rgba(255,122,0,0.25)',

    boxShadow:
      '0px 0px 30px rgba(255,122,0,0.15)',
  },

  infoTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 16,
  },

  infoText: {
    color: '#FED7AA',
    fontSize: 16,
    lineHeight: 30,
  },
});