import React, { memo, useCallback } from 'react';
import { View, TouchableOpacity, FlatList, StyleSheet, ListRenderItem } from 'react-native';
import { SmartImage } from '@/components/ui/SmartImage';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/shared/themedtext';
import { useTheme } from '@/context/themecontext';
import { getDestinationImage } from '@/constants/images';
import { 
  spacing, 
  responsiveFontSize, 
  getGridColumns, 
  getGridItemWidth 
} from '@/utils/responsive';

interface Destination {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  reviews: number;
}

interface Props {
  destinations: Destination[];
  onItemPress: (id: string) => void;
  onSeeAllPress: () => void;
}

const PopularGridComponent: React.FC<Props> = ({
  destinations,
  onItemPress,
  onSeeAllPress,
}) => {
  const { colors } = useTheme();
  const numColumns = getGridColumns();
  const itemWidth = getGridItemWidth(numColumns);
  const itemHeight = itemWidth * 1.2;

  const renderItem: ListRenderItem<Destination> = useCallback(({ item }) => (
    <TouchableOpacity
      style={[styles.card, { width: itemWidth, height: itemHeight, backgroundColor: colors.card }]}
      onPress={() => onItemPress(item.id)}
      activeOpacity={0.9}
    >
      <SmartImage
        gradientOnly={true}
        name={item.name}
        category={getDestinationImage(item.name) ? 'default' : 'city'} // Simple logic for grid
        style={styles.image}
      />
      <View style={styles.content}>
        <ThemedText style={styles.name} numberOfLines={1}>{item.name}</ThemedText>
        <View style={styles.metaRow}>
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={10} color="#FFD700" />
            <ThemedText style={styles.ratingText}>{item.rating}</ThemedText>
          </View>
          <ThemedText style={styles.locationText} numberOfLines={1}>{item.location.split(',')[0]}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  ), [itemWidth, itemHeight, onItemPress]);

  const keyExtractor = useCallback((item: Destination) => item.id, []);

  if (!destinations || destinations.length === 0) {
    return (
      <View style={[styles.container, { alignItems: 'center', padding: spacing.xl }]}>
        <Ionicons name="map-outline" size={48} color={colors.textLight} />
        <ThemedText style={{ marginTop: spacing.md, color: colors.textSecondary }}>No destinations found</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="h3" style={styles.title}>Popular Destinations</ThemedText>
        <TouchableOpacity onPress={onSeeAllPress}>
          <ThemedText style={[styles.seeAll, { color: colors.primary }]}>View All</ThemedText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={destinations.slice(0, 4)}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        windowSize={3}
        removeClippedSubviews={true}
        maxToRenderPerBatch={4}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
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
    paddingBottom: spacing.lg,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: responsiveFontSize(12),
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  name: {
    color: '#fff',
    fontSize: responsiveFontSize(13),
    fontWeight: '800',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    color: '#fff',
    fontSize: responsiveFontSize(10),
    fontWeight: '700',
  },
  locationText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: responsiveFontSize(10),
    fontWeight: '500',
    flex: 1,
  },
});

export const PopularGrid = memo(PopularGridComponent);