import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

import AlertDetailModal from '../../../components/radar/AlertDetailModal';

import { useTheme } from '../../context/ThemeContext';

import { useThemedStyles } from '../../hooks/useThemedStyles';

import type { AppThemeTokens } from '../../theme/palettes';

import type { AlertVotesSummary } from '../../services/vote.service';
import { findAlertById } from '../../utils/alertRadar.utils';

import type { Alert } from '../../types/alert.types';
import type { RouteCoordinate } from '../../types/route.types';
import type { RiskZone } from '../../services/riskZone.service';

type RadarMapProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
  alerts?: Alert[];
  riskZones?: RiskZone[];
  routeCoordinates?: RouteCoordinate[];
};

function createLeafletHtml(
  latitude: number,
  longitude: number,
  zoom: number,
  alertsJson: string,
  riskZonesJson: string,
  routeJson: string,
  mapBackground: string,
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
  background: ${mapBackground};
}

.leaflet-container {
  width: 100%;
  height: 100%;
  background: ${mapBackground};
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
      const riskZones = ${riskZonesJson};
      const routeCoordinates = ${routeJson};

      function riskZoneColor(level) {
        if (level === 'high') return '#ef4444';
        if (level === 'medium') return '#f97316';
        return '#eab308';
      }

      function riskZoneRadiusMeters(riskScore) {
        return Math.max(
          400,
          Math.min(5000, riskScore * 250)
        );
      }

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
       * Zonas de risco
       */
      riskZones.forEach(function (zone) {
        if (
          typeof zone.latitude !== 'number' ||
          typeof zone.longitude !== 'number'
        ) {
          return;
        }

        const color = riskZoneColor(zone.riskLevel);

        L.circle(
          [zone.latitude, zone.longitude],
          {
            radius: riskZoneRadiusMeters(zone.riskScore),
            color: color,
            fillColor: color,
            fillOpacity: 0.22,
            weight: 2,
          }
        )
          .addTo(map)
          .bindPopup(
            '<b>Zona de risco ' +
              zone.riskLevel +
            '</b><br/>' +
            'Alertas: ' +
              zone.alertCount +
            '<br/>' +
            'Score: ' +
              zone.riskScore.toFixed(1)
          );
      });

      post(
        'RISK_ZONE_RENDERED:' +
          riskZones.length
      );

      /*
       * Rota calculada
       */
      if (
        Array.isArray(routeCoordinates) &&
        routeCoordinates.length >= 2
      ) {
        const routeLatLngs = routeCoordinates.map(
          function (point) {
            return [
              point.latitude,
              point.longitude,
            ];
          }
        );

        const routeLine = L.polyline(
          routeLatLngs,
          {
            color: '#3b82f6',
            weight: 5,
            opacity: 0.9,
          }
        ).addTo(map);

        L.marker(routeLatLngs[0])
          .addTo(map)
          .bindPopup('Origem');

        L.marker(
          routeLatLngs[routeLatLngs.length - 1]
        )
          .addTo(map)
          .bindPopup('Destino');

        map.fitBounds(
          routeLine.getBounds(),
          { padding: [24, 24] }
        );

        post(
          'ROUTE_RENDERED:' +
            routeCoordinates.length
        );
      }

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

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    webview: {
      flex: 1,
      backgroundColor: colors.background,
    },

  });
}

export default function RadarMap({
  latitude,
  longitude,
  zoom = 13,
  alerts = [],
  riskZones = [],
  routeCoordinates = [],
}: RadarMapProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [
    selectedAlertId,
    setSelectedAlertId,
  ] = useState<string | null>(null);

  const [
    modalAlert,
    setModalAlert,
  ] = useState<Alert | null>(null);

  const selectedAlert = useMemo(() => {
    if (!selectedAlertId) {
      return null;
    }

    if (
      modalAlert &&
      modalAlert.id === selectedAlertId
    ) {
      return modalAlert;
    }

    return (
      findAlertById(
        alerts,
        selectedAlertId,
      ) ?? null
    );
  }, [alerts, selectedAlertId, modalAlert]);

  const handleVoteUpdated = useCallback(
    (summary: AlertVotesSummary) => {
      setModalAlert((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          positiveVotes:
            summary.totalConfirmations,
          negativeVotes:
            summary.totalRejections,
        };
      });
    },
    [],
  );

  const alertsJson = JSON.stringify(
    alerts.map((alert) => ({
      id: alert.id,
      title: alert.title,
      type: alert.type,
      latitude: Number(alert.latitude),
      longitude: Number(alert.longitude),
    }))
  );

  const riskZonesJson = JSON.stringify(
    riskZones.map((zone) => ({
      latitude: zone.latitude,
      longitude: zone.longitude,
      alertCount: zone.alertCount,
      riskScore: zone.riskScore,
      riskLevel: zone.riskLevel,
    })),
  );

  const routeJson = JSON.stringify(
    routeCoordinates.map((point) => ({
      latitude: Number(point.latitude),
      longitude: Number(point.longitude),
    })),
  );

  const html = useMemo(
    () =>
      createLeafletHtml(
        latitude,
        longitude,
        zoom,
        alertsJson,
        riskZonesJson,
        routeJson,
        theme.colors.background,
      ),
    [
      latitude,
      longitude,
      zoom,
      alertsJson,
      riskZonesJson,
      routeJson,
      theme.colors.background,
    ]
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = event.nativeEvent.data;

      console.log('RADAR_MAP:', message);

      if (
        message.startsWith('ROUTE_RENDERED:')
      ) {
        console.log(
          'ROUTE_RENDERED',
          message.slice(
            'ROUTE_RENDERED:'.length,
          ),
        );
      }

      if (
        message.startsWith(
          'RISK_ZONE_RENDERED:',
        )
      ) {
        console.log(
          'RISK_ZONE_RENDERED',
          message.slice(
            'RISK_ZONE_RENDERED:'.length,
          ),
        );
      }

      if (message.startsWith('ALERT_SELECT:')) {
        const alertId = message
          .slice('ALERT_SELECT:'.length)
          .trim();

        const alert = findAlertById(
          alerts,
          alertId,
        );

        setSelectedAlertId(alertId);
        setModalAlert(alert ?? null);
      }
    },
    [alerts]
  );

  return (
    <>
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

      <AlertDetailModal
        visible={Boolean(selectedAlert)}
        alert={selectedAlert}
        key={selectedAlert?.id ?? 'no-alert'}
        showAheadDistance={false}
        onClose={() => {
          setSelectedAlertId(null);
          setModalAlert(null);
        }}
        onVoted={handleVoteUpdated}
      />
    </>
  );
}
