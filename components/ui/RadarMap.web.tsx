import React, { useMemo } from 'react';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { useTheme } from '../../src/context/ThemeContext';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../../src/theme/palettes';

type AlertItem = {
  id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: string;
};

type Props = {
  latitude: number;
  longitude: number;
  alerts?: AlertItem[];
};

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      width: '100%',
      height: 380,
      borderRadius: 24,
      overflow: 'hidden',
      marginBottom: 24,
      backgroundColor: colors.background,
    },

    map: {
      width: '100%',
      height: '100%',
      borderWidth: 0,
    } as any,

    overlay: {
      position: 'absolute',
      top: 16,
      left: 16,
      backgroundColor: colors.overlay,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
    },

    overlayText: {
      color: colors.textPrimary,
      fontWeight: '700',
      fontSize: 15,
    },

    errorContainer: {
      width: '100%',
      height: 300,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 24,
    },

    errorText: {
      color: colors.danger,
      fontSize: 20,
      fontWeight: '700',
    },
  });
}

export default function RadarMap({
  latitude,
  longitude,
  alerts = [],
}: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const locationLabel = t('radar.yourLocation');

  const validLatitude =
    typeof latitude === 'number' &&
    !Number.isNaN(latitude);

  const validLongitude =
    typeof longitude === 'number' &&
    !Number.isNaN(longitude);

  const markers = useMemo(() => {
    return alerts
      .filter(
        (alert) =>
          typeof alert.latitude ===
            'number' &&
          typeof alert.longitude ===
            'number',
      )
      .map((alert) => {
        return `
        L.marker([
          ${alert.latitude},
          ${alert.longitude}
        ])
        .addTo(map)
        .bindPopup(
          "<b>${alert.title}</b><br/>${alert.description}"
        );
      `;
      })
      .join('\n');
  }, [alerts]);

  const html = useMemo(() => {
    const mapBackground =
      theme.colors.background;

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />

<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet/dist/leaflet.css"
/>

<style>
html,
body,
#map {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

.leaflet-container {
  background: ${mapBackground};
}
</style>
</head>

<body>
<div id="map"></div>

<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

<script>
const map = L.map('map').setView(
  [${latitude}, ${longitude}],
  13
);

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution:
      '&copy; OpenStreetMap'
  }
).addTo(map);

L.marker([
  ${latitude},
  ${longitude}
])
.addTo(map)
.bindPopup('${locationLabel.replace(/'/g, "\\'")}');

${markers}
</script>
</body>
</html>
`;
  }, [
    latitude,
    longitude,
    markers,
    theme.colors.background,
    locationLabel,
  ]);

  if (!validLatitude || !validLongitude) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {t('radar.invalidLocation')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <iframe
        srcDoc={html}
        style={styles.map}
      />

      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          {t('radar.realtimeLocation')}
        </Text>
      </View>
    </View>
  );
}
