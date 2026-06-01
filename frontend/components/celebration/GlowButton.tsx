import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface GlowButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
}

export default function GlowButton({ title, onPress, variant = 'primary', icon }: GlowButtonProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  if (variant === 'secondary') {
    return (
      <Animated.View style={[animatedStyle, styles.secondaryWrapper]}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.secondaryButton}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryText}>{title}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedStyle, styles.primaryWrapper]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.primaryButton}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryText}>{title}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  primaryWrapper: {
    width: '100%',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#10b981', // bright green
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  iconContainer: {
    marginLeft: 8,
  },
  secondaryWrapper: {
    width: '100%',
  },
  secondaryButton: {
    backgroundColor: '#2a2a2a', // dark gray
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
