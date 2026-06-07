import React, {

  useMemo,

  useState,

} from 'react';



import { useTranslation } from 'react-i18next';



import {

  View,

  Text,

  StyleSheet,

  TouchableOpacity,

  ScrollView,

} from 'react-native';



import TruxafeHeader from '../../src/components/branding/TruxafeHeader';



import {

  MaterialIcons,

} from '@expo/vector-icons';



import { useTheme } from '../../src/context/ThemeContext';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import {

  securityService,

} from '../../src/services/security.service';



import type { AppThemeTokens } from '../../src/theme/palettes';



function createStyles(theme: AppThemeTokens) {

  const { colors, components } = theme;



  return StyleSheet.create({

    container: {

      flex: 1,

      backgroundColor: colors.background,

    },



    scrollContent: {

      paddingHorizontal: 20,

      paddingBottom: 100,

    },



    section: {

      fontSize: 22,

      fontWeight: 'bold',

      color: colors.textPrimary,

      marginBottom: 15,

    },



    card: {

      backgroundColor: colors.card,

      padding: 20,

      borderRadius: 20,

      marginBottom: 20,

    },



    label: {

      color: colors.textSecondary,

    },



    status: {

      marginTop: 10,

      fontSize: 18,

      fontWeight: 'bold',

    },



    sensorCard: {

      backgroundColor: colors.card,

      padding: 20,

      borderRadius: 20,

      marginBottom: 15,

      flexDirection: 'row',

      justifyContent: 'space-between',

    },



    sensorName: {

      color: colors.textPrimary,

      fontSize: 16,

    },



    button: {

      height: 60,

      backgroundColor: components.buttonPrimaryBg,

      borderRadius: 20,

      justifyContent: 'center',

      alignItems: 'center',

      flexDirection: 'row',

      marginTop: 20,

    },



    resetButton: {

      height: 60,

      backgroundColor: colors.danger,

      borderRadius: 20,

      justifyContent: 'center',

      alignItems: 'center',

      marginTop: 15,

      marginBottom: 100,

    },



    buttonText: {

      marginLeft: 10,

      color: components.buttonPrimaryText,

      fontWeight: 'bold',

      fontSize: 16,

    },

  });

}



export default function SecurityScreen() {

  const { t } = useTranslation();

  const { theme } = useTheme();

  const styles = useThemedStyles(createStyles);



  const [

    connected,

    setConnected,

  ] = useState(false);



  const [

    state,

    setState,

  ] = useState(

    securityService.getState(),

  );



  const sensors = useMemo(

    () => [

      {

        nameKey: 'tankRight' as const,

        key: 'tankRight' as const,

        status: !state.tankRight,

      },

      {

        nameKey: 'tankLeft' as const,

        key: 'tankLeft' as const,

        status: !state.tankLeft,

      },

      {

        nameKey: 'palletRight' as const,

        key: 'palletRight' as const,

        status: !state.palletRight,

      },

      {

        nameKey: 'palletLeft' as const,

        key: 'palletLeft' as const,

        status: !state.palletLeft,

      },

    ],

    [state.tankRight, state.tankLeft, state.palletRight, state.palletLeft],

  );



  function connectESP() {

    setConnected(

      !connected,

    );

  }



  async function triggerSensor(

    sensor:

    | 'tankRight'

    | 'tankLeft'

    | 'palletRight'

    | 'palletLeft',

  ) {

    await securityService

      .simulateEvent(

        sensor,

      );



    setState({

      ...securityService

        .getState(),

    });

  }



  function resetSystem() {

    securityService

      .reset();



    setState({

      ...securityService

        .getState(),

    });

  }



  return (

    <View style={styles.container}>

      <TruxafeHeader
        title={t('security.title')}
        subtitle={t('security.realtimeMonitoring')}
      />

      <ScrollView

        showsVerticalScrollIndicator={false}

        contentContainerStyle={styles.scrollContent}

      >

      <View style={styles.card}>

        <Text style={styles.label}>

          {t('security.esp32')}

        </Text>



        <Text

          style={[

            styles.status,

            {

              color: connected

                ? theme.colors.success

                : theme.colors.danger,

            },

          ]}

        >

          {connected

            ? t('security.connected')

            : t('security.disconnected')}

        </Text>

      </View>



      <Text style={styles.section}>

        {t('security.sensors')}

      </Text>



      {sensors.map(

        (item, index) => (

          <TouchableOpacity

            key={index}

            style={[

              styles.sensorCard,

              !item.status && {

                borderWidth: 2,

                borderColor: theme.colors.danger,

              },

            ]}

            onPress={() => triggerSensor(

              item.key,

            )}

          >

            <Text

              style={styles.sensorName}

            >

              {t(`security.${item.nameKey}`)}

            </Text>



            <Text

              style={{

                color: item.status

                  ? theme.colors.success

                  : theme.colors.danger,

              }}

            >

              {item.status

                ? t('security.safe')

                : t('security.alarm')}

            </Text>

          </TouchableOpacity>

        ),

      )}



      <View style={styles.card}>

        <Text style={styles.label}>

          {t('security.siren')}

        </Text>



        <Text style={styles.status}>

          {state.alarm

            ? t('security.sirenActive')

            : t('security.offline')}

        </Text>

      </View>



      <TouchableOpacity

        style={styles.button}

        onPress={connectESP}

      >

        <MaterialIcons

          name="bluetooth"

          size={25}

          color={theme.components.buttonPrimaryText}

        />



        <Text style={styles.buttonText}>

          {connected

            ? t('security.disconnect')

            : t('security.searchEsp32')}

        </Text>

      </TouchableOpacity>



      <TouchableOpacity

        style={styles.resetButton}

        onPress={resetSystem}

      >

        <Text style={styles.buttonText}>

          {t('security.resetSystem')}

        </Text>

      </TouchableOpacity>

    </ScrollView>

    </View>

  );

}

