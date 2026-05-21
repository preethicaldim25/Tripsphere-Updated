import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  RefreshControl,
  Platform,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/themecontext';
import { LinearGradient } from 'expo-linear-gradient';
import { destinationsAPI, authAPI, Destination } from '../../services/api';
import ExploreMap from '../../components/ExploreMap';
import { images, getDestinationImage, CATEGORY_THEMES } from '../../constants/images';
import { SmartImage } from '../../components/ui/SmartImage';

const { width, height } = Dimensions.get('window');

const FALLBACK_PLACES: any[] = [
  { id: 'Chennai', name: 'Chennai', district: 'Chennai', category: 'beach', lat: 13.0827, lng: 80.2707, rating: 4.6, weatherHint: '☀️ 31°C', vibe: 'COASTAL' },
  { id: 'Vellore', name: 'Vellore', district: 'Vellore', category: 'heritage', lat: 12.9165, lng: 79.1325, rating: 4.5, weatherHint: '☀️ 30°C', vibe: 'HERITAGE' },
  { id: 'Pondicherry', name: 'Pondicherry', district: 'Pondicherry', category: 'beach', lat: 11.9416, lng: 79.8083, rating: 4.7, weatherHint: '🌤️ 29°C', vibe: 'PEACEFUL' },
  { id: 'Coimbatore', name: 'Coimbatore', district: 'Coimbatore', category: 'nature', lat: 11.0168, lng: 76.9558, rating: 4.8, weatherHint: '☀️ 28°C', vibe: 'NATURE' },
  { id: 'Tiruchirappalli', name: 'Tiruchirappalli', district: 'Tiruchirappalli', category: 'heritage', lat: 10.7905, lng: 78.7047, rating: 4.6, weatherHint: '☀️ 32°C', vibe: 'HERITAGE' },
  { id: 'Madurai', name: 'Madurai', district: 'Madurai', category: 'temple', lat: 9.9252, lng: 78.1198, rating: 4.9, weatherHint: '☀️ 33°C', vibe: 'CULTURAL' },
  { id: 'Rameswaram', name: 'Rameswaram', district: 'Rameswaram', category: 'beach', lat: 9.2876, lng: 79.3129, rating: 4.8, weatherHint: '🌤️ 30°C', vibe: 'COASTAL_BRIDGE' },
  { id: 'Kodaikanal', name: 'Kodaikanal', district: 'Dindigul', category: 'hill station', lat: 10.2381, lng: 77.4892, rating: 4.7, weatherHint: '☁️ 22°C', vibe: 'PEACEFUL' },
  { id: 'Thanjavur', name: 'Thanjavur', district: 'Thanjavur', category: 'heritage', lat: 10.7870, lng: 79.1378, rating: 4.6, weatherHint: '☀️ 28°C', vibe: 'CULTURAL' }
];

