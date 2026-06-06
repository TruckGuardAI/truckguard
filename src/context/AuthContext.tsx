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

import { supabase } from '../lib/supabase';

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
          'SESSION:',
          data.session
        );

        setSession(
          data.session
        );

        setUser(
          data.session?.user ??
          null
        );

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
            'AUTH EVENT:',
            event
          );

          console.log(
            'AUTH SESSION:',
            currentSession
          );

          setSession(
            currentSession
          );

          setUser(
            currentSession?.user ??
            null
          );

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