import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

import type { Alert } from '../../types/alert.types';

type RadarMapProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
  alerts?: Alert[];
};

function createLeafletHtml(
  latitude: number,
  longitude: number,
  zoom: number,
  alertsJson: string
) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
/>

<style>
html,
body,
#map {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #020617;
}

.leaflet-container {
  width: 100%;
  height: 100%;
  background: #020617;
}
</style>
</head>

<body>

<div id="map"></div>

<script>
(function () {

  function post(message) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(message);
    }
  }

  function loadLeafletCss() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

    document.head.appendChild(link);
  }

  function loadLeafletScript() {
    const script = document.createElement('script');

    script.src =
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

    script.onload = function () {
      initMap();
    };

    script.onerror = function () {
      post('MAP_ERROR: Leaflet load failed');
    };

    document.body.appendChild(script);
  }

  function initMap() {

    try {

      if (!window.L) {
        throw new Error('Leaflet not loaded');
      }

      const latitude = ${latitude};
      const longitude = ${longitude};
      const zoom = ${zoom};

      const alerts = ${alertsJson};

      const map = L.map('map', {
        center: [latitude, longitude],
        zoom: zoom,
      });

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          attribution:
            '&copy; OpenStreetMap contributors',
        }
      ).addTo(map);

      /*
       * Utilizador
       */
      L.marker([
        latitude,
        longitude,
      ])
        .addTo(map)
        .bindPopup('Minha localização');

      /*
       * Alertas
       */
      alerts.forEach(function (alert) {

        if (
          typeof alert.latitude !== 'number' ||
          typeof alert.longitude !== 'number'
        ) {
          return;
        }

        L.marker([
          alert.latitude,
          alert.longitude,
        ])
          .addTo(map)
          .bindPopup(
            '<b>' +
              alert.title +
            '</b><br/>' +
            alert.type
          );
      });

      setTimeout(function () {
        map.invalidateSize();
        post('MAP_READY');
      }, 500);

    } catch (error) {

      post(
        'MAP_ERROR: ' +
        (error?.message || String(error))
      );

    }
  }

  if (document.readyState === 'complete') {

    loadLeafletCss();
    loadLeafletScript();

  } else {

    window.addEventListener(
      'load',
      function () {
        loadLeafletCss();
        loadLeafletScript();
      }
    );

  }

})();
</script>

</body>
</html>`;
}

export default function RadarMap({
  latitude,
  longitude,
  zoom = 13,
  alerts = [],
}: RadarMapProps) {

  const alertsJson = JSON.stringify(
    alerts.map((alert) => ({
      id: alert.id,
      title: alert.title,
      type: alert.type,
      latitude: Number(alert.latitude),
      longitude: Number(alert.longitude),
    }))
  );

  const html = useMemo(
    () =>
      createLeafletHtml(
        latitude,
        longitude,
        zoom,
        alertsJson
      ),
    [
      latitude,
      longitude,
      zoom,
      alertsJson,
    ]
  );

  function handleMessage(
    event: WebViewMessageEvent
  ) {
    console.log(
      'RADAR_MAP:',
      event.nativeEvent.data
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        source={{
          html,
          baseUrl: 'https://localhost',
        }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        onMessage={handleMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },

  webview: {
    flex: 1,
    backgroundColor: '#020617',
  },
});