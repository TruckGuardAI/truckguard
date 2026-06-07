import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  Image,
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { useTheme } from '../../context/ThemeContext';

import {
  TRUXAFE_LOGO,
  TRUXAFE_LOGO_SIZES,
  type TruxafeLogoSize,
} from '../../constants/branding';

type TruxafeLogoProps = {
  size?: TruxafeLogoSize;
  showWordmark?: boolean;
  centered?: boolean;
  wordmarkBelow?: boolean;
  wordmarkSize?: number;
};

export function TruxafeLogo({
  size = 'header',
  showWordmark = false,
  centered = false,
  wordmarkBelow = true,
  wordmarkSize,
}: TruxafeLogoProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const dimension = TRUXAFE_LOGO_SIZES[size];
  const resolvedWordmarkSize =
    wordmarkSize ??
    (size === 'splash'
      ? 48
      : size === 'home'
        ? 28
        : 20);

  return (
    <View
      style={[
        styles.root,
        centered && styles.centered,
        {
          flexDirection: wordmarkBelow
            ? 'column'
            : 'row',
          gap: wordmarkBelow ? 10 : 12,
        },
      ]}
    >
      <Image
        source={TRUXAFE_LOGO}
        style={{
          width: dimension,
          height: dimension,
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

      {showWordmark ? (
        <Text
          style={[
            styles.wordmark,
            {
              fontSize: resolvedWordmarkSize,
              color: theme.colors.textPrimary,
            },
          ]}
        >
          {t('common.brandShort')}
        </Text>
      ) : null}
    </View>
  );
}

export default TruxafeLogo;

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },

  centered: {
    alignSelf: 'center',
  },

  wordmark: {
    fontWeight: '900',
    letterSpacing: 4,
  },
});
