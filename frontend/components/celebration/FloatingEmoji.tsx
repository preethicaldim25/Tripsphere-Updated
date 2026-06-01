import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  withSequence,
  runOnJS
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function FloatingEmoji({ emoji, delay }: { emoji: string, delay: number }) {
  const [active, setActive] = useState(true);
  const startX = Math.random() * width;
  
  const translateY = useSharedValue(height / 2);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(startX);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(-100, { duration: 3000 + Math.random() * 2000, easing: Easing.out(Easing.ease) }, () => {
        runOnJS(setActive)(false);
      })
    );
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1000 })
      )
    );
    translateX.value = withDelay(
      delay,
      withTiming(startX + (Math.random() - 0.5) * 100, { duration: 3000 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
      ],
      opacity: opacity.value,
    };
  });

  if (!active) return null;

  return (
    <Animated.Text style={[styles.emoji, animatedStyle]}>
      {emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  emoji: {
    position: 'absolute',
    fontSize: 24,
  }
});
