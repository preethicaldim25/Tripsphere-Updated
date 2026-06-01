import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { destinationsAPI, authAPI, Destination } from '../../services/api';
import ExploreMap from '../../components/ExploreMap';
import { SmartImage } from '../../components/ui/SmartImage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.72;

const FALLBACK_PLACES: any[] = [
  { id: 'Chennai',        name: 'Chennai',        district: 'Chennai',        category: 'beach',       lat: 13.0827, lng: 80.2707, rating: 4.6, weatherHint: '☀️ 31°C', vibe: 'COASTAL' },
  { id: 'Vellore',        name: 'Vellore',        district: 'Vellore',        category: 'heritage',    lat: 12.9165, lng: 79.1325, rating: 4.5, weatherHint: '☀️ 30°C', vibe: 'HERITAGE' },
  { id: 'Pondicherry',    name: 'Pondicherry',    district: 'Pondicherry',    category: 'beach',       lat: 11.9416, lng: 79.8083, rating: 4.7, weatherHint: '🌤️ 29°C', vibe: 'PEACEFUL' },
  { id: 'Coimbatore',     name: 'Coimbatore',     district: 'Coimbatore',     category: 'nature',      lat: 11.0168, lng: 76.9558, rating: 4.8, weatherHint: '☀️ 28°C', vibe: 'NATURE' },
  { id: 'Tiruchirappalli',name: 'Tiruchirappalli',district: 'Tiruchirappalli',category: 'heritage',    lat: 10.7905, lng: 78.7047, rating: 4.6, weatherHint: '☀️ 32°C', vibe: 'HERITAGE' },
  { id: 'Madurai',        name: 'Madurai',        district: 'Madurai',        category: 'temple',      lat:  9.9252, lng: 78.1198, rating: 4.9, weatherHint: '☀️ 33°C', vibe: 'CULTURAL' },
  { id: 'Rameswaram',     name: 'Rameswaram',     district: 'Rameswaram',     category: 'beach',       lat:  9.2876, lng: 79.3129, rating: 4.8, weatherHint: '🌤️ 30°C', vibe: 'COASTAL' },
  { id: 'Kodaikanal',     name: 'Kodaikanal',     district: 'Dindigul',       category: 'hill station',lat: 10.2381, lng: 77.4892, rating: 4.7, weatherHint: '☁️ 22°C', vibe: 'PEACEFUL' },
  { id: 'Thanjavur',      name: 'Thanjavur',      district: 'Thanjavur',      category: 'heritage',    lat: 10.7870, lng: 79.1378, rating: 4.6, weatherHint: '☀️ 28°C', vibe: 'CULTURAL' },
];

const CATEGORIES = [
  { id: 'All',      name: 'All',      icon: 'apps-outline' as const },
  { id: 'Peace',    name: 'Peace',    icon: 'leaf-outline' as const },
  { id: 'Budget',   name: 'Budget',   icon: 'pricetag-outline' as const },
  { id: 'Nature',   name: 'Nature',   icon: 'mountain-outline' as const },
  { id: 'Festivals',name: 'Festivals',icon: 'sparkles-outline' as const },
  { id: 'Heritage', name: 'Heritage', icon: 'business-outline' as const },
];

// ─── Vibe → accent color map ─────────────────────────────────────────────────
const VIBE_COLOR: Record<string, string> = {
  COASTAL:  '#38BDF8',
  HERITAGE: '#FBBF24',
  PEACEFUL: '#4ADE80',
  NATURE:   '#34D399',
  CULTURAL: '#F472B6',
  EXPLORE:  '#A78BFA',
};

