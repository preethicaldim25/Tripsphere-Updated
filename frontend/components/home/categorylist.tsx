import React, { memo, useCallback } from 'react';
import { View, TouchableOpacity, FlatList, StyleSheet, ListRenderItem } from 'react-native';
import { ThemedText } from '@/components/shared/themedtext';
import { useTheme } from '@/context/themecontext';
import { spacing, responsiveWidth, responsiveFontSize } from '@/utils/responsive';

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
}

interface Props {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (name: string | null) => void;
  onSeeAllPress: () => void;
}

const CategoryListComponent: React.FC<Props> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onSeeAllPress,
}) => {
  const { colors } = useTheme();

  const renderItem: ListRenderItem<Category> = useCallback(({ item }) => {
    const isSelected = selectedCategory === item.name;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryCard,
          { backgroundColor: item.color + '20' },
          isSelected && { backgroundColor: item.color }
        ]}
        onPress={() => onSelectCategory(isSelected ? null : item.name)}
      >
        <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
          <ThemedText style={styles.iconText}>{item.icon}</ThemedText>
        </View>
        <ThemedText
          variant="body2"
          style={[styles.categoryName, isSelected && { color: '#fff' }]}
        >
          {item.name}
        </ThemedText>
        <ThemedText
          variant="caption"
          style={[styles.categoryCount, isSelected && { color: '#fff', opacity: 0.8 }]}
        >
          {item.count} places
        </ThemedText>
      </TouchableOpacity>
    );
  }, [selectedCategory, onSelectCategory]);

  const keyExtractor = useCallback((item: Category) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="h3" style={styles.title}>Explore Categories</ThemedText>
        <TouchableOpacity onPress={onSeeAllPress}>
          <ThemedText style={[styles.seeAll, { color: colors.primary }]}>See All</ThemedText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        initialNumToRender={4}
        windowSize={3}
        removeClippedSubviews={true}
        maxToRenderPerBatch={4}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: responsiveFontSize(20),
    fontWeight: '700',
  },
  seeAll: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
  },
  listContent: {
    paddingRight: spacing.md,
  },
  categoryCard: {
    width: responsiveWidth(28),
    padding: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: responsiveWidth(3),
    alignItems: 'center',
  },
  categoryIcon: {
    width: responsiveWidth(12),
    height: responsiveWidth(12),
    borderRadius: responsiveWidth(6),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconText: {
    fontSize: responsiveFontSize(20),
  },
  categoryName: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: responsiveFontSize(10),
    textAlign: 'center',
  },
});

export const CategoryList = memo(CategoryListComponent);