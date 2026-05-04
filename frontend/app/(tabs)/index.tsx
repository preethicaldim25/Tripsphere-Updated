import React, {
  useRef, useEffect, useState, useCallback, useMemo,
} from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  TextInput, StyleSheet, Dimensions, SafeAreaView,
  StatusBar, ActivityIndicator, Platform,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withTiming, withRepeat, withSequence, FadeInUp,
} from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/themecontext';
import { destinationService } from '../../services/destination.service';
import { getDestinationImage } from '../../constants/images';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');
// Cap layout width so large web screens don't blow up spacing
const HERO_H = 250;
const SLIDE_W = SCREEN_W - 32;

const FALLBACK_HERO = [
  { id: 'ooty',       title: 'Ooty',       subtitle: 'Hill Station',  tags: ['Nature', 'Families'] },
  { id: 'madurai',    title: 'Madurai',    subtitle: 'Heritage',      tags: ['Culture', 'Temples'] },
  { id: 'chennai',    title: 'Chennai',    subtitle: 'Coastal City',  tags: ['Beaches', 'Urban'] },
  { id: 'kodaikanal', title: 'Kodaikanal', subtitle: 'Hill Station',  tags: ['Nature', 'Couples'] },
  { id: 'rameswaram', title: 'Rameswaram', subtitle: 'Spiritual',     tags: ['Temple', 'Island'] },
];

const FALLBACK_CARDS = [
  { id: 'ooty',       name: 'Ooty',       category: 'Hill Station', rating: 4.8, reviews: 1200, crowd: 'Medium', temperature: '18°C' },
  { id: 'madurai',    name: 'Madurai',    category: 'Heritage',     rating: 4.9, reviews: 2500, crowd: 'High',   temperature: '28°C' },
  { id: 'chennai',    name: 'Chennai',    category: 'Coastal',      rating: 4.5, reviews: 5000, crowd: 'High',   temperature: '32°C' },
  { id: 'kodaikanal', name: 'Kodaikanal', category: 'Hill Station', rating: 4.7, reviews: 1800, crowd: 'Medium', temperature: '20°C' },
  { id: 'rameswaram', name: 'Rameswaram', category: 'Spiritual',    rating: 4.6, reviews: 900,  crowd: 'Low',    temperature: '30°C' },
];

const ACTIONS = [
  { id: 'plan',   label: 'Plan Trip', icon: 'map',       route: '/plan-trip',    bg: '#2C2A34', color: '#B388FF' },
  { id: 'nearby', label: 'Nearby',    icon: 'location',  route: '/nearby',       bg: '#E8F5E9', color: '#4CAF50' },
  { id: 'gems',   label: 'Gems',      icon: 'diamond',   route: '/hidden-gems',  bg: '#FFF3E0', color: '#FF9800' },
  { id: 'road',   label: 'Road Trip', icon: 'car',       route: '/road-trip',    bg: '#E3F2FD', color: '#2196F3' },
];

// ─────────────────────────────────────────────
// Skeleton card
// ─────────────────────────────────────────────
const SkeletonCard = ({ colors }: any) => {
  const op = useSharedValue(0.4);
  useEffect(() => {
    op.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })), -1);
  }, []);
  const s = useAnimatedStyle(() => ({ opacity: op.value }));
  return (
    <Animated.View style={[{ width: '100%', height: 220, borderRadius: 16, backgroundColor: colors.card, marginBottom: 16 }, s]} />
  );
};

