import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/themecontext';
import { SmartImage } from './SmartImage';

interface GradientCardProps {
  name: string;
  subtitle?: string;
  category: string;
  rating?: number;
  image?: string;
  onPress: () => void;
  style?: ViewStyle;
  width?: number | string;
}

export function GradientCard({ name, subtitle, category, rating, image, onPress, style, width = '100%' }: GradientCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, width }, style]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <SmartImage 
        gradientOnly={true}
        name={name}
        category={category}
        style={styles.image} 
      />
      <View style={styles.overlay}>
        <View style={styles.cardHeader}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
          {rating !== undefined && (
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={10} color="#FBBF24" />
              <Text style={[styles.ratingText, { color: '#fff' }]}>{rating}</Text>
            </View>
          )}
        </View>
        {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>{subtitle}</Text>}
        <View style={styles.cardFooter}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{category?.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 130,
  },
  overlay: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
    letterSpacing: -0.5,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(107, 78, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B4EFF',
    letterSpacing: 0.5,
  },
});
