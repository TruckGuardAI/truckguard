import React, {
  useState,
} from 'react';

import { useTranslation } from 'react-i18next';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';

import {
  router,
} from 'expo-router';

import GradientBackground from '../components/ui/GradientBackground';

import { useTheme } from '../src/context/ThemeContext';
import { useThemedStyles } from '../src/hooks/useThemedStyles';

import {
  supabase,
} from '../src/lib/supabase';

import type { AppThemeTokens } from '../src/theme/palettes';

function createStyles(theme: AppThemeTokens) {
  const { colors, components } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
    },

    logo: {
      fontSize: 42,
      fontWeight: '900',
      color: colors.textPrimary,
      marginBottom: 20,
      letterSpacing: 4,
    },

    title: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '800',
      marginBottom: 40,
    },

    input: {
      backgroundColor: components.inputBackground,
      color: components.inputText,
      paddingVertical: 16,
      paddingHorizontal: 18,
      borderRadius: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: components.inputBorder,
    },

    button: {
      backgroundColor: components.buttonPrimaryBg,
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 10,
    },

    buttonText: {
      color: components.buttonPrimaryText,
      fontWeight: '800',
      fontSize: 16,
    },

    loginText: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 26,
    },
  });
}

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [
    name,
    setName,
  ] = useState('');

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(false);

  async function handleRegister() {
    try {
      if (
        !name ||
        !email ||
        !password ||
        !confirmPassword
      ) {
        Alert.alert(
          t('common.error'),
          t('auth.fillAllFields'),
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        Alert.alert(
          t('common.error'),
          t('auth.passwordMismatch'),
        );

        return;
      }

      if (
        password.length < 6
      ) {
        Alert.alert(
          t('common.error'),
          t('auth.passwordTooShort'),
        );

        return;
      }

      setLoading(true);

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

      if (error) {
        throw error;
      }

      console.log(
        'USUÁRIO:',
        data,
      );

      Alert.alert(
        t('auth.accountCreated'),
        t('auth.registerSuccess'),
      );

      router.replace(
        '/login',
      );
    } catch (error: unknown) {
      console.log(
        'Erro cadastro:',
        error,
      );

      let message = t('auth.registerFailed');

      if (
        error &&
        typeof error === 'object' &&
        'message' in error
      ) {
        message = String(error.message);
      }

      Alert.alert(
        t('common.error'),
        message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.logo}>
          {t('common.brandShort')}
        </Text>

        <Text style={styles.title}>
          {t('auth.register')}
        </Text>

        <TextInput
          placeholder={t('auth.name')}
          placeholderTextColor={theme.colors.textSecondary}
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TextInput
          placeholder={t('auth.email')}
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TextInput
          placeholder={t('auth.password')}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <TextInput
          placeholder={t('auth.confirmPassword')}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? t('auth.registering')
              : t('auth.register')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.replace('/login')
          }
        >
          <Text style={styles.loginText}>
            {t('auth.hasAccount')}
          </Text>
        </TouchableOpacity>
      </View>
    </GradientBackground>
  );
}
