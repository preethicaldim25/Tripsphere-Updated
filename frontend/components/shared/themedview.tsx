import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '@/context/themecontext';

interface Props extends ViewProps {
  variant?: 'surface' | 'background';
}

export const ThemedView: React.FC<Props> = ({
  children,
  variant = 'background',
  style,
  ...props
}) => {
  const { colors } = useTheme();

  const backgroundColor = variant === 'surface' ? colors.surface : colors.background;

  return (
    <View
      style={[
        { backgroundColor },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};