export default function ExploreScreen() {
  const router = useRouter();

  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]        = useState(false);
  const [searchQuery,      setSearchQuery]       = useState('');
  const [exploreData,      setExploreData]       = useState<any>(null);
  const [selectedCategory, setSelectedCategory]  = useState('All');
  const [exploreMode,      setExploreMode]       = useState('All');
  const [selectedPinPlace, setSelectedPinPlace]  = useState<any>(null);
  const [savedPlaces,      setSavedPlaces]       = useState<string[]>([]);

  // ─── Data fetching ───────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await destinationsAPI.getExploreData();
      setExploreData(data);
      try {
        const saved = await authAPI.getSavedPlaces();
        setSavedPlaces(saved.map((p: any) => p.id || p._id));
      } catch (_) {}
    } catch (error) {
      console.error('ExploreScreen fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // ─── Navigation ──────────────────────────────────────────────────────────
  const handlePlaceNavigation = (place: any) => {
    const targetId = place?.id || place?._id || place?.name;
    if (!targetId) return;
    router.push({ pathname: '/destination/[id]', params: { id: String(targetId), name: place?.name } } as any);
  };

  // ─── Save toggle ─────────────────────────────────────────────────────────
  const toggleSave = async (placeId: string) => {
    try {
      if (savedPlaces.includes(placeId)) {
        await authAPI.unsavePlace(placeId);
        setSavedPlaces(prev => prev.filter(id => id !== placeId));
      } else {
        await authAPI.savePlace(placeId);
        setSavedPlaces(prev => [...prev, placeId]);
      }
    } catch (_) {}
  };

  // ─── Filter logic ─────────────────────────────────────────────────────────
  const getFilteredPlaces = () => {
    let base = [...FALLBACK_PLACES];
    if (exploreData?.aiPicks) base = [...exploreData.aiPicks, ...base];
    if (exploreMode !== 'All') {
      base = base.filter(p =>
        p?.category?.toLowerCase().includes(exploreMode.toLowerCase()) ||
        p?.vibe?.toLowerCase().includes(exploreMode.toLowerCase())
      );
    }
    return Array.from(new Set(base.map(p => p?.id || p?._id)))
      .map(id => base.find(p => (p?.id || p?._id) === id))
      .filter(Boolean);
  };

  const uniquePlaces = getFilteredPlaces();

  const mappedPlaces = FALLBACK_PLACES
    .map((d: any) => ({
      id: d?.id || d?._id,
      name: d?.name || 'Unknown',
      lat: d?.lat ?? null,
      lng: d?.lng ?? null,
      district: d?.district || 'Tamil Nadu',
      category: d?.category || 'General',
    }))
    .filter((p: any) => p.lat != null && p.lng != null);

  // ─── Place card ───────────────────────────────────────────────────────────
  const renderPlaceCard = (item: any) => {
    if (!item) return null;
    const isSaved   = (savedPlaces || []).includes(item?.id || item?._id);
    const vibeLabel = item?.vibe || item?.category?.toUpperCase() || 'EXPLORE';
    const vibeColor = VIBE_COLOR[vibeLabel] ?? '#A78BFA';

    return (
      <TouchableOpacity
        key={item?.id || item?._id || Math.random().toString()}
        style={styles.card}
        onPress={() => handlePlaceNavigation(item)}
        activeOpacity={0.88}
      >
        <SmartImage
          gradientOnly={true}
          name={item?.name}
          category={item?.category}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Dark scrim */}
        <LinearGradient
          colors={['transparent', 'rgba(8,8,18,0.85)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0.35 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Top row */}
        <View style={styles.cardTopRow}>
          <View style={[styles.vibePill, { borderColor: vibeColor + '55' }]}>
            <View style={[styles.vibeDot, { backgroundColor: vibeColor }]} />
            <Text style={[styles.vibePillText, { color: vibeColor }]}>{vibeLabel}</Text>
          </View>
          <TouchableOpacity
            style={styles.saveIcon}
            onPress={() => toggleSave(item?.id || item?._id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={16}
              color={isSaved ? '#FF4B4B' : 'rgba(255,255,255,0.8)'}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom info */}
        <View style={styles.cardFooter}>
          <Text style={styles.cardName} numberOfLines={1}>{item?.name}</Text>
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={11} color="rgba(255,255,255,0.5)" />
              <Text style={styles.metaText}>{item?.district || 'Tamil Nadu'}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="star" size={11} color="#FBBF24" />
              <Text style={[styles.metaText, { color: '#FBBF24' }]}>{item?.rating ?? '4.5'}</Text>
            </View>
            <View style={styles.metaDivider} />
            <Text style={styles.metaText}>{item?.weatherHint || '28°C'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Loading state ────────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#7C5CFF" />
        <Text style={styles.loadingText}>Syncing live travel data…</Text>
      </View>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C5CFF" />
        }
      >
        {/* ── 1. Header ── */}
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerEyebrow}>Tamil Nadu</Text>
            <Text style={styles.headerTitle}>Explore</Text>
          </View>
          <View style={styles.headerBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.headerBadgeText}>Live</Text>
          </View>
        </View>

        {/* ── 2. Search bar ── */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.35)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search places, temples, hills…"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={19} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* ── 3. Category pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsContainer}
        >
          {CATEGORIES.map(cat => {
            const active = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => { setSelectedCategory(cat.id); setExploreMode(cat.id); }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={active ? '#ffffff' : 'rgba(255,255,255,0.5)'}
                />
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── 4. Map card ── */}
        <View style={styles.mapSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Interactive Map</Text>
            <View style={styles.sectionTag}>
              <Text style={styles.sectionTagText}>Tamil Nadu</Text>
            </View>
          </View>
          <View style={styles.mapCard}>
            <ExploreMap
              places={mappedPlaces}
              onPinSelect={(place: Destination) => setSelectedPinPlace(place)}
              theme="dark"
            />
          </View>
        </View>

        {/* Selected map pin */}
        {selectedPinPlace && (
          <View style={styles.pinCard}>
            <View style={styles.pinCardHeader}>
              <Text style={styles.pinCardLabel}>Selected Destination</Text>
              <TouchableOpacity onPress={() => setSelectedPinPlace(null)}>
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
            {renderPlaceCard(selectedPinPlace)}
          </View>
        )}

        {/* ── 5. AI Insight card ── */}
        <View style={styles.aiSection}>
          <LinearGradient
            colors={['#2D1B8E', '#5B3FD9', '#7C5CFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiCard}
          >
            {/* subtle mesh overlay */}
            <View style={styles.aiMesh} />
            <View style={styles.aiCardContent}>
              <View style={{ flex: 1, gap: 6 }}>
                <View style={styles.aiLabelRow}>
                  <Text style={styles.aiSpark}>✦</Text>
                  <Text style={styles.aiLabel}>AI INSIGHT</Text>
                </View>
                <Text style={styles.aiText}>
                  <Text style={styles.aiHighlight}>Kodaikanal</Text> is peaceful today — low crowd, perfect weather for a mountain getaway!
                </Text>
              </View>
              <TouchableOpacity
                style={styles.aiBtn}
                onPress={() => router.push({ pathname: '/plan-trip', params: { destination: 'Kodaikanal' } } as any)}
                activeOpacity={0.85}
              >
                <Text style={styles.aiBtnText}>Plan Now</Text>
                <Ionicons name="arrow-forward" size={13} color="#5B3FD9" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* ── 6. Recommended ── */}
        <View style={styles.recommendedSection}>
          <View style={styles.recommendedHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.sectionTitle}>Recommended</Text>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsContainer}
          >
            {uniquePlaces.map((item: any, idx: number) => (
              <View key={item?.id || item?._id || `rec_${idx}`} style={{ marginRight: 14 }}>
                {renderPlaceCard(item)}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Bottom breathing room for tab bar */}
        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070710',
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
  },

  // ── Loading ──────────────────────────────────────────────────────────────
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070710',
    gap: 12,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 22,
    marginBottom: 22,
  },
  headerTextBlock: {
    gap: 2,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: '#7C5CFF',
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,217,100,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76,217,100,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    marginBottom: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CD964',
  },
  headerBadgeText: {
    color: '#4CD964',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Search ───────────────────────────────────────────────────────────────
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    gap: 10,
    marginBottom: 18,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111128',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '400',
  },
  filterBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#111128',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Category pills ────────────────────────────────────────────────────────
  pillsContainer: {
    paddingHorizontal: 22,
    paddingBottom: 2,
    gap: 8,
    marginBottom: 24,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  pillActive: {
    backgroundColor: 'rgba(124,92,255,0.18)',
    borderColor: 'rgba(124,92,255,0.6)',
  },
  pillText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // ── Section common ────────────────────────────────────────────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  sectionTag: {
    backgroundColor: 'rgba(124,92,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectionTagText: {
    color: '#9B7AFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  viewAll: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '500',
  },

  // ── Map ───────────────────────────────────────────────────────────────────
  mapSection: {
    paddingHorizontal: 22,
    marginBottom: 24,
  },
  mapCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 300,
    backgroundColor: '#0D0D1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  // ── Pin card ──────────────────────────────────────────────────────────────
  pinCard: {
    paddingHorizontal: 22,
    marginBottom: 24,
  },
  pinCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pinCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3,
  },

  // ── AI Insight ────────────────────────────────────────────────────────────
  aiSection: {
    paddingHorizontal: 22,
    marginBottom: 28,
  },
  aiCard: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 20,
    position: 'relative',
  },
  aiMesh: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  aiCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  aiSpark: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  aiLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  aiText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  aiHighlight: {
    color: '#ffffff',
    fontWeight: '700',
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 5,
    flexShrink: 0,
  },
  aiBtnText: {
    color: '#5B3FD9',
    fontWeight: '800',
    fontSize: 13,
  },

  // ── Recommended ───────────────────────────────────────────────────────────
  recommendedSection: {
    marginBottom: 12,
  },
  recommendedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 22,
  },
  cardsContainer: {
    paddingHorizontal: 22,
  },
  aiBadge: {
    backgroundColor: 'rgba(124,92,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.4)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBadgeText: {
    color: '#9B7AFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ── Place card ────────────────────────────────────────────────────────────
  card: {
    width: CARD_WIDTH,
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0D0D1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
  },
  cardTopRow: {
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
  },
  vibeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  vibePillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  saveIcon: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardFooter: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  cardName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '500',
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});