import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import type {
  Session,
  User,
} from '@supabase/supabase-js';

import { logSupabaseUser, supabase } from '../lib/supabase';

import {
  locationSyncService,
} from '../services/locationSync.service';

type AuthContextData = {

  user: User | null;

  session: Session | null;

  loading: boolean;

  signOut: () => Promise<void>;

};

const AuthContext =
  createContext<AuthContextData | undefined>(
    undefined
  );

type Props = {

  children: React.ReactNode;

};

export function AuthProvider({
  children,
}: Props) {

  const [
    user,
    setUser,
  ] = useState<User | null>(
    null
  );

  const [
    session,
    setSession,
  ] = useState<Session | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {

    /*
     * Carrega sessão atual
     */
    async function initialize() {

      try {

        const {
          data,
          error,
        } =
          await supabase.auth.getSession();

        if (error) {

          throw error;

        }

        console.log(
          'AUTH_SESSION',
          data.session,
        );

        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        console.log(
          'AUTH_USER',
          authUser,
        );

        setSession(
          data.session,
        );

        setUser(
          authUser ??
            data.session?.user ??
            null,
        );

        if (authUser) {
          await logSupabaseUser();
        }

      } catch (error) {

        console.log(
          'Erro auth init:',
          error
        );

      } finally {

        setLoading(false);

      }

    }

    initialize();

    /*
     * Listener login/logout
     */
    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        (
          event,
          currentSession
        ) => {

          console.log(
            'AUTH_STATE_CHANGE',
            {
              event,
              session: currentSession,
            },
          );

          console.log(
            'AUTH_SESSION',
            currentSession,
          );

          console.log(
            'AUTH_USER',
            currentSession?.user ?? null,
          );

          setSession(
            currentSession,
          );

          setUser(
            currentSession?.user ??
              null,
          );

          if (
            event === 'SIGNED_IN' &&
            currentSession?.user
          ) {
            void logSupabaseUser();

            void locationSyncService.syncFromCurrentLocation(
              {
                source: 'login',
                force: true,
              },
            );
          }

        }
      );

    return () => {

      listener
        .subscription
        .unsubscribe();

    };

  }, []);

  async function signOut() {

    try {

      await supabase.auth.signOut();

      setUser(null);

      setSession(null);

    } catch (error) {

      console.log(
        'Erro logout:',
        error
      );

    }

  }

  return (

    <AuthContext.Provider
      value={{

        user,

        session,

        loading,

        signOut,

      }}
    >

      {children}

    </AuthContext.Provider>

  );

}

export function useAuth() {

  const context = useContext(
    AuthContext
  );

  if (!context) {
    throw new Error(
      'useAuth deve ser usado dentro de AuthProvider'
    );
  }

  return context;

}