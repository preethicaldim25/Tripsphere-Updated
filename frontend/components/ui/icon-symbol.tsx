import React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
}

export const IconSymbol: React.FC<Props> = ({
  name,
  size = 24,
  color = '#000',
}) => {
  return <Ionicons name={name} size={size} color={color} />;
};