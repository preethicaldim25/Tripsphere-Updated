import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORY_THEMES } from '../../constants/images';

interface SmartImageProps {
  uri?: string;
  category?: string;
  name?: string;
  style?: ViewStyle | ViewStyle[];
  fallbackColors?: [string, string];
  fallbackIcon?: string;
  gradientOnly?: boolean;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  category,
  style,
  fallbackColors,
  fallbackIcon,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim]);

  const getTheme = () => {
    const cat = category?.toLowerCase() || '';
    for (const key in CATEGORY_THEMES) {
      if (cat.includes(key)) return CATEGORY_THEMES[key];
    }
    return CATEGORY_THEMES.default;
  };

  const theme = getTheme();
  const colors = fallbackColors || theme.colors;
  const icon = (fallbackIcon || theme.icon) as any;

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8], // Subtle 8px float
  });

  return (
    <View style={[styles.placeholderContainer, style]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.placeholderContent}>
        <Animated.View style={[styles.iconCircle, { transform: [{ translateY }] }]}>
            <MaterialCommunityIcons name={icon} size={32} color="#fff" />
        </Animated.View>
      </View>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)']}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 1,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
