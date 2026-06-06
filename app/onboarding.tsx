import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import {
  router,
} from 'expo-router';

import GradientBackground from '../components/ui/GradientBackground';

export default function OnboardingScreen() {

  function handleStart() {

    router.replace(
      '/login'
    );

  }

  return (

    <GradientBackground>

      <View style={styles.container}>

        <Text style={styles.title}>
          Comunidade que protege caminhoneiros
        </Text>

        <Text style={styles.subtitle}>
          Alertas em tempo real, segurança e informações da estrada.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleStart}
        >

          <Text style={styles.buttonText}>
            Vamos começar
          </Text>

        </TouchableOpacity>

      </View>

    </GradientBackground>

  );

}

const styles = StyleSheet.create({

  container: {

    flex: 1,

    justifyContent: 'center',

    padding: 30,

  },

  title: {

    color: '#ffffff',

    fontSize: 34,

    fontWeight: '800',

    marginBottom: 20,

  },

  subtitle: {

    color: '#94a3b8',

    fontSize: 16,

    lineHeight: 24,

    marginBottom: 40,

  },

  button: {

    backgroundColor: '#f97316',

    paddingVertical: 18,

    borderRadius: 14,

    alignItems: 'center',

  },

  buttonText: {

    color: '#ffffff',

    fontWeight: '700',

    fontSize: 16,

  },

});