const CATEGORIES = [
  { id: 'All', name: 'All', icon: 'grid-outline' },
  { id: 'Peace', name: 'Peace', icon: 'leaf-outline' },
  { id: 'Budget', name: 'Budget', icon: 'pricetag-outline' },
  { id: 'Nature', name: 'Nature', icon: 'mountain-outline' },
  { id: 'Festivals', name: 'Festivals', icon: 'sparkles-outline' },
  { id: 'Heritage', name: 'Heritage', icon: 'business-outline' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [exploreData, setExploreData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [exploreMode, setExploreMode] = useState('All');
  const [selectedPinPlace, setSelectedPinPlace] = useState<any>(null);
  const [savedPlaces, setSavedPlaces] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await destinationsAPI.getExploreData();
      console.log("🌍 Destinations API response (ExploreData):", data);
      setExploreData(data);

      try {
        const saved = await authAPI.getSavedPlaces();
        setSavedPlaces(saved.map((p: any) => p.id || p._id));
      } catch (err) {
        console.log('Error fetching saved places:', err);
      }
    } catch (error) {
      console.error('Error fetching explore data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handlePlaceNavigation = (place: any) => {
    const targetId = place?.id || place?._id || place?.name;

    if (!targetId) {
      console.error("[Tripsphere] Navigation failed: No target ID", place);
      return;
    }

    router.push({
      pathname: "/destination/[id]",
      params: { id: String(targetId), name: place?.name }
    } as any);
  };

  const toggleSave = async (placeId: string) => {
    try {
      if (savedPlaces.includes(placeId)) {
        await authAPI.unsavePlace(placeId);
        setSavedPlaces(prev => prev.filter(id => id !== placeId));
      } else {
        await authAPI.savePlace(placeId);
        setSavedPlaces(prev => [...prev, placeId]);
      }
    } catch (err) {
      console.log('Error toggling save:', err);
    }
  };

  const renderPlaceCard = ({ item }: { item: any }) => {
    if (!item) return null;
    const isSaved = (savedPlaces || []).includes(item?.id || item?._id);
    const vibeLabel = item?.vibe || item?.category?.toUpperCase() || 'EXPLORE';

    return (
      <TouchableOpacity
        key={item?.id || item?._id || Math.random().toString()}
        style={styles.card}
        onPress={() => handlePlaceNavigation(item)}
        activeOpacity={0.9}
      >
        <SmartImage
          gradientOnly={true}
          name={item?.name}
          category={item?.category}
          style={styles.cardImage}
        />

        <View style={styles.cardTopOverlay}>
          <View style={styles.vibePill}>
            <Text style={styles.vibePillText}>{vibeLabel}</Text>
          </View>
          <TouchableOpacity
            style={styles.saveIcon}
            onPress={() => toggleSave(item?.id || item?._id)}
          >
            <Ionicons name={isSaved ? "heart" : "heart-outline"} size={18} color={isSaved ? "#FF4B4B" : "#fff"} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{item?.name}</Text>
          <View style={styles.cardLocRow}>
            <Ionicons name="location" size={12} color="rgba(255,255,255,0.6)" />
            <Text style={styles.cardLocText}>{item?.district || 'Tamil Nadu'}</Text>
          </View>

          <View style={styles.cardBottomRow}>
            <View style={styles.ratingBadgeSimple}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.ratingBadgeText}>{item.rating || '4.5'}</Text>
            </View>
            <View style={styles.weatherSmallBadge}>
              <Ionicons name="cloud" size={12} color="rgba(255,255,255,0.6)" />
              <Text style={styles.weatherSmallText}>{item?.weatherHint || '28°C'}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#080810' }}>
        <ActivityIndicator size="large" color="#6B4EFF" />
        <Text style={{ color: '#ffffff', marginTop: 10, fontWeight: 'bold' }}>Syncing Live Travel Data...</Text>
      </View>
    );
  }

  const getFilteredPlaces = () => {
    let base = [...FALLBACK_PLACES];
    if (exploreData?.aiPicks) {
      base = [...exploreData.aiPicks, ...base];
    }

    if (exploreMode !== 'All') {
      base = base.filter(p => p?.category?.toLowerCase().includes(exploreMode.toLowerCase()) || p?.vibe?.toLowerCase().includes(exploreMode.toLowerCase()));
    }

    const unique = Array.from(new Set(base.map(p => p?.id || p?._id))).map(id => base.find(p => (p?.id || p?._id) === id)).filter(Boolean);
    return unique;
  };

  const uniquePlaces = getFilteredPlaces();

  // Mapped places to show coordinates in ExploreMap
  const mappedPlaces = (FALLBACK_PLACES || [])
    .map((d: any) => ({
      id: d?.id || d?._id,
      name: d?.name || 'Unknown',
      lat: d?.lat ?? null,
      lng: d?.lng ?? null,
      district: d?.district || 'Tamil Nadu',
      category: d?.category || 'General',
    }))
    .filter((p: any) => p.lat != null && p.lng != null);

  return (
    <View style={{ flex: 1, backgroundColor: '#080810' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6B4EFF" />}
      >
        {/* 1. Explore Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.headerTitle}>Explore</Text>
            <Text style={styles.headerSubtitle}>Discover Tamil Nadu your way</Text>
          </View>
          <TouchableOpacity style={styles.aiChatButton}>
            <View style={styles.aiIconRing}>
              <MaterialCommunityIcons name="robot" size={24} color="#fff" />
              <View style={styles.aiOnlineDot} />
            </View>
          </TouchableOpacity>
        </View>

        {/* 2. Search & Filter Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.4)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search places, experiences, wonders..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 3. Horizontal Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {CATEGORIES.map(category => {
            const isActive = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => {
                  setSelectedCategory(category.id);
                  setExploreMode(category.id);
                }}
              >
                <Ionicons name={category.icon as any} size={16} color={isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'} />
                <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 4. Interactive Map Card */}
        <View style={styles.mapCardOuter}>
          <ExploreMap
            places={mappedPlaces}
            onPinSelect={(place: Destination) => setSelectedPinPlace(place)}
            theme="dark"
          />
        </View>

        {/* 5. AI Insight Banner */}
        <View style={styles.aiBanner}>
          <LinearGradient colors={['#3B14B0', '#6B4EFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.aiBannerGrad}>
            <View style={styles.aiBannerContent}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.aiBannerRef}>✦ AI INSIGHT</Text>
                <Text style={styles.aiBannerText}>
                  Kodaikanal is <Text style={{ fontWeight: 'bold' }}>peaceful today</Text>. Low crowd, perfect weather for a getaway!
                </Text>
              </View>
              <TouchableOpacity
                style={styles.aiBannerBtn}
                onPress={() => router.push({ pathname: '/plan-trip', params: { destination: 'Kodaikanal' } } as any)}
              >
                <Text style={styles.aiBannerBtnText}>Plan Now</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {selectedPinPlace && (
          <View style={styles.pinSelectionArea}>
            <Text style={styles.sectionTitle}>Selected on Map</Text>
            {renderPlaceCard({ item: selectedPinPlace })}
            <TouchableOpacity style={styles.clearPin} onPress={() => setSelectedPinPlace(null)}>
              <Text style={{ color: '#6B4EFF', fontWeight: 'bold' }}>Close Selection</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 6. Recommended for you Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Recommended for you</Text>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.viewAllText}>View all ></Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recommendedScroll}>
            {uniquePlaces.map((item: any, idx: number) => (
              <View key={item?.id || item?._id || `rec_${idx}`} style={{ marginRight: 16 }}>
                {renderPlaceCard({ item })}
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 20 },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  aiChatButton: {
    shadowColor: '#6B4EFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  aiIconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#121226',
    borderWidth: 1.5,
    borderColor: '#6B4EFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  aiOnlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CD964',
    position: 'absolute',
    top: 2,
    right: 2,
    borderWidth: 1,
    borderColor: '#121226',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121226',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#ffffff',
    fontSize: 14,
  },
  filterButton: {
    width: 50,
    height: 50,
    backgroundColor: '#121226',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    gap: 6,
  },
  categoryPillActive: {
    backgroundColor: 'rgba(107, 78, 255, 0.15)',
    borderColor: '#6B4EFF',
  },
  categoryPillText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  mapCardOuter: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 25,
    height: 350,
    backgroundColor: '#080810',
  },
  aiBanner: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  aiBannerGrad: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 20,
  },
  aiBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  aiBannerRef: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  aiBannerText: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  aiBannerBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  aiBannerBtnText: {
    color: '#080810',
    fontWeight: 'bold',
    fontSize: 13,
  },
  pinSelectionArea: {
    paddingHorizontal: 20,
    marginBottom: 30,
    backgroundColor: 'rgba(107, 78, 255, 0.05)',
    paddingVertical: 20,
    borderRadius: 25,
  },
  clearPin: {
    alignSelf: 'center',
    marginTop: 15,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  aiBadge: {
    backgroundColor: 'rgba(107, 78, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#6B4EFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBadgeText: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: 'bold',
  },
  viewAllText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  recommendedScroll: {
    paddingLeft: 20,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    width: 280,
    height: 180,
    backgroundColor: '#111124',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardTopOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  vibePill: {
    backgroundColor: 'rgba(30, 58, 48, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.3)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10
  },
  vibePillText: {
    color: '#4CD964',
    fontSize: 10,
    fontWeight: 'bold',
  },
  saveIcon: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 6,
    borderRadius: 15,
  },
  cardInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(12, 12, 26, 0.65)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },
  cardLocText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherSmallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weatherSmallText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
  ratingBadgeSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});