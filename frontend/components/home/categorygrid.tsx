import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Category } from '@/types';
import { useTheme } from '@/context/themecontext';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 2;

interface Props {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (category: Category | null) => void;
}

export const CategoryGrid: React.FC<Props> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const { colors } = useTheme();

  const allCategoriesWithImages = [
    {
      id: 'all',
      name: 'All',
      icon: '✨',
      color: colors.primary,
      image: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=400',
    },
    ...categories.map(cat => ({
      ...cat,
      image: `https://images.unsplash.com/photo-${
        cat.name === 'Temple' ? '1564507592333-c60657eea523' :
        cat.name === 'Hill Station' ? '1589308078059-be1415eab4c3' :
        cat.name === 'Beach' ? '1507525428034-b723cf961d3e' :
        cat.name === 'Heritage' ? '1578662996442-48f60103fc96' :
        cat.name === 'Wildlife' ? '1549366021-9f761d450615' :
        '1587474260584-136574528ed5'
      }?w=400`,
    })),
  ];

  return (
    <View style={styles.container}>
      {allCategoriesWithImages.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          isSelected={
            category.id === 'all' 
              ? selectedCategory === null 
              : selectedCategory === category.name
          }
          onPress={() => onSelectCategory(category.id === 'all' ? null : category)}
        />
      ))}
    </View>
  );
};

const CategoryCard: React.FC<{
  category: Category & { image: string };
  isSelected: boolean;
  onPress: () => void;
}> = ({ category, isSelected, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <TouchableOpacity
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <ImageBackground
          source={{ uri: category.image }}
          style={styles.image}
          imageStyle={{ borderRadius: 16 }}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          >
            <Text style={styles.icon}>{category.icon}</Text>
            <Text style={styles.name}>{category.name}</Text>
            {isSelected && (
              <View style={[styles.selectedBadge, { backgroundColor: category.color }]}>
                <Text style={styles.selectedText}>✓</Text>
              </View>
            )}
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});