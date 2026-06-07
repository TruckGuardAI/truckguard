import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  ActivityIndicator,
  View,
} from 'react-native';

import {
  Redirect,
  Tabs,
} from 'expo-router';

import {
  MaterialIcons,
} from '@expo/vector-icons';

import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

export default function TabsLayout(): React.ReactElement {
  const { t } = useTranslation();

  const {
    session,
    loading,
  } = useAuth();

  const { theme } = useTheme();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor:
            theme.navigation.background,
        }}
      >
        <ActivityIndicator
          color={theme.tabBar.active}
          size="large"
        />
      </View>
    );
  }

  if (!session) {
    return (
      <Redirect href="/login" />
    );
  }

  return (

    <Tabs
      screenOptions={{

        headerShown: false,

        tabBarStyle: {

          backgroundColor:
            theme.tabBar.background,

          borderTopColor:
            theme.tabBar.border,

          borderTopWidth: 1,

          height: 65,

        },

        tabBarActiveTintColor:
          theme.tabBar.active,

        tabBarInactiveTintColor:
          theme.tabBar.inactive,

      }}
    >

      <Tabs.Screen
        name="index"
        options={{

          title: t('tabs.home'),

          tabBarIcon: ({
            color,
            size,
          }) => (

            <MaterialIcons
              name="home"
              size={size}
              color={color}
            />

          ),

        }}
      />

      <Tabs.Screen
        name="radar"
        options={{

          title: t('tabs.alerts'),

          tabBarIcon: ({
            color,
            size,
          }) => (

            <MaterialIcons
              name="map"
              size={size}
              color={color}
            />

          ),

        }}
      />

      <Tabs.Screen
        name="community"
        options={{

          title: t('tabs.community'),

          tabBarIcon: ({
            color,
            size,
          }) => (

            <MaterialIcons
              name="groups"
              size={size}
              color={color}
            />

          ),

        }}
      />

      <Tabs.Screen
        name="security"
        options={{

          title: t('tabs.security'),

          tabBarIcon: ({
            color,
            size,
          }) => (

            <MaterialIcons
              name="security"
              size={size}
              color={color}
            />

          ),

        }}
      />

      <Tabs.Screen
        name="history"
        options={{

          title: t('tabs.history'),

          tabBarIcon: ({
            color,
            size,
          }) => (

            <MaterialIcons
              name="history"
              size={size}
              color={color}
            />

          ),

        }}
      />

      <Tabs.Screen
        name="intelligence"
        options={{

          title: t('tabs.intelligence'),

          tabBarIcon: ({
            color,
            size,
          }) => (

            <MaterialIcons
              name="insights"
              size={size}
              color={color}
            />

          ),

        }}
      />

      <Tabs.Screen
        name="profile"
        options={{

          title: t('tabs.profile'),

          tabBarIcon: ({
            color,
            size,
          }) => (

            <MaterialIcons
              name="person"
              size={size}
              color={color}
            />

          ),

        }}
      />

      {/* ESCONDER TELAS AUXILIARES */}

      <Tabs.Screen
        name="alerts"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="sos"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="config"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="testlab"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="bluetooth-example"
        options={{
          href: null,
        }}
      />

    </Tabs>

  );

}
