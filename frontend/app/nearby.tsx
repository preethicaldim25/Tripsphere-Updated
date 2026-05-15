import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { SmartImage } from '../components/ui/SmartImage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  SlideInUp,
} from 'react-native-reanimated';
import { useTheme } from '../context/themecontext';
import { destinationsAPI, Destination } from '../services/api';
import { getDestinationImage } from '../constants/images';
import NearbyMap from '../components/NearbyMap';

// -----------------------------------------------------------
// Constants
// -----------------------------------------------------------
const QUICK_FILTERS = [
  { label: 'Quick', icon: 'flash', value: 1 },
  { label: '3 Hours', icon: 'time', value: 3 },
  { label: 'Weekend', icon: 'calendar', value: 48 },
];

// -----------------------------------------------------------
// Component
// -----------------------------------------------------------
export default function NearbyScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { width, height } = useWindowDimensions();

  // On web screens ≥ 768 wide, show side-by-side
  const isSplit = width >= 768;

  // ---- state ----
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [results, setResults] = useState<Destination[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Destination | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [hasExact, setHasExact] = useState(true);
  const [budget, setBudget] = useState(3000);
  const [maxTime, setMaxTime] = useState(3);

  const mapRef = useRef<any>(null);

  // Pulsing animation for native user-location dot
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.4, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      true
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: 2 - pulseScale.value,
  }));

  // ---- location + initial fetch ----
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Fallback: use Tamil Nadu centre so map still shows something useful
          const fallback = { latitude: 11.1271, longitude: 78.6569 };
          setLocation(fallback);
          await fetchRecommendations(fallback);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setLocation(coord);
        await fetchRecommendations(coord);
      } catch (e) {
        console.error('[Nearby] location error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- fetch recommendations ----
  const fetchRecommendations = async (coord?: typeof location) => {
    const loc = coord || location;
    if (!loc) return;
    setLoading(true);
    try {
      const res = await destinationsAPI.getSmartRecommendations({
        user_lat: loc.latitude,
        user_lng: loc.longitude,
        max_budget: budget,
        max_time_hours: maxTime,
      });
      console.log("🌍 Destinations API response (Nearby):", res);
      setResults(res.results || []);
      console.log("📍 Stored destinations (Nearby):", res.results);
      setHasExact(res.has_exact_matches ?? true);
    } catch (error) {
      console.error('❌ Nearby fetch error:', error);
      Alert.alert('Error', 'Could not load suggestions. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  // ---- select place ----
  const handlePlaceSelect = (place: Destination) => {
    setSelectedPlace(place);
    if (location && place.coordinates) {
      setRouteCoordinates([
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: place.coordinates.lat, longitude: place.coordinates.lng },
      ]);
      // Animate native map
      if (mapRef.current && Platform.OS !== 'web') {
        const { lat, lng } = place.coordinates;
        mapRef.current.animateToRegion(
          {
            latitude: (location.latitude + lat) / 2,
            longitude: (location.longitude + lng) / 2,
            latitudeDelta: Math.abs(location.latitude - lat) * 2.2,
            longitudeDelta: Math.abs(location.longitude - lng) * 2.2,
          },
          1000
        );
      }
    }
  };

  // ---- render list card ----
  const renderCard = ({ item }: { item: Destination }) => {
    const isSelected = selectedPlace?.name === item.name;
    const isNear = !item.is_exact_match;
    return (
      <TouchableOpacity
        onPress={() => handlePlaceSelect(item)}
        style={[
          styles.placeCard,
          { backgroundColor: colors.card },
          isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '08' },
          { opacity: isNear ? 0.85 : 1 },
        ]}
        activeOpacity={0.85}
      >
        <SmartImage 
          gradientOnly={true}
          name={item.name}
          category={item.category || 'default'}
          style={styles.placeImgContainer} 
        />
        <View style={styles.placeInfo}>
          <Text style={[styles.placeName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.trafficRow}>
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.trafficText, { color: colors.textSecondary }]}>
              {item.real_time_duration ?? '—'} · Light Traffic
            </Text>
          </View>
          <View style={styles.tagsRow}>
            {(item.smart_tags ?? []).slice(0, 2).map((t: string, i: number) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
            ))}
          </View>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreNum}>{item.ai_score ?? '92'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // -----------------------------------------------------------
  // Layout constants
  // -----------------------------------------------------------
  const mapHeight = isSplit ? '100%' : 350;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

        <View
          style={[
            isSplit ? styles.shellRow : styles.shellCol,
            { flex: 1, backgroundColor: colors.background, overflow: 'hidden' }
          ]}
        >
          {/* ====== LEFT / TOP — Destination List (scrollable) ====== */}
          <View
            style={[
              styles.leftPanel,
              {
                flex: isSplit ? 2 : 1, // flex: 2 (≈ 65%) on web
                backgroundColor: colors.background,
                borderRightWidth: isSplit ? 1 : 0,
                borderRightColor: colors.border + '40',
                borderBottomWidth: isSplit ? 0 : 1,
                borderBottomColor: colors.border + '40',
              },
            ]}
          >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.iconBtn, { backgroundColor: colors.card }]}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.screenTitle, { color: colors.text }]}>Explore Nearby</Text>
          </View>

          {/* AI suggestion banner */}
          <View style={[styles.aiBanner, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
            <Text style={[styles.aiText, { color: colors.primary }]}>
              {hasExact
                ? `Best trip under ₹${budget} within ${maxTime}h`
                : 'Showing best available options'}
            </Text>
          </View>

          {/* Quick filters */}
          <View style={styles.filterRow}>
            {QUICK_FILTERS.map((f) => {
              const active = maxTime === f.value;
              return (
                <TouchableOpacity
                  key={f.value}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setMaxTime(f.value);
                    if (location) fetchRecommendations(location);
                  }}
                >
                  <Ionicons
                    name={f.icon as any}
                    size={14}
                    color={active ? '#fff' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: active ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Results list */}
          {loading ? (
            <View style={styles.centred}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingTxt, { color: colors.textSecondary }]}>
                Finding best trips…
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id ?? item.name}
              contentContainerStyle={{ gap: 10, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
              renderItem={renderCard}
              ListEmptyComponent={
                <View style={styles.centred}>
                  <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>
                    No trips found. Try relaxing your filters.
                  </Text>
                </View>
              }
            />
          )}
        </View>

          {/* ====== RIGHT / BOTTOM — Map (fixed view) ====== */}
          <View 
            style={[
              styles.mapPanel, 
              { 
                flex: 1, // flex: 1 (≈ 35%) on web
                height: isSplit ? '100%' : 350,
              }
            ]}
          >
            {/* Map fills the entire panel — NOT absolute positioned relative to parent shell */}
            <View style={{ flex: 1 }}>
            <NearbyMap
              mapRef={mapRef}
              theme={theme}
              colors={colors}
              location={location}
              pulseStyle={pulseStyle}
              results={results}
              selectedPlace={selectedPlace}
              handlePlaceSelect={handlePlaceSelect}
              routeCoordinates={routeCoordinates}
              styles={styles}
            />
          </View>

          {/* Floating detail card — rendered ABOVE the map */}
          {selectedPlace && (
            <Animated.View entering={SlideInUp.duration(400)} style={styles.infoCard}>
              <View style={[styles.infoCardInner, { backgroundColor: colors.card }]}>
                <View style={styles.infoCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoName, { color: colors.text }]} numberOfLines={1}>
                      {selectedPlace.name}
                    </Text>
                    <View style={styles.infoMetaRow}>
                      <Ionicons name="time-outline" size={14} color={colors.primary} />
                      <Text style={[styles.infoMeta, { color: colors.textSecondary }]}>
                        {selectedPlace.real_time_duration ?? '—'}
                      </Text>
                      <Text style={{ color: colors.textSecondary, marginHorizontal: 4 }}>•</Text>
                      <Ionicons name="wallet-outline" size={14} color={colors.primary} />
                      <Text style={[styles.infoMeta, { color: colors.textSecondary }]}>
                        ₹{selectedPlace.avg_cost_per_person ?? selectedPlace.estimated_budget ?? '—'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedPlace(null)}
                    style={[styles.iconBtn, { backgroundColor: colors.background + '80' }]}
                  >
                    <Ionicons name="close" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.infoCardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    onPress={() =>
                      router.push(`/destination/${encodeURIComponent(selectedPlace.name)}`)
                    }
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.actionBtnTxt}>Add to Trip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.border + '60' }]}
                  >
                    <Ionicons name="navigate-outline" size={18} color={colors.text} />
                    <Text style={[styles.actionBtnTxt, { color: colors.text }]}>Navigate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------
