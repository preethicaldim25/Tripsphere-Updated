import React, { useRef, useEffect, memo, useCallback, useState } from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  ListRenderItem,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
  withSpring,
  useDerivedValue,
  SharedValue,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/shared/themedtext';
import { useTheme } from '@/context/themecontext';
import { 
  spacing, 
  responsiveFontSize, 
} from '@/utils/responsive';

// ── Responsive hero height ──────────────────────────────────────────────────
const getHeroHeight = (): number => {
  const { width, height } = Dimensions.get('window');

  if (Platform.OS === 'web') {
    // Web breakpoints
    if (width <= 480) return 200;   // mobile browser
    if (width <= 900) return 250;   // tablet browser
    return 300;                      // desktop
  }

  // Native: 55% of screen width (close to 16:9 on most phones)
  const natural = Math.round(width * 0.55);
  // Clamp: never less than 200, never more than 320 on tablets
  const min = 200;
  const max = width >= 600 ? 280 : 260; // tablet vs phone cap
  return Math.min(Math.max(natural, min), max);
};

const getScreenWidth = () => Dimensions.get('window').width;
const SCREEN_WIDTH = getScreenWidth();

interface HeroImage {
  id: string;
  image: string;
  title: string;
  subtitle: string;
}

interface Props {
  data: HeroImage[];
  onItemPress: (id: string) => void;
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<HeroImage>);

const PulseButton = ({ onPress, colors, title }: { onPress: () => void; colors: any; title: string }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <ThemedText style={styles.buttonText}>{title}</ThemedText>
        <Ionicons name="arrow-forward" size={responsiveFontSize(16)} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const HeroItem = ({ 
  item, 
  index, 
  scrollX, 
  onItemPress, 
  colors 
}: { 
  item: HeroImage; 
  index: number; 
  scrollX: SharedValue<number>; 
  onItemPress: (id: string) => void; 
  colors: any; 
}) => {
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  // Subtle parallax effect (minimal shift to avoid zoom)
  const imageTranslateX = interpolate(
    scrollX.value,
    inputRange,
    [-SCREEN_WIDTH * 0.05, 0, SCREEN_WIDTH * 0.05],
    Extrapolate.CLAMP
  );

  // Text slide-up and fade-in
  const textTranslateY = interpolate(
    scrollX.value,
    inputRange,
    [50, 0, 50],
    Extrapolate.CLAMP
  );

  const textOpacity = interpolate(
    scrollX.value,
    inputRange,
    [0, 1, 0],
    Extrapolate.CLAMP
  );

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: imageTranslateX },
    ],
    width: '100%',
    height: '100%',
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTranslateY }],
    opacity: textOpacity,
  }));

  return (
    <View style={styles.itemContainer}>
      <View style={styles.imageWrapper}>
        <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            contentFit="cover"
            contentPosition="center"
            transition={300}
            cachePolicy="memory-disk"
          />
        </Animated.View>
      </View>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.gradient}
      >
        <Animated.View style={[styles.contentContainer, textAnimatedStyle]}>
          <ThemedText style={styles.title}>{item.title}</ThemedText>
          <ThemedText style={styles.subtitle}>{item.subtitle}</ThemedText>
          <PulseButton 
            onPress={() => onItemPress(item.id)} 
            colors={colors} 
            title="Explore Now" 
          />
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const PaginationDot = ({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) => {
  const dotAnimatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [spacing.xs, spacing.md, spacing.xs],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [0.4, 1, 0.4],
      Extrapolate.CLAMP
    );
    return {
      width,
      opacity,
      backgroundColor: '#fff',
    };
  });

  return (
    <Animated.View
      style={[styles.paginationDot, dotAnimatedStyle]}
    />
  );
};

// Evaluated once at module load; recalculated per render via state below
const HERO_HEIGHT = getHeroHeight();

const HeroCarouselComponent: React.FC<Props> = ({ data, onItemPress }) => {
  const { colors } = useTheme();
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList<HeroImage>>(null);
  const autoPlay = useRef(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Live dimensions – recalculates if screen rotates or window resizes (web)
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => sub?.remove();
  }, []);

  const heroHeight = getHeroHeight();
  const slideWidth = dimensions.width;

  useEffect(() => {
    const interval = setInterval(() => {
      if (autoPlay.current && data.length > 0) {
        const nextIndex = (activeIndex + 1) % data.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }
    }, 3000); // Updated to 3 seconds

    return () => clearInterval(interval);
  }, [data.length, activeIndex]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleMomentumScrollEnd = useCallback((event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(newIndex);
  }, []);

  const renderItem: ListRenderItem<HeroImage> = useCallback(({ item, index }) => (
    <HeroItem 
      item={item} 
      index={index} 
      scrollX={scrollX} 
      onItemPress={onItemPress} 
      colors={colors} 
    />
  ), [scrollX.value, colors, onItemPress]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: slideWidth,
    offset: slideWidth * index,
    index,
  }), [slideWidth]);

  const keyExtractor = useCallback((item: HeroImage) => item.id, []);

  return (
    <View style={[styles.container, { height: heroHeight, width: '100%' }]}>
      <AnimatedFlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onTouchStart={() => { autoPlay.current = false; }}
        onScrollBeginDrag={() => { autoPlay.current = false; }}
        onScrollEndDrag={() => { autoPlay.current = true; }}
        initialNumToRender={1}
        windowSize={3}
        removeClippedSubviews={true}
        maxToRenderPerBatch={1}
        getItemLayout={getItemLayout}
        bounces={false}
        decelerationRate="fast"
      />

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {data.map((_, index) => (
          <PaginationDot 
            key={index} 
            index={index} 
            scrollX={scrollX} 
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    alignSelf: 'stretch',
  },
  itemContainer: {
    // width set dynamically via inline style in renderItem
    height: '100%',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a2e',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%', // Adjusted for a cleaner look
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
  },
  contentContainer: {
    padding: spacing.md, // 12-16px equivalent
    gap: spacing.xs,
  },
  title: {
    fontSize: responsiveFontSize(32),
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: responsiveFontSize(16),
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.xl,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: spacing.xs,
  },
  paginationDot: {
    height: spacing.xs,
    borderRadius: spacing.xs / 2,
  },
});

export const HeroCarousel = memo(HeroCarouselComponent);