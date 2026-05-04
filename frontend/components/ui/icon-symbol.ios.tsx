import React from 'react';
import { SymbolView, SymbolViewProps } from 'expo-symbols';

interface Props {
  name: string;
  size?: number;
  color?: string;
  weight?: SymbolViewProps['weight'];
}

export const IconSymbol: React.FC<Props> = ({
  name,
  size = 24,
  color = '#000',
  weight = 'regular',
}) => {
  return (
    <SymbolView
      name={name as any}
      size={size}
      tintColor={color}
      weight={weight}
    />
  );
};