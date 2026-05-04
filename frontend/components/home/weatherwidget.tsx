import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/shared/themedtext';
import { useTheme } from '@/context/themecontext';
import { spacing, responsiveFontSize } from '@/utils/responsive';

interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
  humidity: number;
  windSpeed: number;
  high: number;
  low: number;
}

interface Props {
  weather: WeatherData;
}

const WeatherWidgetComponent: React.FC<Props> = ({ weather }) => {
  const { colors, isDark } = useTheme();

  return (
    <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Ionicons name="sunny-outline" size={responsiveFontSize(32)} color="#FFD700" />
          <View style={styles.tempContainer}>
            <ThemedText style={styles.mainTemp}>{weather.temperature}°</ThemedText>
            <ThemedText variant="caption" color="secondary" style={styles.feelsTemp}>
              Feels like {weather.low}°
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <View style={styles.detailRow}>
            <Ionicons name="water-outline" size={responsiveFontSize(16)} color={colors.textSecondary} />
            <ThemedText variant="caption" color="secondary">
              {weather.humidity}%
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="speedometer-outline" size={responsiveFontSize(16)} color={colors.textSecondary} />
            <ThemedText variant="caption" color="secondary">
              {weather.windSpeed} km/h
            </ThemedText>
          </View>
          <ThemedText variant="caption" color="secondary" style={styles.location}>
            {weather.location}
          </ThemedText>
        </View>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginTop: -spacing.xl,
    marginBottom: spacing.lg,
    borderRadius: responsiveFontSize(20),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tempContainer: {
    gap: spacing.xs,
  },
  mainTemp: {
    fontSize: responsiveFontSize(24),
    fontWeight: '700',
  },
  feelsTemp: {
    fontSize: responsiveFontSize(12),
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  location: {
    marginTop: spacing.xs,
    opacity: 0.7,
  },
});

export const WeatherWidget = memo(WeatherWidgetComponent);