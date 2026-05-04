import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/themecontext';

interface Props {
  title: string;
  onViewAll?: () => void;
  showViewAll?: boolean;
}

export const SectionHeader: React.FC<Props> = ({ 
  title, 
  onViewAll, 
  showViewAll = true 
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {showViewAll && onViewAll && (
        <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
          <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
});