import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { getDestinationImage } from '../../constants/images';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/themecontext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { destinationsAPI, Destination } from '../../services/api';
import ExploreMap from '../../components/ExploreMap';
import { SmartImage } from '../../components/ui/SmartImage';

const { width } = Dimensions.get('window');

export default function DestinationDetailsScreen() {
  const { id, name: nameParam } = useLocalSearchParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { colors, theme } = useTheme();
  
  const [saved, setSaved] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [fetching, setFetching] = useState(true);

  const destinationId = typeof id === 'string' ? id : String(id);
  const destinationName = typeof nameParam === 'string' ? nameParam : String(nameParam);

  useEffect(() => {
    if ((!destinationId || destinationId === "undefined" || destinationId === "[id]") && (!destinationName || destinationName === "undefined")) {
      setFetching(false);
      return;
    }
    fetchDestinationDetails();
  }, [destinationId, destinationName]);

  const fetchDestinationDetails = async () => {
    try {
      setFetching(true);
      let targetId = destinationId;

      // Fallback name match if ID is invalid
      if (!targetId || targetId === "undefined" || targetId === "[id]" || targetId.length < 5) {
        try {
          const allResponse = await destinationsAPI.getAll();
          const destinations = allResponse.destinations || [];
          const match = destinations.find(
            d => d.name.toLowerCase() === (destinationName || destinationId).toLowerCase()
          );
          if (match) {
            targetId = (match.id || match._id) as string;
          }
        } catch (err) {
          console.error("Error during fallback name match:", err);
        }
      }

      if (!targetId || targetId === "undefined" || targetId === "[id]") {
        targetId = destinationName || destinationId;
      }

      const data = await destinationsAPI.getPlace(targetId);
      if (data) {
        setDestination({
            ...data,
            id: data.id || data._id,
            attractions: data.attractions || [],
            nearby_places: data.nearby_places || data.nearby || [],
            food: data.food || [],
        } as Destination);
      }
    } catch (error) {
      console.error('Error fetching destination details:', error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user && destination) {
      checkIfSaved();
    }
    getCurrentLocation();
  }, [isAuthenticated, user, destination]);

  const checkIfSaved = async () => {
    try {
      const savedKey = `saved_${user?.id}`;
      const savedPlaces = await AsyncStorage.getItem(savedKey);
      if (savedPlaces) {
        const places = JSON.parse(savedPlaces);
        const isSaved = places.some((place: any) => place.id === destination?.id);
        setSaved(isSaved);
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
        router.push('/auth/login');
        return;
    }
    if (!destination) return;
    try {
      const savedKey = `saved_${user?.id}`;
      const existingSaved = await AsyncStorage.getItem(savedKey);
      let savedPlaces = existingSaved ? JSON.parse(existingSaved) : [];
      if (saved) {
        savedPlaces = savedPlaces.filter((p: any) => p.id !== destination.id);
      } else {
        savedPlaces.push({ ...destination });
      }
      await AsyncStorage.setItem(savedKey, JSON.stringify(savedPlaces));
      setSaved(!saved);
    } catch (err) {
      console.error(err);
    }
  };

  if (fetching) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 15, color: colors.primary, fontWeight: 'bold' }}>Syncing Experience...</Text>
      </View>
    );
  }

  if (!destination) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, padding: 40 }]}>
        <Ionicons name="sad-outline" size={64} color={colors.textLight} />
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Destination Not Found</Text>
        <TouchableOpacity style={[styles.addTripBtn, { paddingHorizontal: 30, marginTop: 20, borderColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = destination.name;
  const displayImage = destination.image || getDestinationImage(displayName);

  const mapPlaces = (destination.attractions || []).map((attr, idx) => ({
    id: `attr-${idx}`,
    name: attr.name || 'Attraction',
    lat: Number(attr.lat),
    lng: Number(attr.lng),
    category: attr.type || 'Point of Interest',
    image: attr.image || ''
  })).filter(p => !isNaN(p.lat) && !isNaN(p.lng));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <SmartImage 
            gradientOnly={true}
            name={displayName}
            category={destination.category}
            style={StyleSheet.absoluteFillObject as any}
          />
          <LinearGradient 
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']} 
            style={styles.heroGradient} 
          />
          
          <TouchableOpacity style={styles.backButtonCircle} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveButtonCircle} onPress={handleSave}>
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={24} color={saved ? '#FF4B4B' : '#fff'} />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <View style={styles.heroHeaderRow}>
                <View style={[styles.categoryBadge, { backgroundColor: colors.primary + 'D0' }]}>
                  <Text style={styles.categoryText}>{destination.category}</Text>
                </View>
                {(destination.is_featured || (destination as any).is_ai_recommended) && (
                    <View style={styles.aiBadge}>
                        <MaterialCommunityIcons name="creation" size={12} color="#fff" />
                        <Text style={styles.aiBadgeText}>AI PICK</Text>
                    </View>
                )}
            </View>
            
            <Text style={styles.heroTitle}>{displayName}</Text>
            
            <View style={styles.districtRowHero}>
                <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.districtTextHero}>{destination.district || 'Tamil Nadu'}</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsRow}>
              {(destination.speciality_tags || ['City', 'Nature', 'Heritage']).map((tag, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* CONTENT BODY */}
        <View style={[styles.contentBody, { backgroundColor: colors.background }]}>
          {/* Stats Row */}
          <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={20} color="#FBBF24" />
              <Text style={[styles.statValue, { color: colors.text }]}>{destination.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="wallet-outline" size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>₹{destination.estimated_budget || destination.avg_cost_per_person || '5000'}</Text>
              <Text style={styles.statLabel}>Budget</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{destination.timeRequired || '2 Days'}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
          </View>

          {/* AI Insights Card */}
          {destination.ai_recommendations && (
            <View style={[styles.aiCard, { backgroundColor: colors.card, borderColor: colors.primary + '30' }]}>
                <View style={styles.aiHeader}>
                <MaterialCommunityIcons name="creation" size={24} color={colors.primary} />
                <Text style={[styles.aiTitle, { color: colors.primary }]}>AI Insights</Text>
                </View>
                
                <View style={styles.aiRow}>
                <Text style={[styles.aiLabel, { color: colors.text }]}>Best Time:</Text>
                <Text style={[styles.aiValue, { color: colors.textSecondary }]}>{destination.ai_recommendations.best_time}</Text>
                </View>
                <View style={styles.aiRow}>
                <Text style={[styles.aiLabel, { color: colors.text }]}>Crowd Tip:</Text>
                <Text style={[styles.aiValue, { color: colors.textSecondary }]}>{destination.ai_recommendations.crowd_tips}</Text>
                </View>
                <View style={styles.aiRow}>
                <Text style={[styles.aiLabel, { color: colors.text }]}>Hidden Tip:</Text>
                <Text style={[styles.aiValue, { color: colors.textSecondary }]}>{destination.ai_recommendations.hidden_tip}</Text>
                </View>
            </View>
          )}

          {/* About Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {destination.longDescription || destination.description || 'Discover the unique charm and vibrant culture of this must-visit destination.'}
            </Text>
          </View>

          {/* Key Attractions Map */}
          {destination.attractions && destination.attractions.length > 0 && (
            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Attractions</Text>
                <TouchableOpacity onPress={() => router.push('/map')}>
                    <Text style={[styles.viewMapText, { color: colors.primary }]}>View Full Map</Text>
                </TouchableOpacity>
                </View>
                
                <View style={[styles.mapPreview, { borderColor: colors.border }]}>
                <ExploreMap 
                    places={mapPlaces}
                    theme={theme as any}
                />
                </View>

                <View style={styles.attractionsList}>
                {destination.attractions.map((attr, idx) => (
                    <View key={idx} style={[styles.attractionItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.attractionIconContainer, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons 
                        name={attr.type?.toLowerCase().includes('beach') ? 'umbrella-outline' : attr.type?.toLowerCase().includes('temple') ? 'home-outline' : 'camera-outline'} 
                        size={20} 
                        color={colors.primary} 
                        />
                    </View>
                    <View style={styles.attractionInfo}>
                        <Text style={[styles.attractionName, { color: colors.text }]}>{attr.name}</Text>
                        <Text style={[styles.attractionType, { color: colors.textLight }]}>{attr.type}</Text>
                    </View>
                    </View>
                ))}
                </View>
            </View>
          )}

          {/* Where to Eat */}
          {destination.food && destination.food.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Where to Eat</Text>
              {destination.food.map((restaurant, idx) => (
                <View key={idx} style={[styles.eatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.eatInfo}>
                    <Text style={[styles.eatName, { color: colors.text }]}>{restaurant.name}</Text>
                    <Text style={[styles.eatCuisine, { color: colors.textLight }]}>{restaurant.cuisine}</Text>
                  </View>
                  <View style={styles.eatRating}>
                    <Ionicons name="star" size={14} color="#FBBF24" />
                    <Text style={styles.eatRatingText}>{restaurant.rating}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Stay & Accommodation */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Stay & Accommodation</Text>
            <TouchableOpacity 
              style={styles.stayCard}
              onPress={() => Linking.openURL(`https://www.booking.com/searchresults.html?ss=${displayName}`)}
            >
              <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.stayGradient}>
                <View style={styles.stayContent}>
                  <Text style={styles.stayTitle}>Find the best stays</Text>
                  <Text style={styles.staySubtitle}>Check availability on Booking.com</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Nearby Places */}
          {destination.nearby_places && destination.nearby_places.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby Places</Text>
              {destination.nearby_places.map((place: any, idx: number) => (
                <View key={idx} style={[styles.nearbyItem, { backgroundColor: colors.card }]}>
                  <View style={styles.nearbyLeft}>
                    <Ionicons name="location-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.nearbyName, { color: colors.text }]}>{place.name}</Text>
                  </View>
                  <Text style={[styles.nearbyDist, { color: colors.primary }]}>{place.distance}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity 
              style={styles.aiItineraryBtn}
              onPress={() => router.push({ pathname: '/plan-trip', params: { destination: displayName } } as any)}
            >
              <LinearGradient colors={[colors.primary, '#6D28D9']} style={styles.actionGrad}>
                <MaterialCommunityIcons name="creation" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Generate AI Itinerary</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.addTripBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => router.push({ pathname: '/your-trip' } as any)}
            >
              <Text style={[styles.addTripText, { color: colors.text }]}>+ Add to Trip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  backButtonCircle: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  saveButtonCircle: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  heroSection: {
    height: 480,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  districtRowHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    opacity: 0.9,
  },
  districtTextHero: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 5,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    marginBottom: 12,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tagsRow: {
    flexDirection: 'row',
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tagText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  contentBody: {
    padding: 20,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -30,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  statLabel: {
    color: '#777',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  aiCard: {
    padding: 24,
    borderRadius: 28,
    marginBottom: 32,
    borderWidth: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  aiTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  aiRow: {
    marginBottom: 16,
  },
  aiLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  aiValue: {
    fontSize: 14,
    lineHeight: 22,
  },
  section: {
    marginBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
  },
  viewMapText: {
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    fontSize: 16,
    lineHeight: 28,
  },
  mapPreview: {
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
  },
  attractionsList: {
    gap: 14,
  },
  attractionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  attractionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  attractionInfo: {
    flex: 1,
  },
  attractionName: {
    fontSize: 16,
    fontWeight: '700',
  },
  attractionType: {
    fontSize: 13,
    marginTop: 2,
  },
  eatCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
  },
  eatInfo: {
    flex: 1,
  },
  eatName: {
    fontSize: 17,
    fontWeight: '700',
  },
  eatCuisine: {
    fontSize: 14,
    marginTop: 4,
  },
  eatRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  eatRatingText: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '800',
  },
  stayCard: {
    marginBottom: 40,
    borderRadius: 28,
    overflow: 'hidden',
  },
  stayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 28,
    justifyContent: 'space-between',
  },
  stayContent: {
    flex: 1,
  },
  stayTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  staySubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 6,
  },
  nearbyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
  },
  nearbyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nearbyName: {
    fontSize: 16,
    fontWeight: '700',
  },
  nearbyDist: {
    fontSize: 14,
    fontWeight: '800',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 10,
    marginBottom: 30,
  },
  aiItineraryBtn: {
    flex: 1.4,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  actionGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  addTripBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTripText: {
    fontSize: 15,
    fontWeight: '800',
  },
});