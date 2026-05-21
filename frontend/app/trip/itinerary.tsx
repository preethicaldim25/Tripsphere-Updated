import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { itineraryAPI, DayItinerary, Activity, Category, tripsAPI, destinationsAPI } from '../../services/api';
import { useTheme } from '../../context/themecontext';
import ExploreMap from '../../components/ExploreMap';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function ItineraryScreen() {
    const { tripId, startDate, endDate } = useLocalSearchParams<{
        tripId: string;
        startDate: string;
        endDate: string;
    }>();
    const router = useRouter();
    const { colors, theme } = useTheme();
    const [itinerary, setItinerary] = useState<DayItinerary[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    const [timePickerVisible, setTimePickerVisible] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'stays' | 'map'>('list');
    const [trip, setTrip] = useState<any>(null);
    const [destinationDetails, setDestinationDetails] = useState<any>(null);
    const [activityForm, setActivityForm] = useState<Omit<Activity, 'id'>>({
        time: '09:00',
        title: '',
        description: '',
        location: '',
        cost: 0,
        category: 'sightseeing' as Category,
    });

    const getDayPlaces = (trip: any, dayNum: number) => {
      const dayData = trip?.itinerary?.find((d: any) => d.day === dayNum);
      if (!dayData) return [];
      return (dayData.activities || [])
        .filter((a: any) => {
            const lat = a.lat || a.latitude;
            const lng = a.lng || a.longitude;
            return lat && lng && !isNaN(lat) && !isNaN(lng);
        })
        .map((a: any) => ({
          name: a.title || a.name || 'Activity',
          lat: Number(a.lat || a.latitude),
          lng: Number(a.lng || a.longitude),
          category: a.category || 'sightseeing'
        }));
    };

    const getMapPlaces = (trip: any) => {
      // Support both manual + AI trips
      if (trip?.stops && trip.stops.length > 0) {
        // Manual trip: use stop_details or stops
        if (trip.stop_details && trip.stop_details.length > 0) {
            return trip.stop_details.map((s: any) => ({
                name: s.name,
                lat: s.coordinates?.lat || s.lat,
                lng: s.coordinates?.lng || s.lng,
                category: 'waypoint'
            })).filter(p => p.lat && p.lng);
        }
        return trip.stops.map((s: any) => {
            const fb = getFallbackCoords(s);
            return { name: s, lat: fb.lat, lng: fb.lng, category: 'waypoint' };
        });
      }

      // AI Trip: Derive from ALL itinerary days
      return (trip?.itinerary || []).flatMap((day: any) => 
        (day.activities || []).map((a: any) => ({
            name: a.title || a.name,
            lat: a.lat || a.latitude,
            lng: a.lng || a.longitude,
            category: a.category
        }))
      ).filter((p: any) => p.lat && p.lng && !isNaN(p.lat) && !isNaN(p.lng));
    };

    const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
        switch (category) {
            case 'food': return 'restaurant';
            case 'sightseeing': return 'camera';
            case 'travel': return 'car';
            case 'accommodation': return 'bed';
            default: return 'ellipse';
        }
    };

    const getCategoryColor = (category: string): string => {
        switch (category) {
            case 'food': return '#FF6B6B';
            case 'sightseeing': return '#4ECDC4';
            case 'travel': return '#6B4EFF';
            case 'accommodation': return '#FFB347';
            default: return '#999';
        }
    };

    // Initial fetch and initialization
    React.useEffect(() => {
        const initializeItinerary = async () => {
            try {
                if (!tripId) return;
                
                setLoading(true);
                const tripData = await tripsAPI.getById(tripId);
                setTrip(tripData);
                
                try {
                    const destIdOrName = tripData.destination_id || tripData.destination;
                    console.log("📍 destinationId:", destIdOrName);
                    if (!destIdOrName || destIdOrName === "undefined") {
                        console.warn("🚫 Blocked invalid destinationId:", destIdOrName);
                    } else {
                        console.log("📡 Fetching destination:", destIdOrName);
                        const dest = await destinationsAPI.getPlace(destIdOrName);
                        setDestinationDetails(dest);
                    }
                } catch (e) {
                    console.log('Could not load destination details for map');
                }

                if (tripData.itinerary && tripData.itinerary.length > 0) {
                    setItinerary(tripData.itinerary);
                } else {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const daysCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    const initialItinerary: DayItinerary[] = [];
                    for (let i = 0; i < daysCount; i++) {
                        const date = new Date(start);
                        date.setDate(start.getDate() + i);
                        initialItinerary.push({
                            day: i + 1,
                            date: date.toISOString().split('T')[0],
                            activities: [],
                        });
                    }
                    setItinerary(initialItinerary);
                }
            } catch (error) {
                console.error('Error fetching itinerary:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeItinerary();
    }, [tripId, startDate, endDate]);

    // Save itinerary to backend whenever it changes
    const saveItinerary = async (updatedItinerary: DayItinerary[]) => {
        try {
            await itineraryAPI.updateItinerary(tripId, updatedItinerary);
        } catch (error) {
            console.error('❌ Error saving itinerary:', error);
            Alert.alert('Save Failed', 'Could not save changes to server.');
        }
    };

    const handleAddActivity = (day: number) => {
        setSelectedDay(day);
        setEditingActivity(null);
        setActivityForm({
            time: '09:00',
            title: '',
            description: '',
            location: '',
            cost: 0,
            category: 'sightseeing',
        });
        setModalVisible(true);
    };

    const handleEditActivity = (day: number, activity: Activity) => {
        setSelectedDay(day);
        setEditingActivity(activity);
        setActivityForm({
            time: activity.time,
            title: activity.title,
            description: activity.description || '',
            location: activity.location || '',
            cost: activity.cost || 0,
            category: activity.category as Category,
        });
        setModalVisible(true);
    };

    const handleSaveActivity = () => {
        if (!activityForm.title.trim()) {
            Alert.alert('Error', 'Please enter an activity title');
            return;
        }

        const newActivity: Activity = {
            id: editingActivity?.id || Date.now().toString(),
            time: activityForm.time,
            title: activityForm.title,
            description: activityForm.description,
            location: activityForm.location,
            cost: Number(activityForm.cost) || 0,
            category: activityForm.category,
        };

        const newItinerary = itinerary.map(day => {
            if (day.day === selectedDay) {
                if (editingActivity) {
                    return {
                        ...day,
                        activities: day.activities.map(a =>
                            a.id === editingActivity.id ? newActivity : a
                        ),
                    };
                } else {
                    return {
                        ...day,
                        activities: [...day.activities, newActivity].sort((a, b) =>
                            a.time.localeCompare(b.time)
                        ),
                    };
                }
            }
            return day;
        });

        setItinerary(newItinerary);
        saveItinerary(newItinerary);
        setModalVisible(false);
    };

    const handleDeleteActivity = (day: number, activityId: string) => {
        Alert.alert(
            'Delete Activity',
            'Are you sure you want to delete this activity?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        const newItinerary = itinerary.map(d => {
                            if (d.day === day) {
                                return {
                                    ...d,
                                    activities: d.activities.filter(a => a.id !== activityId),
                                };
                            }
                            return d;
                        });
                        setItinerary(newItinerary);
                        saveItinerary(newItinerary);
                    },
                },
            ]
        );
    };

    const calculateDailyBudget = (activities: Activity[]) => {
        return activities.reduce((sum, act) => sum + (act.cost || 0), 0);
    };

    const totalBudgetSpent = itinerary.reduce((sum, day) => sum + calculateDailyBudget(day.activities), 0);
    const targetBudget = trip?.budget || 0;
    const remainingBudget = targetBudget - totalBudgetSpent;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'short'
        });
    };

    const getFallbackCoords = (destName: string) => {
        if (!destName) return { lat: 11.0, lng: 78.0 };
        const dn = destName.toLowerCase();
        if (dn.includes('ooty')) return { lat: 11.4064, lng: 76.6932 };
        if (dn.includes('kodaikanal')) return { lat: 10.2381, lng: 77.4892 };
        if (dn.includes('mahabalipuram')) return { lat: 12.6269, lng: 80.1927 };
        if (dn.includes('madurai')) return { lat: 9.9252, lng: 78.1198 };
        if (dn.includes('chennai')) return { lat: 13.0827, lng: 80.2707 };
        if (dn.includes('coimbatore')) return { lat: 11.0168, lng: 76.9558 };
        if (dn.includes('trichy')) return { lat: 10.7905, lng: 78.7047 };
        if (dn.includes('kanyakumari')) return { lat: 8.0883, lng: 77.5385 };
        if (dn.includes('rameswaram')) return { lat: 9.2876, lng: 79.3129 };
        if (dn.includes('yercaud')) return { lat: 11.7753, lng: 78.2093 };
        if (dn.includes('yelagiri')) return { lat: 12.5768, lng: 78.6367 };
        if (dn.includes('kolli hills')) return { lat: 11.2485, lng: 78.3385 };
        return { lat: 11.1271, lng: 78.6569 };
    };

    const fallbackDestCoords = getFallbackCoords(trip?.destination);

    const getCoordsForName = (name: string) => {
        if (!name || !destinationDetails) return null;
        const lowName = name.toLowerCase();
        if (lowName === destinationDetails.name?.toLowerCase() && destinationDetails.coordinates) {
            return destinationDetails.coordinates;
        }
        if (destinationDetails.attractions) {
            const match = destinationDetails.attractions.find((a: any) => a.name.toLowerCase().includes(lowName) || lowName.includes(a.name.toLowerCase()));
            if (match && match.lat && match.lng) return { lat: match.lat, lng: match.lng };
        }
        const foodGroups = [destinationDetails.food?.veg, destinationDetails.food?.nonVeg];
        for (const group of foodGroups) {
            if (group) {
                const match = group.find((a: any) => a.name.toLowerCase().includes(lowName));
                if (match && match.lat && match.lng) return { lat: match.lat, lng: match.lng };
            }
        }
        if (destinationDetails.accommodation) {
            const match = destinationDetails.accommodation.find((a: any) => a.name.toLowerCase().includes(lowName));
            if (match && match.lat && match.lng) return { lat: match.lat, lng: match.lng };
        }
        return null;
    };

    // ─── BUILD MAP MARKERS FROM REAL DB COORDINATES ────────────────────────────
    // Priority: use pre-populated destination_details / stop_details (from backend)
    // which carry actual coordinates. Fall back to name-based lookup only as last resort.
    // ─── BUILD MAP MARKERS ────────────────────────────
    const places = getMapPlaces(trip);
    
    // Add start and end for route continuity
    const startName = trip?.start_location || 'Start';
    const startCoords = getFallbackCoords(startName);
    
    const destDetails = trip?.destination_details;
    const destName = destDetails?.name || trip?.destination || 'Destination';
    const destLat = destDetails?.coordinates?.lat ?? destDetails?.coordinates?.latitude ?? destDetails?.lat ?? null;
    const destLng = destDetails?.coordinates?.lng ?? destDetails?.coordinates?.longitude ?? destDetails?.lng ?? null;
    const resolvedDestCoords = (destLat && destLng) ? { lat: Number(destLat), lng: Number(destLng) } : getFallbackCoords(destName);

    const finalPlaces = [
        { name: startName, lat: startCoords.lat, lng: startCoords.lng, category: 'start' },
        ...places,
        { name: destName, lat: resolvedDestCoords.lat, lng: resolvedDestCoords.lng, category: 'end' }
    ].filter(p => p.lat && p.lng);

    const routeMarkers = finalPlaces;

    console.log("📍 stops:", trip?.stops);
    console.log("📍 itinerary:", trip?.itinerary);
    console.log("📍 final places:", routeMarkers);

    const styles = getStyles(colors);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Loading your journey...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{
                title: trip?.name || 'Trip Plan',
                headerStyle: { backgroundColor: colors.card },
                headerTintColor: colors.text,
            }} />

            {/* Premium Dynamic Tab Selector */}
            <View style={[styles.tabSelector, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity 
                    style={[styles.tabButton, viewMode === 'list' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
                    onPress={() => setViewMode('list')}
                >
                    <Ionicons name="calendar" size={16} color={viewMode === 'list' ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.tabText, { color: viewMode === 'list' ? colors.text : colors.textSecondary, fontWeight: viewMode === 'list' ? '700' : '500' }]}>Itinerary</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tabButton, viewMode === 'stays' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
                    onPress={() => setViewMode('stays')}
                >
                    <Ionicons name="bed" size={16} color={viewMode === 'stays' ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.tabText, { color: viewMode === 'stays' ? colors.text : colors.textSecondary, fontWeight: viewMode === 'stays' ? '700' : '500' }]}>Stays</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tabButton, viewMode === 'map' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
                    onPress={() => setViewMode('map')}
                >
                    <Ionicons name="map" size={16} color={viewMode === 'map' ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.tabText, { color: viewMode === 'map' ? colors.text : colors.textSecondary, fontWeight: viewMode === 'map' ? '700' : '500' }]}>Route</Text>
                </TouchableOpacity>
            </View>

            {viewMode === 'map' && (
                <View style={{ flex: 1 }}>
                    {routeMarkers.length > 0 ? (
                        <ExploreMap
                            places={routeMarkers}
                            routePlaces={routeMarkers}
                            theme={theme}
                            showRoute={true}
                            id={`itinerary-map-${tripId}`}
                        />
                    ) : (
                        <View style={[styles.center, { backgroundColor: colors.background }]}>
                            <Ionicons name="map-outline" size={64} color={colors.textLight} />
                            <Text style={{ color: colors.textSecondary, marginTop: 15, fontSize: 16 }}>No locations available for this trip</Text>
                        </View>
                    )}
                </View>
            )}

            {viewMode === 'stays' && (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                    {/* Header: Smart Local Travel Advisor Alert */}
                    <Animated.View entering={FadeInUp.delay(50).duration(500)} style={[styles.advisorHeader, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30', borderWidth: 1, borderRadius: 24, padding: 20, marginBottom: 20 }]}>
                        <View style={styles.advisorTitleRow}>
                            <Ionicons name="sparkles" size={24} color={colors.primary} />
                            <View style={{ marginLeft: 10, flex: 1 }}>
                                <Text style={[styles.advisorTitle, { color: colors.text, fontSize: 16, fontWeight: '800' }]}>Local Travel Advisor Recommendation</Text>
                                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Personalized area & lodging analysis</Text>
                            </View>
                        </View>
                        
                        <View style={[styles.advisorSection, { borderLeftColor: colors.primary, borderLeftWidth: 3, paddingLeft: 12, marginTop: 15 }]}>
                            <Text style={[styles.advisorSub, { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 4 }]}>📍 Recommended Area: {trip?.metadata?.accommodations?.recommended_area || "Central Neighborhood"}</Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>{trip?.metadata?.accommodations?.area_description || "Quiet, scenic district selected for balanced pacing and safety suitability."}</Text>
                        </View>

                        <View style={[styles.advisorSection, { borderLeftColor: '#4CD964', borderLeftWidth: 3, paddingLeft: 12, marginTop: 15 }]}>
                            <Text style={[styles.advisorSub, { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 4 }]}>💡 Insight: Why Recommended?</Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>{trip?.metadata?.accommodations?.why_recommended || "Highly accessible area matching transport guidelines and pacing constraints."}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, padding: 10, borderRadius: 12 }}>
                                <Ionicons name="shield-checkmark" size={14} color="#4CD964" />
                                <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }} numberOfLines={1}>Comfort: {trip?.metadata?.accommodations?.comfort_level || "Balanced"}</Text>
                            </View>
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, padding: 10, borderRadius: 12 }}>
                                <Ionicons name="wallet-outline" size={14} color={colors.primary} />
                                <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }} numberOfLines={1}>Range: {trip?.metadata?.accommodations?.price_range || "Value"}</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Destination Intelligence & Local Insights Panel */}
                    {trip?.metadata?.locality_name && (
                        <Animated.View entering={FadeInUp.delay(80).duration(500)} style={[styles.advisorHeader, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }]}>
                            <View style={styles.advisorTitleRow}>
                                <Ionicons name="compass" size={24} color={colors.primary} />
                                <View style={{ marginLeft: 10, flex: 1 }}>
                                    <Text style={[styles.advisorTitle, { color: colors.text, fontSize: 16, fontWeight: '800' }]}>Destination Intelligence</Text>
                                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Deep local insights & advisory tips</Text>
                                </View>
                            </View>

                            {/* Weather & Climate Advisor */}
                            {trip.metadata.weather_suitability && (
                                <View style={{ marginTop: 15, backgroundColor: colors.background, padding: 12, borderRadius: 14 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <Ionicons name="sunny" size={16} color="#FF9500" />
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>Weather & Clothing Alert:</Text>
                                    </View>
                                    <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>{trip.metadata.weather_suitability}</Text>
                                </View>
                            )}

                            {/* Local Food streets & Famous Delicacies */}
                            {(trip.metadata.famous_foods || trip.metadata.food_streets) && (
                                <View style={{ marginTop: 15, backgroundColor: colors.background, padding: 12, borderRadius: 14 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                        <Ionicons name="restaurant" size={16} color={colors.primary} />
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>Famous Delicacies & Food Streets:</Text>
                                    </View>
                                    {trip.metadata.famous_foods && trip.metadata.famous_foods.length > 0 && (
                                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                                            🍲 Try local specialties: <Text style={{ fontWeight: '700', color: colors.text }}>{trip.metadata.famous_foods.join(', ')}</Text>
                                        </Text>
                                    )}
                                    {trip.metadata.food_streets && trip.metadata.food_streets.length > 0 && (
                                        <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
                                            📍 Food Streets: {trip.metadata.food_streets.join(' | ')}
                                        </Text>
                                    )}
                                </View>
                            )}

                            {/* Transit, Accessibility & Crowds */}
                            <View style={{ marginTop: 15, flexDirection: 'row', gap: 10 }}>
                                {trip.metadata.transit_advice && (
                                    <View style={{ flex: 1, backgroundColor: colors.background, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                                            <Ionicons name="bus" size={12} color={colors.primary} />
                                            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text }}>Transit & Travel:</Text>
                                        </View>
                                        <Text style={{ fontSize: 10, color: colors.textSecondary }} numberOfLines={3}>{trip.metadata.transit_advice}</Text>
                                    </View>
                                )}
                                
                                {trip.metadata.crowd_level && (
                                    <View style={{ flex: 1, backgroundColor: colors.background, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                                            <Ionicons name="people" size={12} color="#5AC8FA" />
                                            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text }}>Crowds:</Text>
                                        </View>
                                        <Text style={{ fontSize: 10, color: colors.textSecondary }} numberOfLines={3}>{trip.metadata.crowd_level}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Safety & Comfort Rating */}
                            {trip.metadata.safety_info && (
                                <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
                                    <Ionicons name="shield-checkmark" size={14} color="#4CD964" />
                                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>Safety rating: {trip.metadata.safety_info}</Text>
                                </View>
                            )}
                        </Animated.View>
                    )}

                    {/* Stays List */}
                    {trip?.metadata?.accommodations?.list?.map((hotel: any, index: number) => (
                        <Animated.View 
                            entering={FadeInUp.delay(100 * index).duration(500)}
                            key={index} 
                            style={[styles.hotelCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                        >
                            <View style={styles.hotelHeader}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                                        <View style={[styles.hotelBadge, { backgroundColor: colors.primary + '15' }]}>
                                            <Text style={[styles.hotelBadgeText, { color: colors.primary }]}>{hotel.badge || "AI Pick"}</Text>
                                        </View>
                                        <View style={[styles.localityBadge, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }]}>
                                            <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600' }}>{hotel.area || "Local Area"}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.hotelName, { color: colors.text }]}>{hotel.name}</Text>
                                    <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>{hotel.type}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <View style={{ backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{hotel.price}</Text>
                                    </View>
                                    <Text style={{ color: colors.textSecondary, fontSize: 9, marginTop: 4 }}>nightly estimate</Text>
                                </View>
                            </View>

                            <Text style={[styles.hotelDesc, { color: colors.textSecondary }]}>{hotel.desc}</Text>

                            <View style={{ backgroundColor: colors.background, padding: 12, borderRadius: 12, marginBottom: 15 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <Ionicons name="checkmark-circle" size={16} color="#4CD964" />
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>Why it fits your trip:</Text>
                                </View>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>{hotel.why || "Matches travelers size, comfort limits, and local transit access perfectly."}</Text>
                            </View>

                            <View style={[styles.hotelDivider, { backgroundColor: colors.border }]} />

                            <View style={styles.hotelMetaGrid}>
                                <View style={styles.hotelMetaItem}>
                                    <Ionicons name="map-outline" size={14} color={colors.primary} />
                                    <Text style={[styles.hotelMetaText, { color: colors.text }]} numberOfLines={1}>Attractions: {hotel.attractions}</Text>
                                </View>
                                <View style={styles.hotelMetaItem}>
                                    <Ionicons name="car-outline" size={14} color={colors.primary} />
                                    <Text style={[styles.hotelMetaText, { color: colors.text }]} numberOfLines={1}>Transit: {hotel.convenience}</Text>
                                </View>
                                <View style={styles.hotelMetaItem}>
                                    <Ionicons name="shield-checkmark-outline" size={14} color="#4CD964" />
                                    <Text style={[styles.hotelMetaText, { color: colors.text }]} numberOfLines={1}>Safety: {hotel.safety}</Text>
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={[styles.hotelActionBtn, { backgroundColor: colors.primary, borderHeight: 0 }]}
                                onPress={() => alert("Direct booking affiliate connections active in Phase 2!")}
                            >
                                <Text style={[styles.hotelActionBtnText, { color: '#fff' }]}>Reserve & Lock Deal</Text>
                                <Ionicons name="arrow-forward" size={14} color="#fff" />
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </ScrollView>
            )}

            {viewMode === 'list' && (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Budget Dashboard */}
                    <View style={[styles.budgetDashboard, { backgroundColor: colors.primary }]}>
                        <View style={styles.budgetRow}>
                            <View>
                                <Text style={styles.budgetLabel}>Planned Budget</Text>
                                <Text style={styles.budgetMain}>₹{targetBudget.toLocaleString()}</Text>
                            </View>
                            <View style={styles.budgetCircle}>
                                <Text style={styles.budgetPercent}>{Math.round((totalBudgetSpent/targetBudget)*100)}%</Text>
                            </View>
                        </View>
                        <View style={styles.budgetStats}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Spent</Text>
                                <Text style={styles.statValue}>₹{totalBudgetSpent.toLocaleString()}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Remaining</Text>
                                <Text style={[styles.statValue, { color: remainingBudget < 0 ? '#FF4B4B' : '#fff' }]}>₹{remainingBudget.toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Mini Map Preview */}
                    {routeMarkers.length > 0 && (
                        <View style={[styles.miniMapContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
                            <View style={[styles.miniMapOverlay, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)' }]}>
                                <Ionicons name="map" size={16} color={colors.text} />
                                <Text style={[styles.miniMapTitle, { color: colors.text }]}>Trip Route Preview</Text>
                            </View>
                            <ExploreMap
                                places={routeMarkers}
                                routePlaces={routeMarkers}
                                theme={theme}
                                showRoute={true}
                                id={`mini-map-${tripId}`}
                            />
                        </View>
                    )}
                    {/* Smart Review Metadata */}
                    {trip?.metadata && (
                        <View style={[styles.metadataContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.metadataHeader, { color: colors.text }]}>
                                <Ionicons name="sparkles" size={18} color="#6B4EFF" /> Smart Trip Summary
                            </Text>
                            <View style={styles.metadataGrid}>
                                <View style={styles.metadataItem}>
                                    <Ionicons name="car-outline" size={20} color={colors.textSecondary} />
                                    <View style={{ marginLeft: 8 }}>
                                        <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>Est. Distance</Text>
                                        <Text style={[styles.metadataValue, { color: colors.text }]}>{trip.metadata.estimated_distance_km} km</Text>
                                    </View>
                                </View>
                                <View style={styles.metadataItem}>
                                    <Ionicons name="wallet-outline" size={20} color={colors.textSecondary} />
                                    <View style={{ marginLeft: 8 }}>
                                        <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>Budget Health</Text>
                                        <Text style={[styles.metadataValue, { color: trip.metadata.budget_health === 'Lavish' ? '#10B981' : (trip.metadata.budget_health === 'Tight' ? '#FF4B4B' : colors.text) }]}>{trip.metadata.budget_health}</Text>
                                    </View>
                                </View>
                                <View style={styles.metadataItem}>
                                    <Ionicons name="bed-outline" size={20} color={colors.textSecondary} />
                                    <View style={{ marginLeft: 8 }}>
                                        <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>Stay Suggestion</Text>
                                        <Text style={[styles.metadataValue, { color: colors.text, fontSize: 12 }]}>{trip.metadata.hotel_suggestions}</Text>
                                    </View>
                                </View>
                                <View style={styles.metadataItem}>
                                    <Ionicons name="partly-sunny-outline" size={20} color={colors.textSecondary} />
                                    <View style={{ marginLeft: 8 }}>
                                        <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>Conditions</Text>
                                        <Text style={[styles.metadataValue, { color: colors.text }]}>{trip.metadata.weather_suitability}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={[styles.aiAlert, { backgroundColor: 'rgba(107,78,255,0.06)' }]}>
                                <Ionicons name="information-circle" size={16} color="#6B4EFF" />
                                <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1, marginLeft: 8 }}>{trip.metadata.best_time_alerts}</Text>
                            </View>
                        </View>
                    )}

                    {/* Itinerary Days */}
                    <View style={styles.daysList}>
                        {itinerary.map((day) => (
                            <View key={day.day} style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <View style={styles.dayHeader}>
                                    <View>
                                        <Text style={[styles.dayTitle, { color: colors.text }]}>Day {day.day}</Text>
                                        <Text style={[styles.dayDate, { color: colors.textSecondary }]}>{formatDate(day.date)}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.addActBtn, { backgroundColor: colors.lightPurple }]}
                                        onPress={() => handleAddActivity(day.day)}
                                    >
                                        <Ionicons name="add" size={20} color={colors.primary} />
                                        <Text style={[styles.addActTxt, { color: colors.primary }]}>Add</Text>
                                    </TouchableOpacity>
                                </View>

                                {day.activities.length === 0 ? (
                                    <View style={[styles.emptyDay, { backgroundColor: colors.background }]}>
                                        <Text style={[styles.emptyTxt, { color: colors.textLight }]}>No activities yet</Text>
                                    </View>
                                ) : (
                                    day.activities.map((activity) => (
                                        <View key={activity.id} style={styles.activityRow}>
                                            <View style={styles.activityTimeLine}>
                                                <Text style={[styles.timeText, { color: colors.textSecondary }]}>{activity.time}</Text>
                                                <View style={[styles.dot, { backgroundColor: getCategoryColor(activity.category) }]} />
                                                <View style={[styles.line, { backgroundColor: colors.border }]} />
                                            </View>
                                            <TouchableOpacity 
                                                style={[styles.activityBox, { backgroundColor: colors.background }]}
                                                onPress={() => handleEditActivity(day.day, activity)}
                                            >
                                                <View style={styles.actTop}>
                                                    <Text style={[styles.actTitle, { color: colors.text }]} numberOfLines={1}>{activity.title}</Text>
                                                    <Text style={[styles.actCost, { color: colors.primary }]}>₹{activity.cost}</Text>
                                                </View>
                                                <View style={styles.actBottom}>
                                                    <Ionicons name={getCategoryIcon(activity.category)} size={12} color={getCategoryColor(activity.category)} />
                                                    <Text style={[styles.actCat, { color: colors.textLight }]}>{activity.category}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                )}
                            </View>
                        ))}
                    </View>
                    <View style={{ height: 20 }} />
                </ScrollView>
            )}

            {/* Bottom Action Buttons (List Mode) */}
            {viewMode === 'list' && (
                <View style={[styles.bottomActions, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TouchableOpacity 
                        style={[styles.draftBtn, { backgroundColor: 'rgba(107, 78, 255, 0.1)' }]} 
                        onPress={() => {
                            Alert.alert('Draft Saved', 'Your trip has been saved as a draft.');
                            router.push('/(tabs)/trips');
                        }}
                    >
                        <Text style={[styles.draftBtnTxt, { color: '#6B4EFF' }]}>Save Draft</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.confirmBtn} 
                        onPress={() => {
                            router.push({
                                pathname: '/trip/success',
                                params: {
                                    tripId,
                                    destination: trip?.destination || trip?.destination_details?.name || 'Your Destination',
                                    startDate,
                                    endDate,
                                    budget: targetBudget
                                }
                            });
                        }}
                    >
                        <LinearGradient
                            colors={['#6B4EFF', '#FF4B4B']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.confirmBtnInner}
                        >
                            <Text style={styles.confirmBtnTxt}>Confirm Trip</Text>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            {/* Add Activity Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{editingActivity ? 'Edit Activity' : 'Add Activity'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Time</Text>
                                <TouchableOpacity
                                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border }]}
                                    onPress={() => setTimePickerVisible(true)}
                                >
                                    <Text style={{ color: colors.text }}>{activityForm.time}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                    value={activityForm.title}
                                    onChangeText={(text) => setActivityForm({ ...activityForm, title: text })}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Category</Text>
                                <View style={styles.catGrid}>
                                    {(['sightseeing', 'food', 'travel', 'accommodation'] as const).map(cat => (
                                        <TouchableOpacity 
                                            key={cat}
                                            style={[styles.catChip, { borderColor: colors.border }, activityForm.category === cat && { backgroundColor: getCategoryColor(cat), borderColor: getCategoryColor(cat) }]}
                                            onPress={() => setActivityForm({ ...activityForm, category: cat })}
                                        >
                                            <Ionicons name={getCategoryIcon(cat)} size={14} color={activityForm.category === cat ? '#fff' : getCategoryColor(cat)} />
                                            <Text style={[styles.catTxt, { color: colors.textSecondary }, activityForm.category === cat && { color: '#fff' }]}>{cat}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Cost (₹)</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                    value={(activityForm.cost ?? 0).toString()}
                                    onChangeText={(text) => setActivityForm({ ...activityForm, cost: Number(text.replace(/[^0-9]/g, '')) })}
                                    keyboardType="numeric"
                                />
                            </View>
                        </ScrollView>

                        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveActivity}>
                                <Text style={styles.saveBtnTxt}>Save Activity</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <DateTimePicker
                isVisible={timePickerVisible}
                mode="time"
                onConfirm={(date) => {
                    setTimePickerVisible(false);
                    setActivityForm({ ...activityForm, time: date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') });
                }}
                onCancel={() => setTimePickerVisible(false)}
            />
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    budgetDashboard: { padding: 25, borderRadius: 0, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, marginBottom: 20 },
    budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    budgetLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
    budgetMain: { color: '#fff', fontSize: 32, fontWeight: '900' },
    budgetCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    budgetPercent: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    budgetStats: { flexDirection: 'row', gap: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
    statItem: { flex: 1 },
    statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 },
    statValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
    daysList: { padding: 16 },
    dayCard: { borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1 },
    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    dayTitle: { fontSize: 20, fontWeight: '800' },
    dayDate: { fontSize: 13 },
    addActBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4 },
    addActTxt: { fontSize: 13, fontWeight: '700' },
    activityRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
    activityTimeLine: { alignItems: 'center', width: 45 },
    timeText: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
    dot: { width: 10, height: 10, borderRadius: 5, zIndex: 1 },
    line: { width: 2, flex: 1, marginTop: -5 },
    activityBox: { flex: 1, padding: 12, borderRadius: 16 },
    actTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    actTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
    actCost: { fontSize: 13, fontWeight: '800' },
    actBottom: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actCat: { fontSize: 11, textTransform: 'capitalize' },
    emptyDay: { padding: 20, alignItems: 'center', borderRadius: 16 },
    emptyTxt: { fontSize: 13, fontStyle: 'italic' },
    modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 25, borderBottomWidth: 1 },
    modalTitle: { fontSize: 20, fontWeight: '800' },
    modalForm: { padding: 25 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
    input: { padding: 15, borderRadius: 15, borderWidth: 1, fontSize: 15 },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    catTxt: { fontSize: 13, fontWeight: '600' },
    modalFooter: { padding: 25, borderTopWidth: 1 },
    saveBtn: { padding: 18, borderRadius: 18, alignItems: 'center' },
    saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
    miniMapContainer: { height: 200, marginHorizontal: 16, marginBottom: 20, borderRadius: 24, overflow: 'hidden', borderWidth: 1 },
    miniMapOverlay: { position: 'absolute', top: 10, left: 10, zIndex: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
    miniMapTitle: { fontSize: 12, fontWeight: '700' },
    bottomActions: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, flexDirection: 'row', gap: 15, borderTopWidth: 1 },
    draftBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    draftBtnTxt: { fontSize: 15, fontWeight: '700' },
    confirmBtn: { flex: 1.5, borderRadius: 16, overflow: 'hidden', shadowColor: '#6B4EFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
    confirmBtnInner: { paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    confirmBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
    metadataContainer: { marginHorizontal: 16, marginBottom: 20, borderRadius: 24, padding: 20, borderWidth: 1 },
    metadataHeader: { fontSize: 16, fontWeight: '800', marginBottom: 15, flexDirection: 'row', alignItems: 'center', gap: 6 },
    metadataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 15 },
    metadataItem: { width: '45%', flexDirection: 'row', alignItems: 'center', gap: 2 },
    metadataLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    metadataValue: { fontSize: 13, fontWeight: '700', marginTop: 2 },
    aiAlert: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginTop: 5 },
    
    // Stays & Tab Switching styling
    tabSelector: {
        flexDirection: 'row',
        height: 50,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        height: '100%',
    },
    tabText: {
        fontSize: 13,
        letterSpacing: -0.1,
    },
    hotelCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    hotelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    hotelBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    hotelBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    hotelName: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -0.3,
    },
    hotelPrice: {
        fontSize: 16,
        fontWeight: '800',
    },
    hotelDesc: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 15,
    },
    hotelDivider: {
        height: 1,
        width: '100%',
        marginBottom: 15,
    },
    hotelMetaGrid: {
        flexDirection: 'column',
        gap: 8,
        marginBottom: 18,
    },
    hotelMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    hotelMetaText: {
        fontSize: 12,
        fontWeight: '500',
    },
    hotelActionBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        gap: 6,
    },
    hotelActionBtnText: {
        fontSize: 13,
        fontWeight: '700',
    },
    advisorHeader: {
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    advisorTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    advisorTitle: {
        letterSpacing: -0.3,
    },
    advisorSection: {
        marginBottom: 12,
    },
    advisorSub: {
        letterSpacing: -0.1,
    },
});