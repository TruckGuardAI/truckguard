import React, {
  useEffect,
  useState,
  useMemo
} from 'react';

import {
  View,
  Text,
  StyleSheet
} from 'react-native';

import 'leaflet/dist/leaflet.css';

import AlertCard from './AlertCard';

import type { Alert } from '../../src/types/alert.types';

import type {
  UserCoordinates
} from '../../src/services/location.service';

import {
  findAlertById
} from '../../src/utils/alertRadar.utils';

type Props = {

  alerts?: Alert[];

  userLocation: UserCoordinates;

  routeCoordinates?: import('../../src/types/route.types').RouteCoordinate[];

  connectionStatus?: import('../../src/types/alert.types').AlertsConnectionStatus;

  onConfirmAlert?: (
    id: string
  ) => Promise<void>;

  onResolveAlert?: (
    id: string
  ) => Promise<void>;

};

export default function RadarMap({

  alerts = [],
  userLocation,
  routeCoordinates,
  onConfirmAlert,
  onResolveAlert

}: Props) {

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
    selectedAlert,
    setSelectedAlert
  ] = useState<Alert | null>(
    null
  );

  useEffect(() => {

    initialize();

  }, []);

  useEffect(() => {

    if (
      !selectedAlert
    ) {

      return;

    }

    const updated =

      findAlertById(
        alerts,
        selectedAlert.id
      );

    if (
      updated
    ) {

      setSelectedAlert(
        updated
      );

      return;

    }

    setSelectedAlert(
      null
    );

  }, [
    alerts,
    selectedAlert?.id
  ]);

  async function initialize() {

    try {

      if (
        typeof window === 'undefined'
      ) {

        return;

      }

      const L =

        await import(
          'leaflet'
        );

      setLeaflet(
        L
      );

      const reactLeaflet =

        await import(
          'react-leaflet'
        );

      setLeafletMap(
        reactLeaflet
      );

    } catch (error) {

      console.log(
        'Erro mapa:',
        error
      );

    } finally {

      setLoading(
        false
      );

    }

  }

  const iconFiles = {

    fuel:
      require('../../assets/map-icons/fuel.png'),

    box:
      require('../../assets/map-icons/box.png'),

    mask:
      require('../../assets/map-icons/mask-red.png'),

    cone:
      require('../../assets/map-icons/cone.png'),

    wrench:
      require('../../assets/map-icons/wrench.png'),

    bed:
      require('../../assets/map-icons/bed.png'),

    SOS:
      require('../../assets/map-icons/sos.png'),

    user:
      require('../../assets/map-icons/user.png')

  };

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
            iconFiles.user
          ),

        fuel:
          createIcon(
            iconFiles.fuel
          ),

        box:
          createIcon(
            iconFiles.box
          ),

        mask:
          createIcon(
            iconFiles.mask
          ),

        cone:
          createIcon(
            iconFiles.cone
          ),

        wrench:
          createIcon(
            iconFiles.wrench
          ),

        bed:
          createIcon(
            iconFiles.bed
          ),

        SOS:
          createIcon(
            iconFiles.SOS
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
    useMap

  } = leafletMap;

  function AutoFit() {

    const map =
      useMap();

    useEffect(() => {

      const points = [

        [
          userLocation.latitude,
          userLocation.longitude
        ],

        ...validAlerts.map(

          alert => ([

            alert.latitude,
            alert.longitude

          ])

        )

      ];

      if (
        points.length > 1
      ) {

        map.fitBounds(
          points,
          {
            padding: [
              50,
              50
            ]
          }
        );

      } else {

        map.setView(

          [
            userLocation.latitude,
            userLocation.longitude
          ],

          15

        );

      }

    }, [
      map,
      userLocation.latitude,
      userLocation.longitude,
      validAlerts
    ]);

    return null;

  }

  return (

    <View
      style={styles.container}
    >

      <MapContainer

        style={{

          width: '100%',
          height: '100%'

        }}

      >

        <AutoFit />

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

                color: '#2563eb',
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

                    setSelectedAlert(
                      alert
                    );

                  }

                }}

              >

                <Popup>

                  🚨 {alert.title}

                </Popup>

              </Marker>

            )

          )

        }

      </MapContainer>

      {

        selectedAlert && (

          <AlertCard

            alert={
              selectedAlert
            }

            showAheadDistance={
              Boolean(
                routeCoordinates?.length
              )
            }

            onConfirm={async () => {

              if (
                !selectedAlert ||
                !onConfirmAlert
              ) {
                return;
              }

              await onConfirmAlert(
                selectedAlert.id
              );

            }}

            onResolve={async () => {

              if (
                !selectedAlert ||
                !onResolveAlert
              ) {
                return;
              }

              await onResolveAlert(
                selectedAlert.id
              );

              setSelectedAlert(
                null
              );

            }}

            onDetails={() => {

              console.log(
                selectedAlert
              );

            }}

          />

        )

      }

    </View>

  );

}

const styles =
  StyleSheet.create({

    container: {

      height: 520,

      marginTop: 25,

      borderRadius: 30,

      overflow: 'hidden',

      backgroundColor: '#0f172a',

      borderWidth: 1,
      borderColor: '#1e293b',

      shadowColor: '#000',

      shadowOffset: {

        width: 0,
        height: 10

      },

      shadowOpacity: 0.35,

      shadowRadius: 15,

      elevation: 12

    },

    loading: {

      height: 520,

      marginTop: 25,

      justifyContent: 'center',

      alignItems: 'center',

      backgroundColor: '#0f172a',

      borderRadius: 30

    },

    loadingText: {

      fontSize: 16,

      color: '#ffffff'

    }

  });