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
// Cap map height: never more than 250px on mobile, 380px on web
const MAP_HEIGHT = Platform.OS === 'web' ? 380 : 250;

const FALLBACK_PLACES: any[] = [
  { id: 'Madurai', name: 'Madurai Meenakshi Temple', district: 'Madurai', category: 'Temple', image: images.destinations.madurai, rating: 4.8, crowdLevel: 'high', trafficLevel: 'moderate', weatherHint: '☀️ 32°C', bestTimeToVisit: 'Morning 6:30 AM', budgetRange: '₹500-1500', isFallback: true },
  { id: 'Ooty', name: 'Doddabetta Peak', district: 'Nilgiris', category: 'Hill Station', image: images.destinations.ooty, rating: 4.7, crowdLevel: 'low', trafficLevel: 'low', weatherHint: '☁️ 18°C', bestTimeToVisit: 'Winter (Oct-Feb)', budgetRange: '₹800-2000', isFallback: true },
  { id: 'Yercaud', name: 'Kiliyur Falls', district: 'Salem', category: 'Nature', image: images.destinations.yercaud, rating: 4.5, crowdLevel: 'medium', trafficLevel: 'moderate', weatherHint: '🌧️ 24°C', bestTimeToVisit: 'Post Monsoon', budgetRange: '₹300-1000', isFallback: true },
  { id: 'Mahabalipuram', name: 'Shore Temple', district: 'Chengalpattu', category: 'Heritage', image: images.destinations.mahabalipuram, rating: 4.6, crowdLevel: 'high', trafficLevel: 'low', weatherHint: '🌤️ 29°C', bestTimeToVisit: 'Evening Sunset', budgetRange: '₹500-1200', isFallback: true },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [exploreData, setExploreData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [exploreMode, setExploreMode] = useState('AI'); // AI, Peace, Budget, Nature
  const [selectedPinPlace, setSelectedPinPlace] = useState<any>(null);
  const [savedPlaces, setSavedPlaces] = useState<string[]>([]);

  const scrollY = useRef(new Animated.Value(0)).current;

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

  const renderSmartBadge = (label: string, value: string) => {
    const isCrowd = label === 'Crowd';
    let color = '#10B981'; // Green
    if (value.toLowerCase().includes('medium') || value.toLowerCase().includes('moderate')) color = '#FBBF24'; // Yellow
    if (value.toLowerCase().includes('high')) color = '#EF4444'; // Red

    return (
      <View style={[styles.smartBadge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
        <View style={[styles.badgeDot, { backgroundColor: color }]} />
        <Text style={[styles.badgeText, { color }]}>{value.toUpperCase()}</Text>
      </View>
    );
  };

  const renderPlaceCard = ({ item, type = 'normal' }: { item: any, type?: 'large' | 'normal' | 'horizontal' }) => {
    if (!item) return null;
    const isSaved = (savedPlaces || []).includes(item?.id || item?._id);
    const themeInfo = CATEGORY_THEMES[item.category?.toLowerCase()] || CATEGORY_THEMES.default;

    return (
      <TouchableOpacity
        key={item?.id || item?._id || Math.random().toString()}
        style={[
          styles.card,
          type === 'large' ? styles.largeCard : type === 'horizontal' ? styles.horizontalCard : styles.normalCard,
          { backgroundColor: colors.card }
        ]}
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
            <Text style={styles.vibePillText}>{themeInfo.vibe}</Text>
          </View>
          <TouchableOpacity
            style={styles.saveIcon}
            onPress={() => toggleSave(item?.id || item?._id)}
          >
            <Ionicons name={isSaved ? "heart" : "heart-outline"} size={22} color={isSaved ? "#FF4B4B" : "#fff"} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.metaTopRow}>
            <Text style={styles.cardName} numberOfLines={1}>{item?.name}</Text>
            <View style={styles.weatherSmallBadge}>
              <Text style={styles.weatherSmallText}>{item?.weatherHint?.split(' ')[1] || '28°C'}</Text>
            </View>
          </View>

          <View style={styles.cardLocRow}>
            <Ionicons name="location-sharp" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.cardLocText}>{item?.district || 'Tamil Nadu'}</Text>
          </View>

          <View style={styles.cardBottomRow}>
            <View style={styles.categoryBadgeSimple}>
              <Text style={styles.categoryBadgeText}>{item?.category || 'EXPLORE'}</Text>
            </View>
            <View style={styles.ratingBadgeSimple}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.ratingBadgeText}>{item.rating || '4.5'}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color="#6B4EFF" />
        <Text style={{ color: colors.text, marginTop: 10, fontWeight: 'bold' }}>Syncing Live Travel Data...</Text>
      </View>
    );
  }

  const getFilteredPlaces = () => {
    let base = [...(exploreData?.aiPicks || []), ...(exploreData?.lowCrowd || []), ...FALLBACK_PLACES];

    // Sort or filter based on mode
    if (exploreMode === 'Peace') {
      base = base.filter(p => p?.crowdLevel?.toLowerCase() === 'low');
    } else if (exploreMode === 'Budget') {
      base = base.filter(p => p?.budgetRange?.toLowerCase().includes('₹500') || p?.budgetRange?.toLowerCase().includes('₹800'));
    } else if (exploreMode === 'Nature') {
      base = base.filter(p => p?.category?.toLowerCase().includes('nature') || p?.category?.toLowerCase().includes('hill'));
    } else if (exploreMode === 'Festival') {
      base = base.filter(p => (exploreData?.festivals || []).some((f: any) => f?.name?.includes(p?.name)) || p?.category?.toLowerCase().includes('heritage'));
    }

    const unique = Array.from(new Set(base.map(p => p?.id || p?._id))).map(id => base.find(p => (p?.id || p?._id) === id)).filter(Boolean);
    console.log("📍 Stored destinations (Explore):", unique);
    return unique;
  };

  const uniquePlaces = getFilteredPlaces();

  // ✅ Transform to flat lat/lng structure for ExploreMap markers
  const mappedPlaces = (uniquePlaces || [])
    .filter(Boolean)
    .map((d: any) => ({
      id: d?.id || d?._id,
      name: d?.name || 'Unknown',
      lat: d?.coordinates?.lat ?? d?.lat ?? null,
      lng: d?.coordinates?.lng ?? d?.lng ?? null,
      district: d?.district || d?.location || 'Tamil Nadu',
      category: d?.category || 'General',
      image: d?.image || '',
    }))
    .filter((p: any) => p.lat != null && p.lng != null && !isNaN(Number(p.lat)) && !isNaN(Number(p.lng)));

  console.log('📍 MAPPED PLACES for map:', mappedPlaces.length, mappedPlaces.map((p: any) => `${p.name}:[${p.lat},${p.lng}]`));

  const styles = getStyles(colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Layer 1: Map (Fixed at top) */}
      <View style={styles.mapContainer}>
        <ExploreMap
          places={mappedPlaces}
          onPinSelect={(place: Destination) => setSelectedPinPlace(place)}
          theme={theme as any}
        />

        {/* Layer 2: Overlay Controls */}
        <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent']} style={styles.mapOverlay} pointerEvents="box-none">
          <View style={styles.topControls}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={colors.textLight} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search Tamil Nadu Wonders..."
                placeholderTextColor={colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeScroll}>
              {['AI', 'Peace', 'Budget', 'Nature', 'Festival'].map(mode => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeChip, exploreMode === mode && styles.activeModeChip]}
                  onPress={() => setExploreMode(mode)}
                >
                  <Text style={[styles.modeText, exploreMode === mode && styles.activeModeText]}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </LinearGradient>
      </View>

      {/* Layer 3: Dynamic Content (Scrolled under map) */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* AI Intelligence Banner */}
        <View style={styles.aiBanner}>
          <LinearGradient colors={['#6B4EFF', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.aiBannerGrad}>
            <View style={styles.aiBannerContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiBannerRef}> AI INSIGHT</Text>
                <Text style={styles.aiBannerText}>
                  {uniquePlaces[0]?.name || 'Yercaud'} is <Text style={{ fontWeight: 'bold' }}>peaceful today</Text>. Low crowd, perfect weather for a getaway!
                </Text>
              </View>
              <TouchableOpacity
                style={styles.aiBannerBtn}
                onPress={() => router.push({ pathname: '/plan-trip', params: { destination: uniquePlaces[0]?.name || 'Yercaud' } } as any)}
              >
                <Text style={styles.aiBannerBtnText}>Plan Now</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {selectedPinPlace && (
          <View style={styles.pinSelectionArea}>
            <Text style={styles.sectionTitle}>Selected on Map</Text>
            {renderPlaceCard({ item: selectedPinPlace, type: 'large' })}
            <TouchableOpacity style={styles.clearPin} onPress={() => setSelectedPinPlace(null)}>
              <Text style={{ color: '#6B4EFF', fontWeight: 'bold' }}>Close Selection</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* AI Recommendations Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✨ Discovery Feed</Text>
            <Text style={styles.modeLabel}>{exploreMode} MODE ACTIVE</Text>
          </View>
          <View style={styles.cardGrid}>
            {((exploreData?.aiPicks || FALLBACK_PLACES) || []).map((item: any, idx: number) => (
              <View key={item?.id || item?._id || `fallback_${idx}`}>
                {renderPlaceCard({ item, type: 'large' })}
              </View>
            ))}
          </View>
        </View>

        {/* Live Intelligence List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Intelligence</Text>
          {(uniquePlaces || []).filter(Boolean).slice(0, 5).map((item: any, idx: number) => (
            <TouchableOpacity
              key={item?.id || item?._id || `live_${idx}`}
              style={[styles.liveIntelRow, { backgroundColor: colors.card }]}
              onPress={() => handlePlaceNavigation(item)}
            >
              <SmartImage
                uri={item?.image || getDestinationImage(item?.name || '')}
                name={item?.name}
                category={item?.category}
                style={styles.liveIntelImg}
                contentFit="cover"
              />
              <View style={styles.liveIntelInfo}>
                <Text style={[styles.liveIntelName, { color: colors.text }]}>{item?.name || 'Place'}</Text>
                <View style={styles.liveIntelBadges}>
                  {item?.crowdLevel && renderSmartBadge('Crowd', item.crowdLevel)}
                  <Text style={[styles.weatherText, { color: colors.textSecondary }]}>{item?.weatherHint || '☀️ 28°C'}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  mapContainer: { height: MAP_HEIGHT, width: '100%' },
  mapOverlay: { ...StyleSheet.absoluteFillObject, paddingTop: 60, paddingHorizontal: 20 },
  topControls: { gap: 15 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 50,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '500' },
  modeScroll: { flexDirection: 'row' },
  modeChip: { backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, marginRight: 10, borderWidth: 1, borderColor: '#eee' },
  activeModeChip: { backgroundColor: '#6B4EFF', borderColor: '#6B4EFF' },
  modeText: { fontWeight: '700', color: '#666', fontSize: 13 },
  activeModeText: { color: '#fff' },
  contentScroll: { marginTop: -30, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.background },
  contentContainer: { paddingTop: 20, paddingBottom: 120 },
  aiBanner: { paddingHorizontal: 20, marginBottom: 25 },
  aiBannerGrad: { borderRadius: 25, overflow: 'hidden', padding: 20 },
  aiBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  aiBannerRef: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  aiBannerText: { color: '#fff', fontSize: 15, marginTop: 5, lineHeight: 22 },
  aiBannerBtn: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 15 },
  aiBannerBtnText: { color: '#6B4EFF', fontWeight: 'bold', fontSize: 13 },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  modeLabel: { fontSize: 10, fontWeight: 'bold', color: '#6B4EFF', letterSpacing: 1 },
  cardGrid: { paddingHorizontal: 20 },
  card: { borderRadius: 16, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
  largeCard: { width: '100%', height: 250, marginBottom: 16 },
  normalCard: { width: '100%', height: 250, marginBottom: 16 },
  horizontalCard: { width: '100%', height: 200, marginBottom: 16 },
  cardImage: { width: '100%', height: '100%' },
  cardGradient: { ...StyleSheet.absoluteFillObject },
  weatherHint: { position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  weatherHintText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  saveIcon: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 20 },
  cardTopOverlay: { position: 'absolute', top: 20, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vibePill: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  vibePillText: { color: '#fff', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  cardInfo: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.3)', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  metaTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  weatherSmallBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  weatherSmallText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  cardName: { color: '#fff', fontSize: 20, fontWeight: '900', flex: 1, marginRight: 10 },
  cardLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  cardLocText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadgeSimple: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  categoryBadgeText: { color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  ratingBadgeSimple: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingBadgeText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  pinSelectionArea: { paddingHorizontal: 20, marginBottom: 30, backgroundColor: 'rgba(107, 78, 255, 0.05)', paddingVertical: 20, borderRadius: 25 },
  clearPin: { alignSelf: 'center', marginTop: 15 },
  liveIntelRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, marginHorizontal: 20, marginBottom: 12, elevation: 2 },
  liveIntelImg: { width: 60, height: 60, borderRadius: 15 },
  liveIntelInfo: { flex: 1, marginLeft: 15 },
  liveIntelName: { fontSize: 16, fontWeight: 'bold' },
  liveIntelBadges: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 },
  weatherText: { fontSize: 12 },
  smartBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});