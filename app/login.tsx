import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

import { router } from 'expo-router';

import GradientBackground from '../components/ui/GradientBackground';

import { authService } from '../src/services/auth.service';

import { useAuth } from '../src/context/AuthContext';

export default function LoginScreen() {
  const { user } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)/radar');
    }
  }, [user]);

  async function handleLogin(): Promise<void> {
    if (loading) {
      return;
    }

    try {
      if (!email.trim() || !password.trim()) {
        Alert.alert(
          'Erro',
          'Preencha email e senha'
        );

        return;
      }

      setLoading(true);

      const normalizedEmail = email
        .trim()
        .toLowerCase();

      console.log('====================');
      console.log('LOGIN ATTEMPT');
      console.log('EMAIL:', normalizedEmail);
      console.log('====================');

      const result =
        await authService.signInWithPassword(
          normalizedEmail,
          password
        );

      console.log('====================');
      console.log('LOGIN SUCCESS');
      console.log(result);
      console.log('====================');
    } catch (error: unknown) {
      console.log('====================');
      console.log('LOGIN ERROR');
      console.log(error);
      console.log('====================');

      let message = 'Falha no login';

      if (
        error &&
        typeof error === 'object' &&
        'message' in error
      ) {
        message = String(error.message);
      }

      Alert.alert(
        'Erro',
        message
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin(): Promise<void> {
    if (loading) {
      return;
    }

    try {
      setLoading(true);

      console.log('====================');
      console.log('GOOGLE LOGIN START');
      console.log('====================');

      await authService.signInWithGoogle();

      console.log('====================');
      console.log('GOOGLE LOGIN SUCCESS');
      console.log('====================');
    } catch (error: unknown) {
      console.log('====================');
      console.log('GOOGLE LOGIN ERROR');
      console.log(error);
      console.log('====================');

      let message = 'Falha no login Google';

      if (
        error &&
        typeof error === 'object' &&
        'message' in error
      ) {
        message = String(error.message);
      }

      Alert.alert(
        'Erro',
        message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.logo}>
          TRUXAFE
        </Text>

        <Text style={styles.title}>
          Entrar
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TextInput
          placeholder="Senha"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <TouchableOpacity
          style={[
            styles.loginButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading
              ? 'Entrando...'
              : 'Entrar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.googleButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <Text style={styles.googleButtonText}>
            Continuar com Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push('/register')
          }
        >
          <Text style={styles.registerText}>
            Não possui conta? Criar conta
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
    paddingHorizontal: 28,
  },

  logo: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 20,
    letterSpacing: 4,
  },

  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 40,
  },

  input: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  loginButton: {
    backgroundColor: '#f97316',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 18,
  },

  loginButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },

  googleButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },

  googleButtonText: {
    color: '#111827',
    fontWeight: '700',
  },

  registerText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 26,
  },

  disabledButton: {
    opacity: 0.7,
  },
});