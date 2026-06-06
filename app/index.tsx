import React, {
  useEffect,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import {
  router,
} from 'expo-router';

import GradientBackground from '../components/ui/GradientBackground';

import {
  useAuth,
} from '../src/context/AuthContext';

export default function SplashScreen() {
  const {
    session,
    loading,
  } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    const timer = setTimeout(() => {

      router.replace(
        session
          ? '/(tabs)/radar'
          : '/onboarding'
      );

    }, 2500);

    return () => {
      clearTimeout(timer);
    };

  }, [
    loading,
    session,
  ]);

  return (

    <GradientBackground>

      <View style={styles.container}>

        <Text style={styles.logo}>
          TRUXAFE
        </Text>

        <Text style={styles.loading}>
          {loading
            ? 'Restaurando sessão...'
            : 'Verificando segurança...'}
        </Text>

        {loading && (
          <ActivityIndicator
            color="#f97316"
            style={styles.spinner}
          />
        )}

      </View>

    </GradientBackground>

  );

}

const styles = StyleSheet.create({

  container: {

    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

  },

  logo: {

    fontSize: 48,

    fontWeight: '900',

    color: '#ffffff',

    letterSpacing: 4,

  },

  loading: {

    marginTop: 20,

    color: '#f97316',

    fontSize: 14,

  },

  spinner: {

    marginTop: 20,

  },

});