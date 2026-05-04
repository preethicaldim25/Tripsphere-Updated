import { Animated } from 'react-native';

export const fadeIn = (value: Animated.Value, duration: number = 300) => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    useNativeDriver: true,
  });
};

export const fadeOut = (value: Animated.Value, duration: number = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  });
};

export const slideIn = (
  value: Animated.Value,
  fromValue: number = 100,
  toValue: number = 0,
  duration: number = 300
) => {
  return Animated.spring(value, {
    toValue,
    useNativeDriver: true,
    speed: 12,
  });
};

export const scaleIn = (
  value: Animated.Value,
  fromValue: number = 0.8,
  toValue: number = 1,
  duration: number = 300
) => {
  return Animated.spring(value, {
    toValue,
    useNativeDriver: true,
    speed: 12,
  });
};

export const staggerChildren = (
  animations: Animated.CompositeAnimation[],
  stagger: number = 50
) => {
  return Animated.stagger(stagger, animations);
};

export const parallel = (animations: Animated.CompositeAnimation[]) => {
  return Animated.parallel(animations);
};

export const sequence = (animations: Animated.CompositeAnimation[]) => {
  return Animated.sequence(animations);
};

export const loop = (animation: Animated.CompositeAnimation, iterations: number = -1) => {
  return Animated.loop(animation, { iterations });
};