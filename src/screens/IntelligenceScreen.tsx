import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useFocusEffect,
} from 'expo-router';

import { useTranslation } from 'react-i18next';

import TruxafeHeader from '../components/branding/TruxafeHeader';

import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

import {
  getCityStats,
  getCountryStats,
  getIncidentStats,
  getTimeRiskStats,
} from '../services/intelligence.service';

import type { AppThemeTokens } from '../theme/palettes';

import type {
  CityStat,
  CountryStat,
  IncidentStat,
  TimeRiskStat,
} from '../types/intelligence.types';

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 32,
    },

    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      gap: 12,
    },

    sectionIntro: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 20,
    },

    loadingText: {
      color: colors.textSecondary,
      fontSize: 14,
    },

    errorText: {
      color: colors.danger,
      fontSize: 13,
      marginBottom: 12,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 14,
    },

    cardTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 12,
    },

    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    statTextCol: {
      flex: 1,
      paddingRight: 12,
    },

    statTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },

    statMeta: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },

    statScore: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '800',
    },

    emptyText: {
      color: colors.textMuted,
      fontSize: 13,
    },
  });
}

function StatRow({
  title,
  meta,
  score,
  styles,
}: {
  title: string;
  meta: string;
  score: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statTextCol}>
        <Text style={styles.statTitle}>
          {title}
        </Text>
        <Text style={styles.statMeta}>
          {meta}
        </Text>
      </View>
      <Text style={styles.statScore}>
        {score}
      </Text>
    </View>
  );
}

function SectionCard({
  title,
  children,
  styles,
}: {
  title: string;
  children: React.ReactNode;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function IntelligenceScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [loading, setLoading] =
    useState(true);

  const [
    countries,
    setCountries,
  ] = useState<CountryStat[]>([]);

  const [cities, setCities] =
    useState<CityStat[]>([]);

  const [
    incidents,
    setIncidents,
  ] = useState<IncidentStat[]>([]);

  const [
    timeRisk,
    setTimeRisk,
  ] = useState<TimeRiskStat[]>([]);

  const [error, setError] =
    useState<string | null>(null);

  const loadStats = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          countryStats,
          cityStats,
          incidentStats,
          timeStats,
        ] = await Promise.all([
          getCountryStats(),
          getCityStats(),
          getIncidentStats(),
          getTimeRiskStats(),
        ]);

        setCountries(countryStats);
        setCities(cityStats);
        setIncidents(incidentStats);
        setTimeRisk(timeStats);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : t('intelligence.loadError'),
        );
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useFocusEffect(
    useCallback(() => {
      void loadStats();
    }, [loadStats]),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
        />
        <Text style={styles.loadingText}>
          {t('intelligence.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TruxafeHeader
        title={t('intelligence.title')}
        subtitle={t('intelligence.analysisSubtitle')}
      />

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={false}
      >

      {error !== null && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}

      <SectionCard
        title={t('intelligence.dangerousCountries')}
        styles={styles}
      >
        {countries.length === 0 ? (
          <Text style={styles.emptyText}>
            {t('intelligence.noCountries')}
          </Text>
        ) : (
          countries.map((item) => (
            <StatRow
              key={item.country}
              title={item.country}
              meta={t('intelligence.alertsCount', {
                count: item.alertCount,
              })}
              score={item.riskScore.toFixed(1)}
              styles={styles}
            />
          ))
        )}
      </SectionCard>

      <SectionCard
        title={t('intelligence.topCities')}
        styles={styles}
      >
        {cities.length === 0 ? (
          <Text style={styles.emptyText}>
            {t('intelligence.noCities')}
          </Text>
        ) : (
          cities.map((item) => (
            <StatRow
              key={`${item.city}-${item.country}`}
              title={item.city}
              meta={t('intelligence.cityMeta', {
                country: item.country,
                count: item.alertCount,
              })}
              score={item.riskScore.toFixed(1)}
              styles={styles}
            />
          ))
        )}
      </SectionCard>

      <SectionCard
        title={t('intelligence.incidentTypes')}
        styles={styles}
      >
        {incidents.length === 0 ? (
          <Text style={styles.emptyText}>
            {t('intelligence.noIncidents')}
          </Text>
        ) : (
          incidents.map((item) => (
            <StatRow
              key={item.type}
              title={item.label}
              meta={t('intelligence.percentage', {
                percentage: item.percentage,
              })}
              score={String(item.count)}
              styles={styles}
            />
          ))
        )}
      </SectionCard>

      <SectionCard
        title={t('intelligence.riskHours')}
        styles={styles}
      >
        {timeRisk.length === 0 ? (
          <Text style={styles.emptyText}>
            {t('intelligence.noHours')}
          </Text>
        ) : (
          timeRisk.map((item) => (
            <StatRow
              key={item.hour}
              title={item.label}
              meta={t('intelligence.alertsCount', {
                count: item.alertCount,
              })}
              score={item.riskScore.toFixed(1)}
              styles={styles}
            />
          ))
        )}
      </SectionCard>
      </ScrollView>
    </View>
  );
}
