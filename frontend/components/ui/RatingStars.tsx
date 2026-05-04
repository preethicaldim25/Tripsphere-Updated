import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  rating: number;
  size?: number;
  color?: string;
  emptyColor?: string;
}

export const RatingStars: React.FC<Props> = ({
  rating,
  size = 16,
  color = '#FFD700',
  emptyColor = '#E5E5E5',
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={styles.container}>
      {[...Array(fullStars)].map((_, i) => (
        <Ionicons key={`full-${i}`} name="star" size={size} color={color} />
      ))}
      {hasHalfStar && (
        <Ionicons name="star-half" size={size} color={color} />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Ionicons key={`empty-${i}`} name="star-outline" size={size} color={emptyColor} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 2,
  },
});