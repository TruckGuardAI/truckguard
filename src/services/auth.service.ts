import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';

import { Platform } from 'react-native';

import { Session, User } from '@supabase/supabase-js';

import { logSupabaseUser, supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

interface OAuthParams {
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
  error: string | null;
}

function getAuthParams(url: string): OAuthParams {
  const parsed = new URL(url);

  const searchParams = new URLSearchParams(parsed.search);

  if (parsed.hash) {
    new URLSearchParams(
      parsed.hash.replace(/^#/, '')
    ).forEach((value, key) => {
      searchParams.set(key, value);
    });
  }

  return {
    accessToken: searchParams.get('access_token'),
    refreshToken: searchParams.get('refresh_token'),
    code: searchParams.get('code'),
    error:
      searchParams.get('error_description') ??
      searchParams.get('error'),
  };
}

function getGoogleRedirectUri(): string {
  if (Platform.OS === 'web') {
    return AuthSession.makeRedirectUri({
      path: 'login-callback',
    });
  }

  return Linking.createURL('login-callback');
}

class AuthService {
  async signInWithPassword(
    email: string,
    password: string
  ) {
    try {
      const normalizedEmail = email
        .trim()
        .toLowerCase();

      console.log('LOGIN EMAIL:', normalizedEmail);

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (error) {
        console.error(
          'SUPABASE LOGIN ERROR:',
          error
        );

        if (
          error.message
            .toLowerCase()
            .includes('email not confirmed')
        ) {
          throw new Error(
            'Este email ainda não foi confirmado. Verifique a caixa de entrada ou confirme o utilizador no painel Supabase.'
          );
        }

        throw error;
      }

      console.log(
        'LOGIN OK:',
        data.user?.email
      );

      await logSupabaseUser();

      return data;
    } catch (error) {
      console.error(
        'SIGN IN PASSWORD ERROR:',
        error
      );

      throw error;
    }
  }

  async signInWithGoogle() {
    try {
      const redirectUri =
        getGoogleRedirectUri();

      console.log(
        'GOOGLE_REDIRECT_URI',
        redirectUri,
      );

      const { data, error } =
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUri,
            skipBrowserRedirect: true,
          },
        });

      console.log(
        'GOOGLE_AUTH_URL',
        data?.url,
      );

      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error(
          'Supabase não devolveu URL OAuth.'
        );
      }

      const result =
        await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri,
        );

      console.log(
        'GOOGLE RESULT:',
        result
      );

      if (result.type !== 'success') {
        throw new Error(
          `Login cancelado (${result.type})`
        );
      }

      if (!result.url) {
        throw new Error(
          'OAuth retornou sem URL.'
        );
      }

      const authParams =
        getAuthParams(result.url);

      if (authParams.error) {
        throw new Error(authParams.error);
      }

      if (authParams.code) {
        const {
          data: sessionData,
          error: sessionError,
        } =
          await supabase.auth.exchangeCodeForSession(
            authParams.code
          );

        if (sessionError) {
          throw sessionError;
        }

        console.log(
          'AUTH_SESSION_AFTER_GOOGLE',
          sessionData.session,
        );

        await logSupabaseUser();

        return sessionData;
      }

      if (
        !authParams.accessToken ||
        !authParams.refreshToken
      ) {
        throw new Error(
          'Tokens OAuth não encontrados.'
        );
      }

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.setSession({
        access_token:
          authParams.accessToken,
        refresh_token:
          authParams.refreshToken,
      });

      if (sessionError) {
        throw sessionError;
      }

      console.log(
        'GOOGLE LOGIN OK:',
        sessionData.user?.email,
      );

      console.log(
        'AUTH_SESSION_AFTER_GOOGLE',
        sessionData.session,
      );

      await logSupabaseUser();

      return sessionData;
    } catch (error) {
      console.error(
        'GOOGLE LOGIN ERROR:',
        error
      );

      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      console.log('LOGOUT OK');
    } catch (error) {
      console.error(
        'LOGOUT ERROR:',
        error
      );

      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      return user;
    } catch (error) {
      console.error(
        'GET USER ERROR:',
        error
      );

      return null;
    }
  }

  async getSession(): Promise<Session | null> {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      return session;
    } catch (error) {
      console.error(
        'GET SESSION ERROR:',
        error
      );

      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const session =
      await this.getSession();

    return !!session;
  }
}

export const authService =
  new AuthService();