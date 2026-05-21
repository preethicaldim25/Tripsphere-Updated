import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/themecontext';
import { useTrip } from '../context/TripContext';
import { aiAPI } from '../services/api';
import ExploreMap from '../components/ExploreMap';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

interface RouteInsight {
  type: 'safety' | 'eats' | 'scenic' | 'ev';
  icon: string;
  color: string;
  title: string;
  text: string;
}

interface TravelRoute {
  origin: string;
  destination: string;
  distance_km: number;
  duration: string;
  weather: string;
  status_badge: string;
  status_color: string;
  geometry: Array<{ lat: number; lng: number }>;
  insights: RouteInsight[];
}

export default function RoadTripScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { trips } = useTrip();

  // Active planned trip detection
  const plannedTrip = trips.find(t => t.status === 'upcoming' || t.status === 'ongoing');

  // Input states
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [loading, setLoading] = useState(false);

  // Companion status
  const [activeRoute, setActiveRoute] = useState<TravelRoute | null>(null);
  const [isDriving, setIsDriving] = useState(false);
  const [insightIndex, setInsightIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const startCompanion = async (start: string, end: string) => {
    setLoading(true);
    try {
      const data = await aiAPI.generateRoadTripIntelligence({ origin: start, destination: end });
      if (data && data.geometry) {
        setActiveRoute(data);
        setInsightIndex(0);
        setIsDriving(true);
      } else {
        Alert.alert('Route Error', 'Could not retrieve coordinates for this route. Please try another Tamil Nadu city.');
      }
    } catch (e: any) {
      console.error('[RoadTrip] Fetch intelligence error:', e);
      Alert.alert('Network Error', e.message || 'Could not connect to route intelligence server.');
    } finally {
      setLoading(false);
    }
  };

  const endCompanion = () => {
    setIsDriving(false);
    setActiveRoute(null);
  };

  const handleNextInsight = () => {
    if (activeRoute) {
      setInsightIndex((insightIndex + 1) % activeRoute.insights.length);
    }
  };

  const handlePrevInsight = () => {
    if (activeRoute) {
      setInsightIndex((insightIndex - 1 + activeRoute.insights.length) % activeRoute.insights.length);
    }
  };

  const handleLaunchSearch = () => {
    if (!startLocation || !endLocation) {
      Alert.alert('Incomplete Fields', 'Please fill in both start and destination points.');
      return;
    }
    startCompanion(startLocation, endLocation);
  };

  const styles = getStyles(colors);

  // Compile coordinates and POIs dynamically for Leaflet render
  const mapPlaces = activeRoute
    ? [
        ...activeRoute.geometry.map((g, idx) => ({
          name: idx === 0 ? `Start: ${activeRoute.origin}` : idx === activeRoute.geometry.length - 1 ? `Destination: ${activeRoute.destination}` : `Waypoint ${idx}`,
          lat: g.lat,
          lng: g.lng
        })),
        ...activeRoute.insights
          .filter(ins => !activeFilter || ins.type === activeFilter)
          .map((ins, idx) => ({
            name: `${ins.title}: ${ins.text.slice(0, 30)}...`,
            // Stagger insights coordinates slightly off the main route geometry for visual clarity
            lat: activeRoute.geometry[Math.min(activeRoute.geometry.length - 1, idx + 2)]?.lat + 0.005,
            lng: activeRoute.geometry[Math.min(activeRoute.geometry.length - 1, idx + 2)]?.lng + 0.005
          }))
      ]
    : [];

  const currentInsight = activeRoute && activeRoute.insights[insightIndex] ? activeRoute.insights[insightIndex] : null;

  return (
    <>
      <Stack.Screen options={{ 
        title: isDriving ? 'Driving Companion' : 'Active Drive Planner',
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShown: !isDriving
      }} />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        
        {isDriving && activeRoute ? (
          <View style={StyleSheet.absoluteFill}>
            
            {/* Real Route Dynamic Map */}
            <View style={{ flex: 1 }}>
              <ExploreMap
                places={mapPlaces}
                center={activeRoute.geometry[0] ? [activeRoute.geometry[0].lat, activeRoute.geometry[0].lng] : [11.12, 78.65]}
                zoom={10}
                theme={theme}
              />
            </View>

            {/* FLOATING TOP COMPACT HUD */}
            <View style={styles.topFloatingBar}>
              <View style={[styles.compactHUD, { backgroundColor: colors.card + 'F2', borderColor: colors.border }]}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={[styles.hudRouteTitle, { color: colors.text }]} numberOfLines={1}>
                    {activeRoute.origin} ➔ {activeRoute.destination}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                      {activeRoute.distance_km} km left • {activeRoute.duration}
                    </Text>
                    <View style={[styles.statusIndicator, { backgroundColor: activeRoute.status_color + '20' }]}>
                      <Text style={{ color: activeRoute.status_color, fontSize: 9, fontWeight: '700' }}>
                        {activeRoute.status_badge.split(' ')[0]}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity onPress={endCompanion} style={[styles.closeCompanionBtn, { backgroundColor: colors.background }]}>
                  <Ionicons name="close" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* MINIMAL RIGHT POI FILTER MARGINS */}
            <View style={styles.rightFilterPanel}>
              <TouchableOpacity 
                style={[styles.miniPoiBtn, { backgroundColor: activeFilter === 'ev' ? '#4CD964' : colors.card }]}
                onPress={() => setActiveFilter(activeFilter === 'ev' ? null : 'ev')}
              >
                <Ionicons name="battery-charging" size={16} color={activeFilter === 'ev' ? '#fff' : '#4CD964'} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.miniPoiBtn, { backgroundColor: activeFilter === 'eats' ? '#FF9500' : colors.card }]}
                onPress={() => setActiveFilter(activeFilter === 'eats' ? null : 'eats')}
              >
                <Ionicons name="restaurant" size={16} color={activeFilter === 'eats' ? '#fff' : '#FF9500'} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.miniPoiBtn, { backgroundColor: activeFilter === 'scenic' ? '#5AC8FA' : colors.card }]}
                onPress={() => setActiveFilter(activeFilter === 'scenic' ? null : 'scenic')}
              >
                <Ionicons name="camera" size={16} color={activeFilter === 'scenic' ? '#fff' : '#5AC8FA'} />
              </TouchableOpacity>
            </View>

            {/* DYNAMIC ONE SMART INSIGHT AT A TIME */}
            {currentInsight && (
              <View style={styles.bottomInsightContainer}>
                <Animated.View 
                  entering={FadeInDown.duration(300)} 
                  layout={Layout} 
                  style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <View style={[styles.insightIconContainer, { backgroundColor: currentInsight.color + '15' }]}>
                      <Ionicons name={currentInsight.icon as any} size={16} color={currentInsight.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>
                        {currentInsight.title.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.insightBodyText, { color: colors.text }]}>
                    {currentInsight.text}
                  </Text>

                  <View style={styles.insightNavRow}>
                    <TouchableOpacity onPress={handlePrevInsight} style={[styles.navBtn, { borderColor: colors.border }]}>
                      <Ionicons name="chevron-back" size={16} color={colors.text} />
                    </TouchableOpacity>

                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
                      Insight {insightIndex + 1} of {activeRoute.insights.length}
                    </Text>

                    <TouchableOpacity onPress={handleNextInsight} style={[styles.navBtn, { borderColor: colors.border }]}>
                      <Ionicons name="chevron-forward" size={16} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                </Animated.View>
              </View>
            )}

          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
            
            {/* Header intro */}
            <View style={styles.welcomeHeader}>
              <View style={[styles.compIconBg, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name="navigate" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.compTitle, { color: colors.text }]}>Driving Companion</Text>
              <Text style={[styles.compSub, { color: colors.textSecondary }]}>
                Fully context-aware navigation companion that maps dynamic safety warnings, EV chargers, and dining spots tailored to your current active drive.
              </Text>
            </View>

            {/* DETECT ACTIVE PLANNED TRIP */}
            {plannedTrip && (
              <Animated.View entering={FadeInDown.duration(400)} style={[styles.activeTripCard, { backgroundColor: colors.card, borderColor: colors.primary + '30' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Ionicons name="sparkles" size={18} color={colors.primary} />
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>Ongoing Planned Journey Mapped</Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 14 }}>
                  Your upcoming trip to <Text style={{ color: colors.text, fontWeight: '700' }}>{plannedTrip.destination_name || plannedTrip.title}</Text> has been detected. Start driving companion to load localized alerts, rest areas, and safety updates.
                </Text>
                
                {loading ? <ActivityIndicator color={colors.primary} style={{ alignSelf: 'center', marginVertical: 10 }} /> : (
                  <TouchableOpacity 
                    style={[styles.launchCompanionBtn, { backgroundColor: colors.primary }]}
                    onPress={() => startCompanion('Chennai', plannedTrip.destination_name || 'Ooty')}
                  >
                    <Ionicons name="car-sport" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Launch companion for this trip</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}

            {/* Custom Input Route Search Box */}
            <View style={[styles.customForm, { backgroundColor: colors.card, borderColor: colors.border, marginTop: plannedTrip ? 10 : 0 }]}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>Custom Drive Route Planner</Text>
              <View style={styles.inputRow}>
                <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="Start city (e.g. Coimbatore)"
                    placeholderTextColor={colors.textLight}
                    value={startLocation}
                    onChangeText={setStartLocation}
                  />
                </View>
                <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Ionicons name="flag-outline" size={16} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="Destination (e.g. Ooty)"
                    placeholderTextColor={colors.textLight}
                    value={endLocation}
                    onChangeText={setEndLocation}
                  />
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.planBtn, { backgroundColor: colors.primary }]}
                onPress={handleLaunchSearch}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="compass" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Start Custom Highway Journey</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </ScrollView>
        )}

      </View>
    </>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 60 },
  
  welcomeHeader: { alignItems: 'center', marginBottom: 24, textAlign: 'center', marginTop: 10 },
  compIconBg: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  compTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  compSub: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6, paddingHorizontal: 10 },
  
  activeTripCard: { padding: 18, borderRadius: 22, borderWidth: 1, marginBottom: 20 },
  launchCompanionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: 12, gap: 6 },

  customForm: { padding: 18, borderRadius: 20, borderWidth: 1 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, height: 40 },
  textInput: { flex: 1, fontSize: 12, marginLeft: 6 },
  planBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: 12, gap: 6 },

  // Active Drive Companion Mode Styles
  topFloatingBar: { position: 'absolute', top: 20, left: 16, right: 16, zIndex: 100 },
  compactHUD: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4 },
  hudRouteTitle: { fontSize: 13, fontWeight: '800' },
  statusIndicator: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  closeCompanionBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

  rightFilterPanel: { position: 'absolute', right: 16, top: 110, zIndex: 100, gap: 10 },
  miniPoiBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },

  bottomInsightContainer: { position: 'absolute', bottom: 20, left: 16, right: 16, zIndex: 100 },
  insightCard: { padding: 16, borderRadius: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4 },
  insightIconContainer: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  insightLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  insightBodyText: { fontSize: 13, lineHeight: 18, fontWeight: '600', marginBottom: 14 },
  
  insightNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.12)', paddingTop: 12 },
  navBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center' }
});