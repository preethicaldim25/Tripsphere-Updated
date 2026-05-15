import React, { memo, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, FlatList, StyleSheet, ListRenderItem, Dimensions } from 'react-native';
import { SmartImage } from '@/components/ui/SmartImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolate,
  useAnimatedScrollHandler,
  withRepeat,
  withSequence,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/shared/themedtext';
import { useTheme } from '@/context/themecontext';
import { getDestinationImage, CATEGORY_THEMES } from '@/constants/images';
import { 
  spacing, 
  responsiveFontSize, 
  getFeaturedCardWidth,
  getHeroHeight 
} from '@/utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Destination {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  temperature: string;
  crowd?: string;
  bestTime?: string;
}

interface Props {
  destinations: Destination[];
  onItemPress: (id: string) => void;
  onSeeAllPress: () => void;
  title?: string;
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Destination>);

const FeaturedCard = ({ 
  item, 
  index, 
  scrollX, 
  cardWidth, 
  cardHeight, 
  onItemPress 
}: { 
  item: Destination; 
  index: number; 
  scrollX: SharedValue<number>;
  cardWidth: number;
  cardHeight: number;
  onItemPress: (id: string) => void;
}) => {
  const { colors } = useTheme();
  const cardFullWidth = cardWidth + spacing.md;
  
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      [(index - 1) * cardFullWidth, index * cardFullWidth, (index + 1) * cardFullWidth],
      [0.9, 1.05, 0.9],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
    };
  });

  const themeInfo = CATEGORY_THEMES[item.category?.toLowerCase()] || CATEGORY_THEMES.default;

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <TouchableOpacity
        style={[styles.card, { width: cardWidth, height: cardHeight, backgroundColor: colors.card }]}
        onPress={() => onItemPress(item.id)}
        activeOpacity={0.9}
      >
        <SmartImage
          gradientOnly={true}
          name={item.name}
          category={item.category}
          style={styles.image}
        />
        
        <View style={styles.content}>
          <View style={styles.topInfo}>
            <View style={styles.vibeTag}>
                <ThemedText style={styles.vibeText}>{themeInfo.vibe}</ThemedText>
            </View>
            <View style={styles.weatherBadge}>
                <Ionicons name="sunny-outline" size={12} color="#fff" />
                <ThemedText style={styles.weatherText}>{item.temperature || '24°C'}</ThemedText>
            </View>
          </View>

          <View style={styles.bottomInfo}>
            <ThemedText style={styles.name} numberOfLines={1}>{item.name}</ThemedText>
            <View style={styles.districtRow}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.7)" />
                <ThemedText style={styles.districtText}>Tamil Nadu</ThemedText>
            </View>
            
            <View style={styles.metaRow}>
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <ThemedText style={styles.ratingValue}>{item.rating}</ThemedText>
              </View>
              <ThemedText style={styles.categoryLabel}>{item.category}</ThemedText>
            </View>
          </View>
        </View>

        {/* Subtle glass effect overlay */}
        <View style={styles.glassOverlay} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const FeaturedDestinationsComponent: React.FC<Props> = ({
  destinations,
  onItemPress,
  onSeeAllPress,
  title = "Featured Destinations"
}) => {
  const { colors } = useTheme();
  const cardWidth = getFeaturedCardWidth();
  const cardHeight = getHeroHeight() * 0.45;
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const renderItem: ListRenderItem<Destination> = useCallback(({ item, index }) => (
    <FeaturedCard 
      item={item} 
      index={index} 
      scrollX={scrollX}
      cardWidth={cardWidth}
      cardHeight={cardHeight}
      onItemPress={onItemPress}
    />
  ), [cardWidth, cardHeight, onItemPress, scrollX]);

  const keyExtractor = useCallback((item: Destination) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="h3" style={styles.title}>{title}</ThemedText>
        <TouchableOpacity onPress={onSeeAllPress} style={styles.seeAllContainer}>
          <ThemedText style={[styles.seeAll, { color: colors.primary }]}>View All</ThemedText>
          <Ionicons name="chevron-forward" size={responsiveFontSize(14)} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <AnimatedFlatList
        data={destinations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        snapToInterval={cardWidth + spacing.md}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        pagingEnabled={false}
        bounces={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: responsiveFontSize(22),
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  seeAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAll: {
    fontSize: responsiveFontSize(14),
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md, // Extra padding for scale effect
  },
  cardContainer: {
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: responsiveFontSize(24),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  topInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vibeTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  vibeText: {
    color: '#fff',
    fontSize: responsiveFontSize(10),
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  weatherText: {
    color: '#fff',
    fontSize: responsiveFontSize(11),
    fontWeight: '700',
  },
  bottomInfo: {
    gap: 4,
  },
  name: {
    color: '#fff',
    fontSize: responsiveFontSize(22),
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  districtText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: responsiveFontSize(12),
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingValue: {
    color: '#fff',
    fontSize: responsiveFontSize(12),
    fontWeight: '800',
  },
  categoryLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: responsiveFontSize(10),
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
});


export const FeaturedDestinations = memo(FeaturedDestinationsComponent);