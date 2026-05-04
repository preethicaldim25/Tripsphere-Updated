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
  Share,
  ActivityIndicator,
  Dimensions,
  Platform,
  FlatList,
} from 'react-native';
import { getDestinationImage } from '../../constants/images';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/themecontext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { destinationsAPI, Destination } from '../../services/api';
import AddToTripModal from '../../components/AddToTripModal';
import ExploreMap from '../../components/ExploreMap';

const { width } = Dimensions.get('window');

export default function DestinationDetailsScreen() {
  const { id, name: nameParam } = useLocalSearchParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { colors, theme } = useTheme();
  
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const destinationId = typeof id === 'string' ? id : String(id);
  const destinationName = typeof nameParam === 'string' ? nameParam : String(nameParam);
  
  const [destination, setDestination] = useState<Destination | null>(null);
  const [fetching, setFetching] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    console.log("📍 destinationId:", destinationId);
    console.log("📍 destinationName:", destinationName);

    if ((!destinationId || destinationId === "undefined" || destinationId === "[id]") && (!destinationName || destinationName === "undefined")) {
      console.error("❌ Invalid destinationId and destinationName");
      setFetching(false);
      return;
    }

    fetchDestinationDetails();
  }, [destinationId, destinationName]);

  const fetchDestinationDetails = async () => {
    try {
      setFetching(true);
      let targetId = destinationId;

      // 4. FALLBACK NAME MATCH (IMPORTANT)
      // If destinationId is missing or looks like a name, try to find the real ID
      if (!targetId || targetId === "undefined" || targetId === "[id]" || targetId.length < 10) {
        console.log("🔍 ID missing or invalid, attempting name-based fallback for:", destinationName);
        try {
          const allResponse = await destinationsAPI.getAll();
          const destinations = allResponse.destinations || [];
          const match = destinations.find(
            d => d.name.toLowerCase() === (destinationName || destinationId).toLowerCase()
          );
          if (match) {
            console.log("✅ Found match by name:", match.name, "ID:", match.id || match._id);
            targetId = (match.id || match._id) as string;
          }
        } catch (err) {
          console.error("Error during fallback name match:", err);
        }
      }

      if (!targetId || targetId === "undefined" || targetId === "[id]") {
        // Last resort: try using the name itself if it's all we have
        targetId = destinationName || destinationId;
      }

      console.log("📡 Fetching destination details for:", targetId);
      const data = await destinationsAPI.getPlace(targetId);
      if (data) {
        setDestination({
            ...data,
            id: data.id || data._id,
            highlights: data.highlights || [],
            nearby: data.nearby || [],
            weather: data.weather || {
                summer: '25-35°C', winter: '20-30°C', monsoon: '22-32°C', current: '28°C', condition: 'Sunny'
            },
            cuisine: data.cuisine || [],
            tips: data.tips || []
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
    if (!isAuthenticated) return;
    if (!destination) return;
    setLoadingSave(true);
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
    } finally {
      setLoadingSave(false);
    }
  };

  const handleAddToDraft = async () => {
    if (!destination) return;
    try {
      const existing = await AsyncStorage.getItem('draft_trip_places');
      let places = existing ? JSON.parse(existing) : [];
      if (!places.find((p: any) => p.name === destination.name)) {
        places.push({ id: destination.id || destination._id, name: destination.name, district: destination.district || destination.location, image: destination.image, type: destination.category, rating: destination.rating });
        await AsyncStorage.setItem('draft_trip_places', JSON.stringify(places));
      }
      
      if (Platform.OS === 'web') {
          window.alert(`${destination.name} has been added to your draft trip!`);
          router.push('/your-trip');
      } else {
          Alert.alert(
              "Added to Trip \u2705",
              `${destination.name} has been added to your draft trip.`,
              [
                  { text: "Continue Exploring", style: "cancel" },
                  { text: "Plan My Trip", onPress: () => router.push('/your-trip') }
              ]
          );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const styles = getStyles(colors);

  if (fetching) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 15, color: colors.textSecondary }}>Opening hidden gem...</Text>
      </View>
    );
  }

  if (!destination) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="sad-outline" size={60} color="#ccc" />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Destination Not Found</Text>
        <Text style={{ color: colors.textSecondary }}>We couldn't find details for "{destinationName || destinationId}"</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero Section */}
        <View style={styles.imageContainer}>
          {destination && destination.carousel_images && destination.carousel_images.length > 0 ? (
            <View style={{ flex: 1 }}>
              <FlatList
                data={destination.carousel_images}
                renderItem={({ item, index }: { item: string, index: number }) => (
                  <Image 
                    source={{ uri: index === 0 ? getDestinationImage(destination!.name) : item }} 
                    style={styles.image} 
                    resizeMode="cover"
                  />
                )}
                keyExtractor={(item, index) => index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / width);
                  setActiveImageIndex(index);
                }}
              />
              <View style={styles.pagination}>
                {(destination!.carousel_images ?? []).map((_: any, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      { backgroundColor: activeImageIndex === index ? '#fff' : 'rgba(255,255,255,0.4)' }
                    ]}
                  />
                ))}
              </View>
            </View>
          ) : (
            <Image source={{ uri: getDestinationImage(destination.name) }} style={styles.image} resizeMode="cover" />
          )}
          <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.85)']} style={styles.imageGradient} />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={24} color={saved ? '#FF4B4B' : '#fff'} />
          </TouchableOpacity>
          <View style={styles.imageOverlay}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{destination.category}</Text>
            </View>
            <Text style={styles.imageName}>{destination.name}</Text>
            <View style={styles.specialityContainer}>
              {destination.speciality_tags?.map((tag, index) => (
                <View key={index} style={styles.specialityTag}>
                  <Text style={styles.specialityTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.content}>
           {/* Quick Stats Row */}
           <View style={styles.quickStats}>
                <View style={styles.stat}>
                    <Ionicons name="star" size={16} color="#FBBF24" />
                    <Text style={[styles.statValue, { color: colors.text }]}>{destination.rating}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rating</Text>
                </View>
                <View style={styles.stat}>
                    <Ionicons name="wallet" size={16} color="#6B4EFF" />
                    <Text style={[styles.statValue, { color: colors.text }]}>₹{destination.estimated_budget}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Budget</Text>
                </View>
                <View style={styles.stat}>
                    <Ionicons name="time" size={16} color="#6B4EFF" />
                    <Text style={[styles.statValue, { color: colors.text }]}>{destination.timeRequired || '2 Days'}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Duration</Text>
                </View>
           </View>

           {/* AI Recommendations Section */}
           {destination.ai_recommendations && (
             <View style={[styles.aiSection, { backgroundColor: theme === 'dark' ? '#1E1E1E' : '#F5F3FF' }]}>
               <View style={styles.aiHeader}>
                 <Ionicons name="sparkles" size={20} color="#6B4EFF" />
                 <Text style={[styles.aiTitle, { color: '#6B4EFF' }]}>AI Insights</Text>
               </View>
               <View style={styles.aiContent}>
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
             </View>
           )}

           {/* Description */}
           <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
           <Text style={[styles.description, { color: colors.textSecondary }]}>
             {destination.longDescription || destination.description}
           </Text>

           {/* Key Attractions Map */}
           <View style={styles.section}>
             <View style={styles.sectionHeader}>
               <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Attractions</Text>
               <TouchableOpacity onPress={() => router.push('/map')}>
                 <Text style={{ color: colors.primary, fontWeight: 'bold' }}>View Full Map</Text>
               </TouchableOpacity>
             </View>
             
             {destination.attractions && destination.attractions.length > 0 && (
               <View style={styles.miniMapContainer}>
                 <ExploreMap 
                   places={destination.attractions.map(a => ({
                     ...a,
                     coordinates: { lat: a.lat, lng: a.lng },
                     id: a.name
                   }))}
                   center={[destination.coordinates?.lat || 11, destination.coordinates?.lng || 78]}
                   zoom={12}
                   theme={theme}
                 />
               </View>
             )}

             <View style={styles.verticalList}>
               {destination.attractions?.map((attr, index) => (
                 <View key={index} style={[styles.attrCard, { backgroundColor: colors.card }]}>
                   {attr.image ? (
                     <Image source={{ uri: attr.image }} style={styles.attrImage} />
                   ) : (
                     <View style={styles.attrIconBg}>
                       <Ionicons 
                          name={attr.type === 'Temple' ? 'home' : attr.type === 'Waterfall' ? 'water' : 'camera'} 
                          size={20} 
                          color="#6B4EFF" 
                        />
                     </View>
                   )}
                   <View style={styles.attrContent}>
                     <Text style={[styles.attrName, { color: colors.text }]} numberOfLines={1}>{attr.name}</Text>
                     <Text style={[styles.attrType, { color: colors.textSecondary }]}>{attr.type}</Text>
                   </View>
                 </View>
               ))}
             </View>
           </View>

           {/* Food Recommendations */}
           <View style={styles.section}>
             <Text style={[styles.sectionTitle, { color: colors.text }]}>Where to Eat</Text>
             {destination.food?.map((item, index) => (
               <View key={index} style={[styles.foodCard, { backgroundColor: colors.card }]}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                   {item.image && (
                     <Image source={{ uri: item.image }} style={styles.foodImage} />
                   )}
                   <View style={{ marginLeft: item.image ? 12 : 0, flex: 1 }}>
                     <Text style={[styles.foodName, { color: colors.text }]}>{item.name}</Text>
                     <Text style={[styles.foodCuisine, { color: colors.textSecondary }]}>{item.cuisine}</Text>
                   </View>
                 </View>
                 <View style={styles.foodRating}>
                   <Ionicons name="star" size={14} color="#FBBF24" />
                   <Text style={[styles.foodRatingText, { color: colors.text }]}>{item.rating}</Text>
                 </View>
               </View>
             ))}
           </View>

           {/* Hotel Booking Integration */}
           <View style={styles.section}>
             <Text style={[styles.sectionTitle, { color: colors.text }]}>Stay & Accommodation</Text>
             <TouchableOpacity 
                style={[styles.bookingCard, { backgroundColor: '#6B4EFF' }]}
                onPress={() => Linking.openURL(`https://www.booking.com/searchresults.html?ss=${destination.name}`)}
             >
               <View>
                 <Text style={styles.bookingTitle}>Find the best stays</Text>
                 <Text style={styles.bookingSubtitle}>Check availability on Booking.com</Text>
               </View>
               <Ionicons name="chevron-forward" size={24} color="#fff" />
             </TouchableOpacity>
           </View>

           {/* Nearby Places */}
           <View style={styles.section}>
             <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby Places</Text>
             <View style={styles.nearbyList}>
               {destination.nearby_places?.map((place, index) => (
                 <View key={index} style={styles.nearbyItem}>
                   <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                   <Text style={[styles.nearbyName, { color: colors.text }]}>{place.name}</Text>
                   <Text style={[styles.nearbyDist, { color: colors.textSecondary }]}>{place.distance}</Text>
                 </View>
               ))}
             </View>
           </View>

           <View style={styles.actionRow}>
                <TouchableOpacity 
                    style={[styles.planBtn, { backgroundColor: '#6B4EFF', flex: 1 }]}
                    onPress={() => router.push({ pathname: '/plan-trip', params: { destination: destination.name }} as any)}
                >
                    <Text style={styles.planBtnText}>✨ Generate AI Itinerary</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.planBtn, { backgroundColor: colors.card, borderWidth: 2, borderColor: '#6B4EFF', flex: 1, marginLeft: 10 }]}
                    onPress={handleAddToDraft}
                >
                    <Text style={[styles.planBtnText, { color: '#6B4EFF' }]}>+ Add to Trip</Text>
                </TouchableOpacity>
           </View>

           <AddToTripModal 
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                destination={destination}
           />
           <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  errorTitle: { fontSize: 24, fontWeight: 'bold', marginVertical: 10 },
  errorButton: { backgroundColor: '#6B4EFF', minHeight: 44, paddingHorizontal: 30, justifyContent: 'center', alignItems: 'center', borderRadius: 15, marginTop: 20 },
  imageContainer: { height: Math.min(Math.round(width * 0.65), 320), width: '100%' },
  image: { width: '100%', height: '100%' },
  imageGradient: { ...StyleSheet.absoluteFillObject },
  backButton: { position: 'absolute', top: 50, left: 20, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 15 },
  saveButton: { position: 'absolute', top: 50, right: 20, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 15 },
  pagination: { flexDirection: 'row', position: 'absolute', bottom: 45, width: '100%', justifyContent: 'center', gap: 6, zIndex: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  imageOverlay: { position: 'absolute', bottom: 40, left: 20, right: 20 },
  imageName: { color: '#fff', fontSize: Platform.OS === 'web' ? 36 : 26, fontWeight: '900', letterSpacing: -0.5 },
  categoryBadge: { backgroundColor: 'rgba(107,78,255,0.8)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12 },
  categoryBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  specialityContainer: { flexDirection: 'row', gap: 8, marginTop: 12 },
  specialityTag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  specialityTagText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  content: { padding: 18, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, backgroundColor: colors.background },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  description: { fontSize: 16, lineHeight: 26, marginBottom: 10 },
  quickStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, backgroundColor: 'rgba(107,78,255,0.05)', padding: 20, borderRadius: 24 },
  stat: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  statLabel: { fontSize: 11, fontWeight: '500' },
  aiSection: { padding: 20, borderRadius: 24, marginBottom: 32 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  aiTitle: { fontSize: 18, fontWeight: '800' },
  aiContent: { gap: 12 },
  aiRow: { flexDirection: 'row', gap: 8 },
  aiLabel: { fontWeight: '700', fontSize: 14, width: 90 },
  aiValue: { flex: 1, fontSize: 14, lineHeight: 20 },
  horizontalScroll: { marginHorizontal: -25, paddingHorizontal: 25 },
  verticalList: { marginTop: 10 },
  miniMapContainer: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  attrCard: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 12, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, overflow: 'hidden' },
  attrImage: { width: 60, height: 60, borderRadius: 12, marginRight: 12 },
  attrIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(107,78,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  attrContent: { flex: 1 },
  attrName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  attrType: { fontSize: 13 },
  foodCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 20, marginBottom: 12 },
  foodImage: { width: 50, height: 50, borderRadius: 12 },
  foodName: { fontSize: 16, fontWeight: '700' },
  foodCuisine: { fontSize: 13 },
  foodRating: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251,191,36,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  foodRatingText: { fontSize: 12, fontWeight: 'bold' },
  bookingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 24 },
  bookingTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  bookingSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  nearbyList: { gap: 12 },
  nearbyItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nearbyName: { flex: 1, fontSize: 15, fontWeight: '500' },
  nearbyDist: { fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  planBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  planBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});