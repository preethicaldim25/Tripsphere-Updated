import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Destination } from '@/types';
import { RatingStars } from '@/components/ui/RatingStars';
import { getDestinationImage } from '@/constants/images';
import { SmartImage } from '@/components/ui/SmartImage';

const { width } = Dimensions.get('window');

interface Props {
  destination: Destination;
  onPress: () => void;
  variant?: 'horizontal' | 'grid';
}

export const DestinationCard: React.FC<Props> = ({
  destination,
  onPress,
  variant = 'horizontal',
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardStyle = variant === 'horizontal' 
    ? styles.horizontalCard 
    : styles.gridCard;

  return (
    <Animated.View style={[cardStyle, animatedStyle]}>
      <TouchableOpacity
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <SmartImage 
          gradientOnly={true}
          name={destination.name}
          category={destination.category}
          style={styles.image} 
        />
        <View style={styles.content}>
            <View style={styles.topRow}>
                <Text style={styles.categoryLabel}>{destination.category?.toUpperCase() || 'EXPLORE'}</Text>
                <View style={styles.ratingBox}>
                    <Ionicons name="star" size={10} color="#FFD700" />
                    <Text style={styles.ratingText}>{destination.rating}</Text>
                </View>
            </View>
            <View style={styles.bottomBox}>
                <Text style={styles.name} numberOfLines={1}>{destination.name}</Text>
                <View style={styles.locationContainer}>
                    <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.location} numberOfLines={1}>{destination.location}</Text>
                </View>
            </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  horizontalCard: {
    width: width * 0.6,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  gridCard: {
    width: (width - 48) / 2,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    padding: 15,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  bottomBox: {
    gap: 2,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
});