// Styles — kept flat and straightforward to avoid web issues
// -----------------------------------------------------------
const styles = StyleSheet.create({
  root: { flex: 1 },
  shell: { flex: 1 },
  shellRow: { flexDirection: 'row', width: '100%', height: '100%' },
  shellCol: { flexDirection: 'column', width: '100%', height: '100%' },

  // Left panel
  leftPanel: { overflow: 'hidden', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  screenTitle: { fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
  aiBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 14, marginBottom: 12,
  },
  aiText: { fontSize: 13, fontWeight: '700', flex: 1 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterChip: {
    flex: 1, height: 38, borderRadius: 10, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  filterChipText: { fontSize: 12, fontWeight: '700' },

  // Cards
  placeCard: {
    flexDirection: 'row', borderRadius: 20, padding: 12,
    borderWidth: 1.5, borderColor: 'transparent',
    gap: 12, alignItems: 'center',
    marginBottom: 4,
  },
  placeImgContainer: { width: 72, height: 72, borderRadius: 14, overflow: 'hidden' },
  placeImg: { width: '100%', height: '100%' },
  placeInfo: { flex: 1, justifyContent: 'center', gap: 3 },
  placeName: { fontSize: 15, fontWeight: '800' },
  trafficRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  trafficText: { fontSize: 11, fontWeight: '600' },
  tagsRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: '700' },
  scoreBadge: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FBBF24',
    justifyContent: 'center', alignItems: 'center',
  },
  scoreNum: { fontSize: 11, fontWeight: '900', color: '#000' },

  // Empty / loading
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  loadingTxt: { fontSize: 13, fontWeight: '600' },
  emptyTxt: { fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },

  // Map panel
  mapPanel: { position: 'relative', overflow: 'hidden' },

  // These are passed to NearbyMap (.native only) for interior styling
  map: { flex: 1, width: '100%', height: '100%' },
  userMarkerContainer: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  userPulse: {
    position: 'absolute', width: 40, height: 40, borderRadius: 20,
  },
  userDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: '#fff' },
  destMarker: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', padding: 3,
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
  activeDestMarker: { transform: [{ scale: 1.25 }] },
  markerImg: { width: '100%', height: '100%', borderRadius: 20 },
  movingIndicator: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff', elevation: 5,
  },

  // Floating info card
  infoCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 100,
    maxWidth: 500,
    alignSelf: 'center',
  },
  infoCardInner: {
    borderRadius: 24, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 20,
    elevation: 12,
    minWidth: 280,
  },
  infoCardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  infoName: { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  infoMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoMeta: { fontSize: 13, fontWeight: '600' },
  infoCardActions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, height: 48, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  actionBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
});