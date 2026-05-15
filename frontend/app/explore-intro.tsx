import React, { useRef, useState,useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/themecontext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SmartImage } from '../components/ui/SmartImage';

const { width, height } = Dimensions.get('window');

const FEATURED_DESTINATIONS = [
  {
    id: 1,
    name: 'Ooty',
    tagline: 'Queen of Hill Stations',
    category: 'Hill Station',
    color: '#6B4EFF',
  },
  {
    id: 2,
    name: 'Madurai',
    tagline: 'Temple City',
    category: 'Temple',
    color: '#FF6B6B',
  },
  {
    id: 3,
    name: 'Mahabalipuram',
    tagline: 'Ancient Temples by Sea',
    category: 'Heritage',
    color: '#4ECDC4',
  },
];

export default function ExploreIntroScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % FEATURED_DESTINATIONS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentDestination = FEATURED_DESTINATIONS[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient */}
      <SmartImage
        gradientOnly={true}
        name={currentDestination.name}
        category={currentDestination.category}
        style={styles.backgroundImage}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.92)']}
        style={styles.gradient}
      />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <View style={styles.logoCircle}>
          <Ionicons name="compass" size={32} color="#fff" />
        </View>
        <Text style={styles.logoText}>Tripsphere</Text>
      </Animated.View>

      {/* Main Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.tagline}>Discover Tamil Nadu</Text>
        <Text style={styles.title}>Land of Ancient Temples & Misty Hills</Text>
        
        {/* Current Destination */}
        <View style={styles.destinationCard}>
          <Text style={styles.destinationName}>{currentDestination.name}</Text>
          <Text style={styles.destinationTagline}>{currentDestination.tagline}</Text>
          <View style={styles.destinationIndicator}>
            {FEATURED_DESTINATIONS.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.indicatorDot,
                  idx === currentIndex && styles.indicatorDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>30+</Text>
            <Text style={styles.statLabel}>Destinations</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>200+</Text>
            <Text style={styles.statLabel}>Places to Visit</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>50+</Text>
            <Text style={styles.statLabel}>Local Cuisines</Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => router.push('/(tabs)/explore')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#6B4EFF', '#9B87F5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Start Exploring</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.note}>Swipe to discover more</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    width: width,
    height: height,
    position: 'absolute',
  },
  gradient: {
    position: 'absolute',
    width: width,
    height: height,
  },
  logoContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB347',
    letterSpacing: 1,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    lineHeight: 42,
  },
  destinationCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    backdropFilter: 'blur(10px)',
  },
  destinationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  destinationTagline: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 12,
  },
  destinationIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorDotActive: {
    width: 20,
    backgroundColor: '#FFB347',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFB347',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  exploreButton: {
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 20,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  note: {
    textAlign: 'center',
    fontSize: 12,
    color: '#fff',
    opacity: 0.6,
  },
});