import React, {

  useEffect,

  useState,

} from 'react';



import {

  ActivityIndicator,

  ScrollView,

  StyleSheet,

  View,

} from 'react-native';

import { useTranslation } from 'react-i18next';



import CreateAlertButton from '../../components/radar/CreateAlertButton';

import ReportIncidentModal from '../../components/radar/ReportIncidentModal';

import RoutePanel from '../../components/radar/RoutePanel';

import TruxafeHeader from '../components/branding/TruxafeHeader';

import RadarMap from '../components/radar/RadarMap';

import { useTheme } from '../context/ThemeContext';

import { useNotificationPreferences } from '../context/NotificationPreferencesContext';

import { useAlertProximity } from '../hooks/useAlertProximity';

import { useRadarAlerts } from '../hooks/useRadarAlerts';

import { useRadarRoute } from '../hooks/useRadarRoute';

import { useThemedStyles } from '../hooks/useThemedStyles';



import { alertsApiService } from '../services/alertsApi.service';

import {

  getRiskZones,

  type RiskZone,

} from '../services/riskZone.service';



import type { AppThemeTokens } from '../theme/palettes';



import type { Alert } from '../types/alert.types';



function createStyles(theme: AppThemeTokens) {

  const { colors } = theme;



  return StyleSheet.create({

    container: {

      flex: 1,

      backgroundColor: colors.background,

    },



    mapHost: {

      flex: 1,

    },



    plannerScroll: {

      maxHeight: 280,

      borderTopWidth: 1,

      borderTopColor: colors.border,

      backgroundColor: colors.background,

    },



    plannerContent: {

      paddingHorizontal: 12,

      paddingVertical: 10,

    },



    loading: {

      flex: 1,

      justifyContent: 'center',

      alignItems: 'center',

      backgroundColor: colors.background,

    },

  });

}



export default function RadarScreen() {

  const { t } = useTranslation();

  const { theme } = useTheme();

  const {
    communityAlertsEnabled,
  } = useNotificationPreferences();

  const styles = useThemedStyles(createStyles);



  const [rawAlerts, setRawAlerts] =

    useState<Alert[]>([]);



  const [

    riskZones,

    setRiskZones,

  ] = useState<RiskZone[]>([]);



  useEffect(() => {

    void getRiskZones()

      .then(setRiskZones)

      .catch((error) => {

        console.log(

          'RISK_ZONE_ERROR',

          error,

        );

      });

  }, []);



  useEffect(() => {

    if (!communityAlertsEnabled) {

      return;

    }



    const unsubscribe =

      alertsApiService.subscribeAlerts(

        (data) => {

          console.log(

            'SUPABASE ALERTS:',

            data.length

          );



          console.log(

            'SUPABASE COORDS:',

            JSON.stringify(

              data.map(alert => ({

                id: alert.id,

                title: alert.title,

                latitude: alert.latitude,

                longitude: alert.longitude,

              })),

              null,

              2

            )

          );



          setRawAlerts(data);

        }

      );



    return unsubscribe;

  }, [communityAlertsEnabled]);



  const effectiveRawAlerts =
    communityAlertsEnabled
      ? rawAlerts
      : [];

  const {

    alerts,

    userLocation,

    locationReady,

  } = useRadarAlerts(effectiveRawAlerts);

  const [

    reportModalVisible,

    setReportModalVisible,

  ] = useState(false);



  useAlertProximity(

    alerts,

    userLocation,

    locationReady && communityAlertsEnabled,

  );



  const {

    origin,

    destination,

    setOrigin,

    setDestination,

    calculateRoute,

    plannerStatus,

    route,

    routeAlerts,

    routeLoading,

    routeError,

    routeWarning,

    routeRisk,

    routeRiskLoading,

  } = useRadarRoute(

    alerts,

    userLocation,

    locationReady,

  );



  console.log(

    'GPS:',

    userLocation.latitude,

    userLocation.longitude

  );



  console.log(

    'ALERTS:',

    alerts.length

  );



  console.log(

    'ALERTS COORDS:',

    JSON.stringify(

      alerts.map(alert => ({

        id: alert.id,

        latitude: alert.latitude,

        longitude: alert.longitude,

      })),

      null,

      2

    )

  );



  if (!locationReady) {

    return (

      <View style={styles.loading}>

        <ActivityIndicator

          size="large"

          color={theme.colors.primary}

        />

      </View>

    );

  }



  return (

    <View style={styles.container}>

      <TruxafeHeader

        title={t('tabs.alerts')}

      />

      <View style={styles.mapHost}>

        <RadarMap

          latitude={userLocation.latitude}

          longitude={userLocation.longitude}

          alerts={alerts}

          riskZones={riskZones}

          routeCoordinates={
            route?.coordinates ?? []
          }

        />

        <CreateAlertButton

          onPress={() =>
            setReportModalVisible(true)
          }

        />

        <ReportIncidentModal

          visible={reportModalVisible}

          onClose={() =>
            setReportModalVisible(false)
          }

        />

      </View>



      <ScrollView

        style={styles.plannerScroll}

        contentContainerStyle={

          styles.plannerContent

        }

        showsVerticalScrollIndicator={false}

      >

        <RoutePanel

          origin={origin}

          destination={destination}

          onOriginChange={setOrigin}

          onDestinationChange={setDestination}

          onCalculate={() => {
            void calculateRoute();
          }}

          plannerStatus={plannerStatus}

          route={route}

          routeAlerts={routeAlerts}

          loading={routeLoading}

          error={routeError}

          warning={routeWarning}

          routeRisk={routeRisk}

          routeRiskLoading={routeRiskLoading}

        />

      </ScrollView>

    </View>

  );

}

