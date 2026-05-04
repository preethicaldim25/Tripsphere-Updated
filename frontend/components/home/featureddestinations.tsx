import React, { memo, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, FlatList, StyleSheet, ListRenderItem, Dimensions } from 'react-native';
import { Image } from 'expo-image';
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
import { getDestinationImage } from '@/constants/images';
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

    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * cardFullWidth, index * cardFullWidth, (index + 1) * cardFullWidth],
      [0.8, 1, 0.8],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Glow effect for featured items
  const glowOpacity = useSharedValue(0.3);
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <TouchableOpacity
        style={[styles.card, { width: cardWidth, height: cardHeight }]}
        onPress={() => onItemPress(item.id)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: getDestinationImage(item.name) }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.badgeContainer}>
              <View style={styles.categoryBadge}>
                <ThemedText style={styles.categoryText}>{item.category}</ThemedText>
              </View>
              {item.crowd && (
                <View style={[styles.crowdBadge, { backgroundColor: item.crowd === 'Low' ? '#4CAF50' : item.crowd === 'Medium' ? '#FF9800' : '#F44336' }]}>
                  <ThemedText style={styles.crowdText}>{item.crowd} Crowd</ThemedText>
                </View>
              )}
            </View>
            <ThemedText style={styles.name}>{item.name}</ThemedText>
            <View style={styles.metaContainer}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={responsiveFontSize(14)} color="#FFD700" />
                <ThemedText style={styles.ratingText}>
                  {item.rating} ({item.reviews})
                </ThemedText>
              </View>
              <View style={styles.tempContainer}>
                <Ionicons name="thermometer-outline" size={responsiveFontSize(14)} color="#fff" />
                <ThemedText style={styles.tempText}>{item.temperature}</ThemedText>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
      {/* Subtle Glow Overlay */}
      <Animated.View 
        style={[
          styles.glowOverlay, 
          { width: cardWidth, height: cardHeight, shadowColor: colors.primary },
          glowStyle
        ]} 
      />
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
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '75%',
    justifyContent: 'flex-end',
  },
  content: {
    padding: spacing.lg,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: responsiveFontSize(10),
  },
  categoryText: {
    color: '#fff',
    fontSize: responsiveFontSize(10),
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  crowdBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: responsiveFontSize(10),
  },
  crowdText: {
    color: '#fff',
    fontSize: responsiveFontSize(10),
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  name: {
    color: '#fff',
    fontSize: responsiveFontSize(20),
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    color: '#fff',
    fontSize: responsiveFontSize(12),
    fontWeight: '600',
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tempText: {
    color: '#fff',
    fontSize: responsiveFontSize(12),
    fontWeight: '600',
  },
  glowOverlay: {
    position: 'absolute',
    borderRadius: responsiveFontSize(24),
    zIndex: -1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
});


export const FeaturedDestinations = memo(FeaturedDestinationsComponent);