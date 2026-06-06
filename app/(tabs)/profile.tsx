import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';

import GradientBackground from '../../components/ui/GradientBackground';

import {
  useAuth,
} from '../../src/context/AuthContext';

import {
  router,
} from 'expo-router';

export default function ProfileScreen() {

  const {
    user,
    signOut,
  } = useAuth();

  /*
   * LOGOUT
   */
  async function handleLogout() {

    try {

      await signOut();

      router.replace(
        '/login'
      );

    } catch (error) {

      console.log(
        'Erro logout:',
        error
      );

      Alert.alert(
        'Erro',
        'Falha ao sair'
      );

    }

  }

  return (

    <GradientBackground>

      <View style={styles.container}>

        <Image
          source={{
            uri:
              user?.user_metadata
                ?.avatar_url ||
              'https://i.pravatar.cc/300',
          }}
          style={styles.avatar}
        />

        <Text style={styles.name}>

          {
            user?.user_metadata
              ?.full_name ||
            'Utilizador'
          }

        </Text>

        <Text style={styles.email}>
          {user?.email}
        </Text>

        <View style={styles.card}>

          <Text style={styles.cardTitle}>
            Conta
          </Text>

          <Text style={styles.cardText}>
            Plano: Free
          </Text>

          <Text style={styles.cardText}>
            Segurança ativa
          </Text>

        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >

          <Text style={styles.logoutText}>
            Sair da conta
          </Text>

        </TouchableOpacity>

      </View>

    </GradientBackground>

  );

}

const styles = StyleSheet.create({

  container: {

    flex: 1,

    alignItems: 'center',

    paddingTop: 100,

    paddingHorizontal: 24,

  },

  avatar: {

    width: 120,

    height: 120,

    borderRadius: 60,

    marginBottom: 20,

    borderWidth: 3,

    borderColor: '#f97316',

  },

  name: {

    color: '#ffffff',

    fontSize: 28,

    fontWeight: '800',

    marginBottom: 8,

  },

  email: {

    color: '#94a3b8',

    fontSize: 15,

    marginBottom: 40,

  },

  card: {

    width: '100%',

    backgroundColor: '#0f172a',

    borderRadius: 18,

    padding: 20,

    marginBottom: 40,

  },

  cardTitle: {

    color: '#ffffff',

    fontSize: 18,

    fontWeight: '700',

    marginBottom: 16,

  },

  cardText: {

    color: '#cbd5e1',

    marginBottom: 10,

    fontSize: 15,

  },

  logoutButton: {

    backgroundColor: '#ef4444',

    width: '100%',

    paddingVertical: 18,

    borderRadius: 16,

    alignItems: 'center',

  },

  logoutText: {

    color: '#ffffff',

    fontWeight: '800',

    fontSize: 16,

  },

});