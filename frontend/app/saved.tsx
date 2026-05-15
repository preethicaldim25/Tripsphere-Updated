import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SmartImage } from '../components/ui/SmartImage';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/themecontext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDestinationImage } from '../constants/images';

interface SavedPlace {
  id: string;
  name: string;
  image: string;
  district: string;
  rating: number;
  category: string;
  subtitle?: string;
}

export default function SavedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSavedPlaces = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      const savedKey = `saved_${user.id}`;
      const saved = await AsyncStorage.getItem(savedKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedPlaces(Array.isArray(parsed) ? parsed : []);
      } else {
        setSavedPlaces([]);
      }
    } catch (error) {
      console.error('Error loading saved places:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSavedPlaces();
    }, [isAuthenticated, user])
  );

  const removeSavedPlace = async (placeId: string, placeName: string) => {
    Alert.alert(
      'Remove from Saved',
      `Are you sure you want to remove ${placeName} from your saved places?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const savedKey = `saved_${user?.id}`;
              const updated = savedPlaces.filter(p => p.id !== placeId);
              await AsyncStorage.setItem(savedKey, JSON.stringify(updated));
              setSavedPlaces(updated);
              Alert.alert('Removed', `${placeName} removed from saved places`);
            } catch (error) {
              console.error('Error removing place:', error);
              Alert.alert('Error', 'Failed to remove place');
            }
          }
        }
      ]
    );
  };

  const styles = getStyles(colors);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Ionicons name="bookmark-outline" size={60} color={colors.textLight} />
        <Text style={[styles.title, { color: colors.text }]}>Login Required</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Please login to view your saved places
        </Text>
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Saved Places',
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
      }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {savedPlaces.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={80} color={colors.textLight} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved places</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Start exploring and save your favorite destinations
            </Text>
            <TouchableOpacity
              style={[styles.exploreButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Text style={styles.exploreButtonText}>Explore Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.headerStats}>
              <Text style={[styles.statsText, { color: colors.textSecondary }]}>
                {savedPlaces.length} saved {savedPlaces.length === 1 ? 'place' : 'places'}
              </Text>
            </View>
            <FlatList
              data={savedPlaces || []}
              keyExtractor={(item) => item?.id || Math.random().toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.card, { backgroundColor: colors.card }]}
                  onPress={() => router.push(`/destination/${item.name}`)}
                  activeOpacity={0.9}
                >
                  <SmartImage 
                    gradientOnly={true}
                    name={item.name}
                    category={item.category}
                    style={styles.cardImage} 
                  />
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardName, { color: colors.text }]}>{item.name}</Text>
                      <TouchableOpacity 
                        onPress={() => removeSavedPlace(item.id, item.name)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="heart" size={22} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.cardMetaRow}>
                        <View style={styles.locationContainer}>
                            <Ionicons name="location-outline" size={12} color={colors.primary} />
                            <Text style={[styles.locationText, { color: colors.textSecondary }]}>{item.district || 'Tamil Nadu'}</Text>
                        </View>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={12} color="#FBBF24" />
                            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{item.rating}</Text>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <View style={[styles.categoryTag, { backgroundColor: colors.primary + '10' }]}>
                            <Text style={[styles.categoryText, { color: colors.primary }]}>{item.category?.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.viewDetailsText}>View Details →</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}
      </View>
    </>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    paddingHorizontal: 30,
    width: '100%',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerStats: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  statsText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  exploreButton: {
    paddingHorizontal: 30,
    width: '100%',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '900',
    flex: 1,
    letterSpacing: -0.5,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 15,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B4EFF',
  },
});