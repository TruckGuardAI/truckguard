import React, {

  useCallback,

  useEffect,

  useMemo,

  useRef,

  useState,

} from 'react';



import { useTranslation } from 'react-i18next';



import {

  View,

  Text,

  StyleSheet,

  ScrollView,

  TouchableOpacity,

  ActivityIndicator,

} from 'react-native';



import {

  useFocusEffect,

} from 'expo-router';



import { useTheme } from '../../src/context/ThemeContext';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import {

  formatHistoryDistanceKm,

  historyService,

} from '../../src/services/history.service';

import { startAlertsRealtime } from '../../src/services/realtime.service';

import AlertTrustBadge from '../../src/components/alerts/AlertTrustBadge';

import AlertCommentsSection from '../../src/components/alerts/AlertCommentsSection';

import AlertVoteButtons from '../../src/components/alerts/AlertVoteButtons';

import TruxafeHeader from '../../src/components/branding/TruxafeHeader';

import { formatAlertLocationDisplay } from '../../src/utils/locationDescription.utils';



import type { AppThemeTokens } from '../../src/theme/palettes';



import type {

  HistoryAlert,

  HistoryFilter,

  HistoryStatus,

} from '../../src/types/history.types';



const DEFAULT_FILTER: HistoryFilter =

  '7days';



function createStyles(theme: AppThemeTokens) {

  const { colors } = theme;



  return StyleSheet.create({

    container: {

      flex: 1,

      backgroundColor: colors.background,

    },



    body: {

      flex: 1,

      paddingHorizontal: 20,

    },



    filtersRow: {

      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: 8,

      marginBottom: 20,

    },



    filterButton: {

      paddingHorizontal: 14,

      paddingVertical: 8,

      borderRadius: 12,

      backgroundColor: colors.card,

      borderWidth: 1,

      borderColor: colors.border,

    },



    filterButtonActive: {

      borderColor: colors.primary,

      backgroundColor: colors.surfaceSecondary,

    },



    filterText: {

      color: colors.textSecondary,

      fontSize: 13,

      fontWeight: '600',

    },



    filterTextActive: {

      color: colors.primary,

    },



    emptyContainer: {

      flex: 1,

      justifyContent: 'center',

      alignItems: 'center',

    },



    emptyText: {

      color: colors.textSecondary,

      fontSize: 16,

    },



    card: {

      backgroundColor: colors.card,

      padding: 20,

      borderRadius: 20,

      marginBottom: 15,

    },



    cardHeader: {

      flexDirection: 'row',

      alignItems: 'flex-start',

      justifyContent: 'space-between',

      gap: 10,

    },



    eventTitle: {

      flex: 1,

      fontSize: 18,

      fontWeight: 'bold',

      color: colors.textPrimary,

    },



    statusBadge: {

      paddingHorizontal: 10,

      paddingVertical: 4,

      borderRadius: 12,

    },



    statusText: {

      fontSize: 11,

      fontWeight: '700',

    },



    statusTextResolved: {

      color: colors.success,

    },



    statusTextExpired: {

      color: colors.textSecondary,

    },



    statusTextOpen: {

      color: colors.warning,

    },



    statusResolved: {

      backgroundColor: colors.surfaceSecondary,

    },



    statusExpired: {

      backgroundColor: colors.surfaceSecondary,

    },



    statusOpen: {

      backgroundColor: colors.surfaceSecondary,

    },



    time: {

      marginTop: 8,

      color: colors.primary,

    },



    info: {

      marginTop: 5,

      color: colors.textSecondary,

    },

  });

}



function statusStyles(

  status: HistoryStatus,

  styles: ReturnType<typeof createStyles>,

) {

  switch (status) {

    case 'resolved':

      return {

        badge: styles.statusResolved,

        text: styles.statusTextResolved,

      };

    case 'expired':

      return {

        badge: styles.statusExpired,

        text: styles.statusTextExpired,

      };

    case 'open':

      return {

        badge: styles.statusOpen,

        text: styles.statusTextOpen,

      };

  }

}



