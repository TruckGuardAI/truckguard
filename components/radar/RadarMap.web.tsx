import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
} from 'react';

import {
  View,
  Text,
  StyleSheet
} from 'react-native';

import 'leaflet/dist/leaflet.css';

import { useMap } from 'react-leaflet';

import AlertDetailModal from './AlertDetailModal';

import { useTheme } from '../../src/context/ThemeContext';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../../src/theme/palettes';

import type { Alert } from '../../src/types/alert.types';

import type {
  UserCoordinates
} from '../../src/services/location.service';

import type { AlertVotesSummary } from '../../src/services/vote.service';

import {
  findAlertById,
} from '../../src/utils/alertRadar.utils';

const ICON_FILES = {
  fuel: require('../../assets/map-icons/fuel.png'),
  box: require('../../assets/map-icons/box.png'),
  mask: require('../../assets/map-icons/mask-red.png'),
  cone: require('../../assets/map-icons/cone.png'),
  wrench: require('../../assets/map-icons/wrench.png'),
  bed: require('../../assets/map-icons/bed.png'),
  SOS: require('../../assets/map-icons/sos.png'),
  user: require('../../assets/map-icons/user.png'),
} as const;

type Props = {

  alerts?: Alert[];

  userLocation: UserCoordinates;

  routeCoordinates?: import('../../src/types/route.types').RouteCoordinate[];

  connectionStatus?: import('../../src/types/alert.types').AlertsConnectionStatus;

};

type MapAutoFitProps = {
  userLocation: UserCoordinates;
  validAlerts: Alert[];
};

function MapAutoFit({
  userLocation,
  validAlerts,
}: MapAutoFitProps) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [
      [
        userLocation.latitude,
        userLocation.longitude,
      ],
      ...validAlerts.map(
        (alert): [number, number] => [
          alert.latitude,
          alert.longitude,
        ],
      ),
    ];

    if (points.length > 1) {
      map.fitBounds(points, {
        padding: [50, 50],
      });

      return;
    }

    map.setView(
      [
        userLocation.latitude,
        userLocation.longitude,
      ],
      15,
    );
  }, [
    map,
    userLocation,
    validAlerts,
  ]);

  return null;
}

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      height: 520,
      marginTop: 25,
      borderRadius: 30,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.35,
      shadowRadius: 15,
      elevation: 12,
    },

    loading: {
      height: 520,
      marginTop: 25,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 30,
    },

    loadingText: {
      fontSize: 16,
      color: colors.textPrimary,
    },
  });
}

export default function RadarMap({
  alerts = [],
  userLocation,
  routeCoordinates,
}: Props) {

  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [
    leafletMap,
    setLeafletMap
  ] = useState<any>(null);

  const [
    leaflet,
    setLeaflet
  ] = useState<any>(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    selectedAlertId,
    setSelectedAlertId,
  ] = useState<string | null>(
    null,
  );

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

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        if (
          typeof window === 'undefined'
        ) {
          return;
        }

        const L =
          await import('leaflet');

        const reactLeaflet =
          await import('react-leaflet');

        if (!cancelled) {
          setLeaflet(L);
          setLeafletMap(reactLeaflet);
        }
      } catch (error) {
        console.log(
          'Erro mapa:',
          error,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  const validAlerts =

    useMemo(

      () =>

        alerts.filter(

          item =>

            typeof item.latitude === 'number' &&
            typeof item.longitude === 'number' &&
            !item.resolved

        ),

      [alerts]

    );

  const icons =

    useMemo(() => {

      if (
        !leaflet
      ) {

        return null;

      }

      function createIcon(
        image: any
      ) {

        return leaflet.icon({

          iconUrl: image,

          iconSize: [
            48,
            48
          ],

          iconAnchor: [
            24,
            24
          ],

          popupAnchor: [
            0,
            -20
          ],

          className:
            'truckguard-icon'

        });

      }

      return {

        user:
          createIcon(
            ICON_FILES.user
          ),

        fuel:
          createIcon(
            ICON_FILES.fuel
          ),

        box:
          createIcon(
            ICON_FILES.box
          ),

        mask:
          createIcon(
            ICON_FILES.mask
          ),

        cone:
          createIcon(
            ICON_FILES.cone
          ),

        wrench:
          createIcon(
            ICON_FILES.wrench
          ),

        bed:
          createIcon(
            ICON_FILES.bed
          ),

        SOS:
          createIcon(
            ICON_FILES.SOS
          )

      };

    }, [
      leaflet
    ]);

  function getAlertIcon(
    type?: string
  ) {

    if (
      !icons
    ) {

      return undefined;

    }

    switch (type) {

      case 'fuel':
        return icons.fuel;

      case 'pallet':
        return icons.box;

      case 'full_attack':
      case 'cargo_theft':
      case 'cabin_attack':
        return icons.mask;

      case 'obstacle':
        return icons.cone;

      case 'mechanic':
        return icons.wrench;

      case 'rest':
        return icons.bed;

      case 'sos':
        return icons.SOS;

      default:
        return icons.fuel;

    }

  }

  if (
    loading ||
    !leafletMap ||
    !icons
  ) {

    return (

      <View
        style={styles.loading}
      >

        <Text
          style={styles.loadingText}
        >

          Carregando mapa...

        </Text>

      </View>

    );

  }

  const {

    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,

  } = leafletMap;

  return (
    <>
    <View
      style={styles.container}
    >

      <MapContainer

        style={{

          width: '100%',
          height: '100%'

        }}

      >

        <MapAutoFit
          userLocation={userLocation}
          validAlerts={validAlerts}
        />

        <TileLayer

          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

          attribution='TruckGuard'

        />

        {

          routeCoordinates &&
          routeCoordinates.length > 1 && (

            <Polyline

              positions={
                routeCoordinates.map(
                  point => [
                    point.latitude,
                    point.longitude
                  ]
                )
              }

              pathOptions={{

                color: theme.colors.primary,
                weight: 4,
                opacity: 0.85

              }}

            />

          )

        }

        <Marker

          position={[

            userLocation.latitude,
            userLocation.longitude

          ]}

          icon={
            icons.user
          }

        >

          <Popup>

            📍 Sua posição

          </Popup>

        </Marker>

        {

          validAlerts.map(

            alert => (

              <Marker

                key={
                  alert.id
                }

                position={[

                  alert.latitude,
                  alert.longitude

                ]}

                icon={
                  getAlertIcon(
                    alert.type
                  )
                }

                eventHandlers={{

                  click: () => {
                    setSelectedAlertId(
                      alert.id,
                    );
                    setModalAlert(alert);
                  },

                }}

              />

            )

          )

        }

      </MapContainer>

    </View>

    <AlertDetailModal
      visible={Boolean(selectedAlert)}
      alert={selectedAlert}
      showAheadDistance={Boolean(
        routeCoordinates?.length,
      )}
      onClose={() => {
        setSelectedAlertId(null);
        setModalAlert(null);
      }}
      onVoted={handleVoteUpdated}
    />

    </>

  );

}