import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface Props extends TouchableOpacityProps {
  scale?: number;
}

export const AnimatedPressable: React.FC<Props> = ({
  children,
  scale = 0.95,
  onPressIn,
  onPressOut,
  style,
  ...props
}) => {
  const animation = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animation.value }],
  }));

  return (
    <AnimatedTouchable
      style={[animatedStyle, style]}
      onPressIn={(e) => {
        animation.value = withSpring(scale);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animation.value = withSpring(1);
        onPressOut?.(e);
      }}
      activeOpacity={1}
      {...props}
    >
      {children}
    </AnimatedTouchable>
  );
};