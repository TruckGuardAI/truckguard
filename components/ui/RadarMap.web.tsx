import React from 'react';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

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

export default function RadarMap({
  latitude,
  longitude,
  alerts = [],
}: Props) {
  const validLatitude =
    typeof latitude === 'number' &&
    !Number.isNaN(latitude);

  const validLongitude =
    typeof longitude === 'number' &&
    !Number.isNaN(longitude);

  if (!validLatitude || !validLongitude) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Localização inválida
        </Text>
      </View>
    );
  }

  const markers = alerts
    .filter(
      (alert) =>
        typeof alert.latitude ===
          'number' &&
        typeof alert.longitude ===
          'number',
    )
    .map((alert) => {
      let color = 'red';

      if (alert.severity === 'medium') {
        color = 'yellow';
      }

      if (alert.severity === 'low') {
        color = 'green';
      }

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

  const html = `
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
  background: #020617;
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
.bindPopup('Sua localização');

${markers}
</script>
</body>
</html>
`;

  return (
    <View style={styles.container}>
      <iframe
        srcDoc={html}
        style={styles.map}
      />

      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          Localização em tempo real
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 380,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#020617',
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
    backgroundColor:
      'rgba(0,0,0,0.75)',

    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },

  overlayText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  errorContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 24,
  },

  errorText: {
    color: '#ff4d4d',
    fontSize: 20,
    fontWeight: '700',
  },
});