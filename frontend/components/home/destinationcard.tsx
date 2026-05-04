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
        <Image 
          source={{ uri: getDestinationImage(destination.name) }} 
          style={styles.image} 
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Text style={styles.name}>{destination.name}</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={12} color="#fff" />
              <Text style={styles.location}>{destination.location}</Text>
            </View>
            <View style={styles.footer}>
              <RatingStars rating={destination.rating} size={12} />
              <Text style={styles.reviewCount}>({destination.reviewCount})</Text>
            </View>
          </View>
        </LinearGradient>
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
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
    padding: 12,
  },
  content: {
    gap: 4,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  reviewCount: {
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.7,
  },
});