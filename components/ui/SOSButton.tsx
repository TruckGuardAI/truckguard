import React from 'react';

import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';

type SOSButtonProps = {
  latitude?: number;
  longitude?: number;
};

export default function SOSButton({
  latitude,
  longitude,
}: SOSButtonProps) {
  async function handleSOS() {
    try {
      Alert.alert(
        'SOS Ativado',
        `location enviada.\n\nLatitude: ${latitude}\nLongitude: ${longitude}`,
      );

      /**
       * FUTURO BACKEND:
       *
       * await api.post('/sos', {
       *   latitude,
       *   longitude,
       *   timestamp: new Date(),
       * });
       */

      console.log('SOS enviado');
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Erro',
        'Não foi possível enviar SOS.'
      );
    }
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleSOS}
      activeOpacity={0.8}
    >
      <Text style={styles.sos}>
        SOS
      </Text>

      <Text style={styles.text}>
        Emergência
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 88,
    backgroundColor: '#dc2626',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,

    shadowColor: '#dc2626',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 12,
  },

  sos: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 3,
  },

  text: {
    color: '#fecaca',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});