export default function HistoryScreen() {

  const { t } = useTranslation();

  const { theme } = useTheme();

  const styles = useThemedStyles(createStyles);



  const filterOptions = useMemo(

    () => [

      { key: 'today' as HistoryFilter, label: t('history.today') },

      { key: '7days' as HistoryFilter, label: t('history.sevenDays') },

      { key: '30days' as HistoryFilter, label: t('history.thirtyDays') },

      { key: 'all' as HistoryFilter, label: t('history.all') },

    ],

    [t],

  );



  function statusLabel(

    status: HistoryStatus,

  ): string {

    switch (status) {

      case 'resolved':

        return t('history.resolved');

      case 'expired':

        return t('history.expired');

      case 'open':

        return t('history.open');

    }

  }



  const [

    alerts,

    setAlerts,

  ] = useState<HistoryAlert[]>([]);



  const [

    filter,

    setFilter,

  ] = useState<HistoryFilter>(

    DEFAULT_FILTER,

  );



  const [

    loading,

    setLoading,

  ] = useState(true);



  const skipFilterLoad =

    useRef(true);



  const filterRef =

    useRef(filter);



  useEffect(() => {

    filterRef.current = filter;

  }, [filter]);



  useEffect(() => {

    console.log('HISTORY_RENDER_ITEMS', alerts.length);

  }, [alerts]);



  const loadHistory = useCallback(

    async (

      selectedFilter: HistoryFilter,

      forceRefresh = false,

    ) => {

      setLoading(true);



      try {

        const data =

          await historyService.getHistory(

            selectedFilter,

            forceRefresh,

          );



        setAlerts(data);

      } catch (error) {

        console.log(

          'Erro carregar histórico:',

          error,

        );



        setAlerts([]);

      } finally {

        setLoading(false);

      }

    },

    [],

  );



  useFocusEffect(

    useCallback(() => {

      historyService.invalidateCache();



      void loadHistory(

        filterRef.current,

        true,

      );



      const stopRealtime =

        startAlertsRealtime(() => {

          console.log(

            'REALTIME_REFRESH_HISTORY',

          );



          historyService.invalidateCache();



          void loadHistory(

            filterRef.current,

            true,

          );

        });



      return () => {

        stopRealtime();

      };

    }, [loadHistory]),

  );



  useEffect(() => {

    if (skipFilterLoad.current) {

      skipFilterLoad.current = false;

      return;

    }



    void loadHistory(

      filter,

      false,

    );

  }, [filter, loadHistory]);



  function handleFilterChange(

    nextFilter: HistoryFilter,

  ): void {

    setFilter(nextFilter);

  }



  return (

    <View style={styles.container}>

      <TruxafeHeader
        title={t('history.title')}
      />

      <View style={styles.body}>

      <View style={styles.filtersRow}>

        {filterOptions.map(

          (option) => {

            const selected =

              filter ===

              option.key;



            return (

              <TouchableOpacity

                key={option.key}

                style={[

                  styles.filterButton,

                  selected &&

                    styles.filterButtonActive,

                ]}

                onPress={() =>

                  handleFilterChange(

                    option.key,

                  )

                }

              >

                <Text

                  style={[

                    styles.filterText,

                    selected &&

                      styles.filterTextActive,

                  ]}

                >

                  {option.label}

                </Text>

              </TouchableOpacity>

            );

          },

        )}

      </View>



      {loading ? (

        <View

          style={

            styles.emptyContainer

          }

        >

          <ActivityIndicator

            color={theme.colors.primary}

            size="large"

          />

        </View>

      ) : alerts.length ===

        0 ? (

        <View

          style={

            styles.emptyContainer

          }

        >

          <Text

            style={

              styles.emptyText

            }

          >

            {t('history.empty')}

          </Text>

        </View>

      ) : (

        <ScrollView

          showsVerticalScrollIndicator={

            false

          }

          contentContainerStyle={{

            paddingBottom: 120,

          }}

        >

          {alerts.map((item, index) => {

            if (index === 0) {

              console.log('HISTORY_RENDER_ITEM', item.id);

            }



            return (

            <View

              key={item.id}

              style={styles.card}

            >

              <View

                style={

                  styles.cardHeader

                }

              >

                <Text

                  style={

                    styles.eventTitle

                  }

                >

                  {item.icon}{' '}

                  {item.title}

                </Text>



                <View

                  style={[

                    styles.statusBadge,

                    statusStyles(

                      item.status,

                      styles,

                    ).badge,

                  ]}

                >

                  <Text

                    style={[

                      styles.statusText,

                      statusStyles(

                        item.status,

                        styles,

                      ).text,

                    ]}

                  >

                    {statusLabel(

                      item.status,

                    )}

                  </Text>

                </View>

              </View>



              <Text

                style={styles.info}

              >

                📍{' '}

                {formatAlertLocationDisplay(

                  item.description,

                )}

              </Text>



              <AlertTrustBadge

                trustLevel={

                  item.trustLevel

                }

                style={styles.info}

              />



              <Text

                style={styles.info}

              >

                📏{' '}

                {formatHistoryDistanceKm(

                  item.distanceKm,

                )}

              </Text>



              <Text

                style={styles.info}

              >

                📅 {item.dateLabel}

              </Text>



              <Text

                style={styles.time}

              >

                🕒 {item.timeLabel}

              </Text>



              <AlertVoteButtons

                alertId={item.id}

                positiveVotes={

                  item.positiveVotes

                }

                negativeVotes={

                  item.negativeVotes

                }

                onVoted={() => {

                  historyService.invalidateCache();



                  void loadHistory(

                    filterRef.current,

                    true,

                  );

                }}

              />

              <AlertCommentsSection
                alertId={item.id}
                context="history"
              />

            </View>

            );

          })}

        </ScrollView>

      )}

      </View>

    </View>

  );

}

