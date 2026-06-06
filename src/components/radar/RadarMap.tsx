import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

import AlertCard from '../../../components/radar/AlertCard';

import { alertsApiService } from '../../services/alertsApi.service';
import { findAlertById } from '../../utils/alertRadar.utils';

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

        L.circleMarker(
          [alert.latitude, alert.longitude],
          {
            radius: 8,
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.9,
            weight: 2,
          }
        )
          .addTo(map)
          .bindPopup(
            '<b>' +
              alert.title +
            '</b><br/>' +
            alert.type
          )
          .on('click', function () {
            post('ALERT_SELECT:' + alert.id);
          });
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
  const [selectedAlert, setSelectedAlert] =
    useState<Alert | null>(null);

  useEffect(() => {
    if (!selectedAlert) {
      return;
    }

    const updatedAlert = findAlertById(
      alerts,
      selectedAlert.id
    );

    if (updatedAlert) {
      setSelectedAlert(updatedAlert);
    } else {
      setSelectedAlert(null);
    }
  }, [alerts, selectedAlert]);

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

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = event.nativeEvent.data;

      console.log('RADAR_MAP:', message);

      if (message.startsWith('ALERT_SELECT:')) {
        const alertId = message.slice(
          'ALERT_SELECT:'.length
        );

        const alert = findAlertById(
          alerts,
          alertId
        );

        if (alert) {
          setSelectedAlert(alert);
        }
      }
    },
    [alerts]
  );

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

      {selectedAlert && (
        <View style={styles.alertOverlay}>
          <AlertCard
            alert={selectedAlert}
            showAheadDistance={false}
            onConfirm={async () => {
              try {
                await alertsApiService.confirmAlert(
                  selectedAlert.id
                );
              } catch (error) {
                console.error(
                  'Erro ao confirmar alerta:',
                  error
                );
              }
            }}
            onResolve={async () => {
              try {
                await alertsApiService.resolveAlert(
                  selectedAlert.id
                );
                setSelectedAlert(null);
              } catch (error) {
                console.error(
                  'Erro ao resolver alerta:',
                  error
                );
              }
            }}
            onDetails={() => {
              console.log(
                'Detalhes alerta:',
                selectedAlert
              );
            }}
          />
        </View>
      )}
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

  alertOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});
