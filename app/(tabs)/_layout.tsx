import React from 'react';

import { Tabs } from 'expo-router';

import {
  MaterialIcons,
} from '@expo/vector-icons';

export default function TabsLayout(): React.ReactElement {

  return (

    <Tabs
      screenOptions={{

        headerShown: false,

        tabBarStyle: {

          backgroundColor: '#0f172a',

          borderTopWidth: 0,

          height: 65,

        },

        tabBarActiveTintColor:
          '#f97316',

        tabBarInactiveTintColor:
          '#94a3b8',

      }}
    >

      <Tabs.Screen
        name="index"
        options={{

          title: 'Home',

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

          title: 'Radar',

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

          title: 'Comunidade',

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

          title: 'Segurança',

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

          title: 'Histórico',

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
        name="profile"
        options={{

          title: 'Perfil',

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

    </Tabs>

  );

}