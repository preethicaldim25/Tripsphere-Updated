import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/context/themecontext';

interface Props extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body1' | 'body2' | 'caption';
  color?: 'primary' | 'secondary' | 'tertiary';
}

export const ThemedText: React.FC<Props> = ({
  children,
  variant = 'body1',
  color = 'primary',
  style,
  ...props
}) => {
  const { colors } = useTheme();

  const getColor = () => {
    switch (color) {
      case 'primary': return colors.text;
      case 'secondary': return colors.textSecondary;
      case 'tertiary': return colors.border;
      default: return colors.text;
    }
  };

  const variantStyles = {
    h1: { fontSize: 32, fontWeight: '700' as const },
    h2: { fontSize: 24, fontWeight: '700' as const },
    h3: { fontSize: 20, fontWeight: '600' as const },
    body1: { fontSize: 16, fontWeight: '400' as const },
    body2: { fontSize: 14, fontWeight: '400' as const },
    caption: { fontSize: 12, fontWeight: '400' as const },
  };

  return (
    <Text
      style={[
        variantStyles[variant],
        { color: getColor() },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};