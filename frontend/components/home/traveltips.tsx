import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/shared/themedtext';
import { useTheme } from '@/context/themecontext';
import { spacing, responsiveWidth, responsiveFontSize } from '@/utils/responsive';

interface Tip {
  id: string;
  title: string;
  icon: string;
  tips: string;
}

interface Props {
  tips: Tip[];
}

const TravelTipsComponent: React.FC<Props> = ({ tips }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText variant="h3" style={styles.title}>Travel Tips</ThemedText>
      
      <View style={styles.tipsContainer}>
        {tips.map((tip) => (
          <BlurView
            key={tip.id}
            intensity={60}
            tint={isDark ? 'dark' : 'light'}
            style={styles.tipCard}
          >
            <View style={[styles.tipIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons
                name={tip.icon as any}
                size={responsiveFontSize(24)}
                color={colors.primary}
              />
            </View>
            <View style={styles.tipContent}>
              <ThemedText variant="body1" style={styles.tipTitle}>{tip.title}</ThemedText>
              <ThemedText variant="caption" color="secondary" style={styles.tipText}>
                {tip.tips}
              </ThemedText>
            </View>
          </BlurView>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: responsiveFontSize(20),
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  tipsContainer: {
    gap: spacing.sm,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: responsiveWidth(3),
    overflow: 'hidden',
  },
  tipIcon: {
    width: responsiveWidth(12),
    height: responsiveWidth(12),
    borderRadius: responsiveWidth(6),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: responsiveFontSize(12),
  },
});

export const TravelTips = memo(TravelTipsComponent);