// ─────────────────────────────────────────────
// Hero Carousel (self-contained, auto-scroll)
// ─────────────────────────────────────────────
const HeroCarousel = ({ data, onPress, colors }: any) => {
  const flatRef = useRef<any>(null);
  const idxRef  = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!data.length) return;
    const t = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % data.length;
      flatRef.current?.scrollToIndex({ index: idxRef.current, animated: true });
    }, 5000);
    return () => clearInterval(t);
  }, [data.length]);

  const onScroll = useCallback((event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    if (Math.round(index) !== currentIndex && Math.round(index) >= 0 && Math.round(index) < data.length) {
      setCurrentIndex(Math.round(index));
      idxRef.current = Math.round(index);
    }
  }, [currentIndex, data.length]);

  const renderItem = useCallback(({ item }: any) => (
    <TouchableOpacity
      activeOpacity={0.93}
      onPress={() => onPress(item.id)}
      style={{ width: SLIDE_W, height: HERO_H }}
    >
      <Image
        source={{ uri: getDestinationImage(item.title) }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', padding: 24, paddingBottom: 36 }]}
      >
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>{item.subtitle}</Text>
        <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: -0.5, marginBottom: 12 }}>{item.title}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(item.tags || []).map((t: string) => (
            <View key={t} style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{t}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  ), [onPress]);

  return (
    <View style={{ height: HERO_H, overflow: 'hidden', borderRadius: 20, marginHorizontal: 16 }}>
      <FlatList
        ref={flatRef}
        data={data}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onScrollToIndexFailed={() => {}}
        bounces={false}
        style={{ width: SLIDE_W }}
        getItemLayout={(_, index) => ({ length: SLIDE_W, offset: SLIDE_W * index, index })}
      />
      
      {/* Pagination Dots */}
      <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        {data.map((_: any, i: number) => (
          <View
            key={i}
            style={{
              width: currentIndex === i ? 7 : 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: currentIndex === i ? '#A990FF' : 'rgba(255, 255, 255, 0.4)',
            }}
          />
        ))}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────
const SectionHeader = ({ title, onViewAll, colors }: any) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 }}>
    <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: -0.3 }}>{title}</Text>
    <TouchableOpacity onPress={onViewAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>View All</Text>
      <Ionicons name="chevron-forward" size={14} color={colors.primary} />
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────────
// Destination Card (used in horizontal lists)
// ─────────────────────────────────────────────
const DestCard = ({ item, onPress, colors }: any) => {
  const crowdColor = item.crowd === 'Low' ? '#4CAF50' : item.crowd === 'Medium' ? '#FF9800' : '#F44336';
  return (
    <TouchableOpacity
      onPress={() => onPress(item.id || item.name)}
      activeOpacity={0.9}
      style={{
        width: '100%', height: 220, borderRadius: 16, overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
      }}
    >
      <Image source={{ uri: getDestinationImage(item.name) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', padding: 14 }]}>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{item.category}</Text>
          </View>
          <View style={{ backgroundColor: crowdColor, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{item.crowd} Crowd</Text>
          </View>
        </View>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 4 }}>{item.name}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{item.rating} ({item.reviews})</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="thermometer-outline" size={12} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{item.temperature}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// Horizontal card list
// ─────────────────────────────────────────────
const CardRow = ({ data, onPress, loading, colors }: any) => {
  if (loading) {
    return (
      <View style={{ paddingHorizontal: 20 }}>
        {[1, 2, 3].map(k => <SkeletonCard key={k} colors={colors} />)}
      </View>
    );
  }
  return (
    <View style={{ paddingHorizontal: 20 }}>
      {data.map((item: any, index: number) => (
        <DestCard key={item.id || item.name} item={item} onPress={onPress} colors={colors} />
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────
// Popular city grid card
// ─────────────────────────────────────────────
const CityCard = ({ item, onPress, colors }: any) => (
  <TouchableOpacity
    onPress={() => onPress(item.name)}
    style={{ width: '100%', height: 160, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}
    activeOpacity={0.9}
  >
    <Image source={{ uri: getDestinationImage(item.name) }} style={StyleSheet.absoluteFill} contentFit="cover" />
    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', padding: 12 }]}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{item.name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
        <Ionicons name="star" size={11} color="#FFD700" />
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{item.rating}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────
// AI Promo Card
// ─────────────────────────────────────────────
const AICard = ({ onPress, colors }: any) => {
  return (
    <Animated.View style={{ marginHorizontal: 20, marginVertical: 8 }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ borderRadius: 24, overflow: 'hidden' }}>
        <LinearGradient colors={['#BFA8FF', '#A88BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 4 }}>AI Travel Assistant</Text>
            <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 13, fontWeight: '700' }}>Generate a personalized itinerary in seconds</Text>
          </View>
          <View style={{ padding: 8 }}>
            <Ionicons name="sparkles" size={32} color="#fff" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function HomeScreen() {
  const router  = useRouter();
  const { user } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();

  const [search,      setSearch]      = useState('');
  const [apiLoading,  setApiLoading]  = useState(false);
  const [heroData,    setHeroData]    = useState(FALLBACK_HERO);
  const [happeningNow, setHappeningNow] = useState(FALLBACK_CARDS);
  const [aiPicks,     setAiPicks]     = useState(FALLBACK_CARDS.slice().reverse());
  const [popularCities, setPopularCities] = useState(FALLBACK_CARDS.slice(0, 4));

  const themeBounce = useSharedValue(1);
  const themeBounceStyle = useAnimatedStyle(() => ({ transform: [{ scale: themeBounce.value }] }));

  // ── Load API data (non-blocking — fallback already set) ──
  useEffect(() => {
    const load = async () => {
      setApiLoading(true);
      try {
        const [exploreRes, featuredRes] = await Promise.allSettled([
          destinationService.getExploreData(),
          destinationService.getFeatured(),
        ]);

        if (featuredRes.status === 'fulfilled' && featuredRes.value?.length) {
          setHeroData(
            featuredRes.value.map((d: any) => ({
              id: d.id || d._id || d.name,
              title: d.name, subtitle: d.category || 'Popular Destination',
              category: d.category || 'Featured',
              tags: d.speciality_tags || []
            }))
          );
        }

        if (exploreRes.status === 'fulfilled' && exploreRes.value) {
          const ex = exploreRes.value;
          if (ex.weekendTrips?.length)  setHappeningNow(ex.weekendTrips);
          if (ex.aiPicks?.length)       setAiPicks(ex.aiPicks);
          if (ex.lowCrowd?.length)      setPopularCities(ex.lowCrowd.slice(0, 4));
        }
      } catch (e) {
        console.warn('[Home] API error, using fallback:', e);
      } finally {
        setApiLoading(false);
      }
    };
    load();
  }, []);

  const nav   = useCallback((path: string) => router.push(path as any), [router]);
  const goTo  = useCallback((id: string)   => router.push(`/destination/${encodeURIComponent(id)}` as any), [router]);

  const handleTheme = () => {
    toggleTheme();
    themeBounce.value = withSequence(withSpring(1.2), withSpring(1));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, justifyContent: 'flex-start' }}
        bounces={true}
        style={{ flex: 1 }}
      >
        {/* ── HEADER ── */}
        <View style={s.header}>
          <View>
            <Text style={[s.greeting, { color: colors.text }]}>Vanakkam,</Text>
            <Text style={[s.brand, { color: colors.primary }]}>Tripsphere</Text>
          </View>
          <View style={s.headerRight}>
            {/* Refresh indicator */}
            {apiLoading && <ActivityIndicator size="small" color={colors.primary} />}

            <Animated.View style={themeBounceStyle}>
              <TouchableOpacity
                onPress={handleTheme}
                style={[s.iconBtn, { backgroundColor: '#1E1E1E', borderColor: 'transparent' }]}
              >
                <Ionicons name={theme === 'light' ? 'moon' : 'sunny'} size={20} color="#a6a6a6" />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              onPress={() => nav('/(tabs)/profile')}
              style={[s.iconBtn, { backgroundColor: '#B388FF', borderColor: 'transparent' }]}
            >
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
                {user?.name?.charAt(0).toUpperCase() || 'N'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SEARCH ── */}
        <View style={[s.searchBar, { backgroundColor: '#1A181C', borderColor: 'transparent' }]}>
          <Ionicons name="search-outline" size={20} color="#777" />
          <TextInput
            style={[s.searchInput, { color: colors.text }]}
            placeholder="Search destinations in Tamil Nadu..."
            placeholderTextColor="#777"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => nav(`/search?q=${encodeURIComponent(search)}` as any)}
            returnKeyType="search"
          />
        </View>

        {/* ── HERO CAROUSEL ── */}
        <Animated.View entering={FadeInUp.delay(50).duration(500)} style={{ marginBottom: 24 }}>
          <HeroCarousel data={heroData} onPress={goTo} colors={colors} />
        </Animated.View>

        {/* ── QUICK ACTIONS ── */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={s.actionsRow}>
          {ACTIONS.map(a => (
            <TouchableOpacity key={a.id} onPress={() => nav(a.route as any)} style={s.actionBtn} activeOpacity={0.8}>
              <View style={[s.actionIcon, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon as any} size={28} color={a.color} />
              </View>
              <Text style={[s.actionLabel, { color: colors.text }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ── AI CARD ── */}
        <Animated.View entering={FadeInUp.delay(150).duration(500)} style={{ marginBottom: 24 }}>
          <AICard onPress={() => nav('/plan-trip')} colors={colors} />
        </Animated.View>

        {/* ── HAPPENING NOW ── */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={{ marginBottom: 8 }}>
          <SectionHeader title="Weekend Trips" onViewAll={() => nav('/weekend-trips')} colors={colors} />
          <CardRow data={happeningNow} onPress={goTo} loading={false} colors={colors} />
        </Animated.View>

        {/* ── POPULAR CITIES GRID ── */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ marginTop: 24, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Popular Cities</Text>
            <TouchableOpacity onPress={() => nav('/popular')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>View All</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'column', gap: 12 }}>
            {popularCities.map(c => (
              <CityCard key={c.id || c.name} item={c} onPress={goTo} colors={colors} />
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 16,
  },
  greeting:   { fontSize: 16, fontWeight: '700', marginBottom: 2, color: '#fff' },
  brand:      { fontSize: Math.min(32, SCREEN_W * 0.085), fontWeight: '900', letterSpacing: -0.5 },
  headerRight:{ flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginBottom: 24,
    paddingHorizontal: 16, paddingVertical: 16,
    borderRadius: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500', padding: 0 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  actionsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 24, marginBottom: 24,
  },
  actionBtn:   { alignItems: 'center', gap: 8 },
  actionIcon:  {
    width: 62, height: 62, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  actionLabel: { fontSize: 12, fontWeight: '700' },
});