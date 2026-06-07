import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  View,
  Text,
  Image,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  TRUXAFE_LOGO,
  TRUXAFE_LOGO_SIZES,
  TRUXAFE_WORDMARK_SIZES,
  TRUXAFE_HEADER_HEIGHT,
} from '../../constants/branding';

import { useTheme } from '../../context/ThemeContext';

const HORIZONTAL_PADDING = 20;

type TruxafeHeaderProps = {
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
};

export default function TruxafeHeader({
  title,
  subtitle,
  style,
}: TruxafeHeaderProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const logoDimension = TRUXAFE_LOGO_SIZES.header;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.background,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <Image
          source={TRUXAFE_LOGO}
          style={{
            width: logoDimension,
            height: logoDimension,
          }}
          resizeMode="contain"
          accessibilityLabel={t(
            'common.brandShort',
          )}
          onError={(error) => {
            console.log(
              'TRUXAFE_LOGO_ERROR',
              error,
            );
          }}
        />

        <View style={styles.textCol}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.textPrimary,
              },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>

          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.colors.textSecondary,
                },
              ]}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: HORIZONTAL_PADDING,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  content: {
    height: TRUXAFE_HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  textCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },

  title: {
    fontSize: TRUXAFE_WORDMARK_SIZES.header,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 32,
  },

  subtitle: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
  },
});
