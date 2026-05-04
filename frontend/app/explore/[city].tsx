import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/themecontext';
import { LinearGradient } from 'expo-linear-gradient';
import { destinationsAPI, Destination } from '../../services/api';
import { getDestinationImage } from '../../constants/images';
import ExploreMap from '../../components/ExploreMap';

const { width } = Dimensions.get('window');

type TabType = 'Overview' | 'Attractions' | 'Food' | 'Activities' | 'Plan';
const TABS: TabType[] = ['Overview', 'Attractions', 'Food', 'Activities', 'Plan'];

export default function CityDetailScreen() {
  const { city } = useLocalSearchParams<{ city: string }>();
  const router = useRouter();
  const { colors, theme } = useTheme();

  const [cityData, setCityData] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [foodType, setFoodType] = useState<'veg' | 'non-veg'>('veg');
  const [selectedFood, setSelectedFood] = useState<any>(null);

  useEffect(() => {
    const fetchCityData = async () => {
      try {
        setLoading(true);
        console.log("📍 destinationId:", city);
        if (!city || city === "undefined") {
          console.warn("🚫 Blocked invalid destinationId:", city);
          return;
        }
        console.log("📡 Fetching destination:", city);
        const data = await destinationsAPI.getPlace(city);
        setCityData(data);
      } catch (error) {
        console.error('Error fetching city data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCityData();
  }, [city]);

  const styles = getStyles(colors);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Exploring {city}...</Text>
      </View>
    );
  }

  if (!cityData) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Not Found', headerStyle: { backgroundColor: colors.card } }} />
        <Ionicons name="sad-outline" size={60} color={colors.textLight} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>City Not Found</Text>
        <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>We couldn't find details for {city}.</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderOverview = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>About {cityData.name}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{cityData.description}</Text>
      
      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Best Time</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{cityData.ai_recommendations?.best_time || 'October to March'}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={20} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Crowd Tip</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{cityData.ai_recommendations?.crowd_tips || 'Visit early morning'}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Specialities</Text>
      <View style={styles.tagContainer}>
        {cityData.speciality_tags?.map((tag, index) => (
          <View key={index} style={[styles.tag, { backgroundColor: colors.lightPurple }]}>
            <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderAttractions = () => (
    <View style={styles.section}>
      {cityData.attractions && cityData.attractions.length > 0 ? cityData.attractions.map((place, index) => (
        <View key={index} style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{place.name}</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{place.type}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/map')}>
              <Ionicons name="map-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )) : (
        <Text style={[styles.emptyText, { color: colors.textLight }]}>No attractions listed yet.</Text>
      )}
    </View>
  );

  const renderFood = () => (
    <View style={styles.section}>
      <View style={styles.foodToggle}>
        <TouchableOpacity 
          style={[styles.foodToggleBtn, foodType === 'veg' && [styles.foodToggleActive, { backgroundColor: '#22c55e' }]]}
          onPress={() => setFoodType('veg')}
        >
          <Text style={[styles.foodToggleText, foodType === 'veg' && styles.foodToggleTextActive]}>🟢 Veg</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.foodToggleBtn, foodType === 'non-veg' && [styles.foodToggleActive, { backgroundColor: '#ef4444' }]]}
          onPress={() => setFoodType('non-veg')}
        >
          <Text style={[styles.foodToggleText, foodType === 'non-veg' && styles.foodToggleTextActive]}>🔴 Non-Veg</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.splitView}>
        <View style={styles.leftContent}>
          {(cityData.food || []).filter(f => foodType === 'veg' ? f.cuisine.toLowerCase().includes('veg') : !f.cuisine.toLowerCase().includes('pure veg')).map((food, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.card, selectedFood?.name === food.name && { borderColor: colors.primary, borderWidth: 2 }, { backgroundColor: colors.card }]}
              onPress={() => setSelectedFood(food)}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{food.name}</Text>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={14} color="#FBBF24" />
                  <Text style={styles.ratingText}>{food.rating}</Text>
                </View>
              </View>
              <Text style={[styles.cuisine, { color: colors.primary }]}>{food.cuisine}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.rightMap}>
          <ExploreMap 
            places={(cityData.food || []).map(f => ({ ...f, id: f.name, coordinates: { lat: cityData.coordinates?.lat || 11, lng: cityData.coordinates?.lng || 78 } }))}
            theme={theme}
            center={[cityData.coordinates?.lat || 11, cityData.coordinates?.lng || 78]}
            zoom={14}
          />
        </View>
      </View>
    </View>
  );

  const renderActivities = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Things to Do</Text>
      <View style={styles.activityGrid}>
        {['Sightseeing', 'Shopping', 'Photography', 'Food Walk'].map((act, idx) => (
          <View key={idx} style={[styles.activityItem, { backgroundColor: colors.card }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={[styles.activityText, { color: colors.text }]}>{act}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPlan = () => (
    <View style={styles.section}>
      <TouchableOpacity 
        style={[styles.planCard, { backgroundColor: colors.primary }]}
        onPress={() => router.push({ pathname: '/plan-trip', params: { destination: cityData.name }} as any)}
      >
        <Ionicons name="sparkles" size={32} color="#fff" />
        <View style={styles.planContent}>
          <Text style={styles.planTitle}>Build Your {cityData.name} Trip</Text>
          <Text style={styles.planSubtitle}>Let AI generate a perfect 3-day itinerary for you</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.bookingCard, { borderColor: colors.primary, borderWidth: 1 }]}
        onPress={() => Linking.openURL(`https://www.booking.com/searchresults.html?ss=${cityData.name}`)}
      >
        <Ionicons name="bed-outline" size={24} color={colors.primary} />
        <Text style={[styles.bookingText, { color: colors.primary }]}>Find Stays in {cityData.name}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview': return renderOverview();
      case 'Attractions': return renderAttractions();
      case 'Food': return renderFood();
      case 'Activities': return renderActivities();
      case 'Plan': return renderPlan();
      default: return renderOverview();
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.scrollview} bounces={false}>
          {/* Hero Banner */}
          <View style={styles.hero}>
            <Image 
              source={{ uri: getDestinationImage(cityData.name) }} 
              style={styles.heroImage} 
              resizeMode="cover"
            />
            <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']} style={styles.gradient} />
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.roundBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.roundBtn}>
                <Ionicons name="bookmark-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>{cityData.name}</Text>
              <Text style={styles.heroSubtitle}>{cityData.category}</Text>
              <View style={styles.heroStats}>
                <View style={styles.statChip}>
                  <Ionicons name="star" size={14} color="#FBBF24" />
                  <Text style={styles.statText}>{cityData.rating}</Text>
                </View>
                <View style={styles.statChip}>
                  <Ionicons name="wallet-outline" size={14} color="#fff" />
                  <Text style={styles.statText}>₹{cityData.estimated_budget}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabBtn, activeTab === tab && [styles.tabBtnActive, { borderBottomColor: colors.primary }]]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === tab && [styles.tabTextActive, { color: colors.primary }]]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Content Area */}
          <View style={styles.content}>
            {renderTabContent()}
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { 
    flex: 1,
  },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16 },
  errorTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  errorDesc: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  scrollview: { flex: 1 },
  hero: { width: '100%', height: 350, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  gradient: { position: 'absolute', width: '100%', height: '100%' },
  heroActions: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  roundBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  heroContent: { position: 'absolute', bottom: 30, left: 25, right: 25 },
  heroTitle: { fontSize: 36, fontWeight: '900', color: '#fff', marginBottom: 4, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 18, color: '#e2e8f0', marginBottom: 15, fontWeight: '500' },
  heroStats: { flexDirection: 'row', gap: 12 },
  statChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, gap: 6 },
  statText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  tabsContainer: { height: 60, justifyContent: 'center' },
  tabsScroll: { paddingHorizontal: 20, alignItems: 'center', gap: 20 },
  tabBtn: { paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabBtnActive: { },
  tabText: { fontSize: 15, fontWeight: '700' },
  tabTextActive: { },

  content: { padding: 25 },
  section: { flex: 1 },
  sectionTitle: { fontSize: 22, fontWeight: '800', marginBottom: 15 },
  description: { fontSize: 16, lineHeight: 26, marginBottom: 25 },
  
  infoCard: { borderWidth: 1, borderRadius: 24, padding: 20, marginBottom: 30 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 15 },

  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  tagText: { fontSize: 14, fontWeight: '700' },

  card: { padding: 20, borderRadius: 24, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardSub: { fontSize: 13, marginTop: 2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251,191,36,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  ratingText: { fontSize: 14, fontWeight: '800', color: '#B45309' },
  cuisine: { fontSize: 14, fontWeight: '600', marginTop: 8 },

  foodToggle: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  foodToggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
  foodToggleActive: { },
  foodToggleText: { fontWeight: '700', fontSize: 14 },
  foodToggleTextActive: { color: '#fff' },

  splitView: { flexDirection: 'row', height: 500, gap: 15 },
  leftContent: { flex: 1.2 },
  rightMap: { flex: 1, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },

  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15, borderRadius: 16, width: (width - 62) / 2 },
  activityText: { fontSize: 14, fontWeight: '600' },

  planCard: { padding: 25, borderRadius: 28, flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 },
  planContent: { flex: 1 },
  planTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  planSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 18 },

  bookingCard: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 20, borderRadius: 24, justifyContent: 'center' },
  bookingText: { fontSize: 16, fontWeight: '700' },

  emptyText: { textAlign: 'center', fontSize: 16, marginTop: 40, fontStyle: 'italic' },
});
