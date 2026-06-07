import React, { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

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

import { TruxafeLogo } from '../src/components/branding/TruxafeLogo';
import GoogleIcon from '../src/components/icons/GoogleIcon';

import { authService } from '../src/services/auth.service';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { useThemedStyles } from '../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../src/theme/palettes';

function createStyles(theme: AppThemeTokens) {
  const { colors, components } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingVertical: 24,
    },

    brandBlock: {
      alignItems: 'center',
      marginBottom: 20,
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

    loginButton: {
      backgroundColor: components.buttonPrimaryBg,
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
      marginBottom: 18,
    },

    loginButtonText: {
      color: components.buttonPrimaryText,
      fontWeight: '800',
      fontSize: 16,
    },

    googleButton: {
      backgroundColor: components.buttonSecondaryBg,
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },

    googleButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },

    googleButtonText: {
      color: components.buttonSecondaryText,
      fontWeight: '700',
    },

    registerText: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 26,
    },

    disabledButton: {
      opacity: 0.7,
    },
  });
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  async function handleLogin(): Promise<void> {
    if (loading) {
      return;
    }

    try {
      if (!email.trim() || !password.trim()) {
        Alert.alert(
          t('common.error'),
          t('auth.fillEmailPassword'),
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
          password,
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

      let message = t('auth.loginFailed');

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

  async function handleGoogleLogin(): Promise<void> {
    if (loading) {
      return;
    }

    try {
      setLoading(true);

      console.log('====================');
      console.log('GOOGLE LOGIN START');
      console.log('====================');

      const authResult =
        await authService.signInWithGoogle();

      console.log(
        'AUTH_SESSION_AFTER_GOOGLE',
        authResult?.session ?? null,
      );

      console.log('====================');
      console.log('GOOGLE LOGIN SUCCESS');
      console.log('====================');

    } catch (error: unknown) {
      console.log('====================');
      console.log('GOOGLE LOGIN ERROR');
      console.log(error);
      console.log('====================');

      let message = t('auth.googleLoginFailed');

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
        <View style={styles.brandBlock}>
          <TruxafeLogo
            size="login"
            centered
          />
        </View>

        <TextInput
          placeholder={t('auth.email')}
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TextInput
          placeholder={t('auth.password')}
          placeholderTextColor={theme.colors.textSecondary}
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
              ? t('auth.loggingIn')
              : t('auth.login')}
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
          <View style={styles.googleButtonContent}>
            <GoogleIcon size={20} />
            <Text style={styles.googleButtonText}>
              {t('auth.google')}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push('/register')
          }
        >
          <Text style={styles.registerText}>
            {t('auth.noAccount')}
          </Text>
        </TouchableOpacity>
      </View>
    </GradientBackground>
  );
}
