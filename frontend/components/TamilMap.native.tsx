import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Image, 
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/themecontext';
import { destinationsAPI, Destination } from '../services/api';

const { width } = Dimensions.get('window');

const TamilMap = () => {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [places, setPlaces] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Destination | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Temples', 'Hills', 'Beaches', 'Nature', 'Cities'];

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const data = await destinationsAPI.getAll({ limit: 100 });
      setPlaces(data.destinations);
    } catch (error) {
      console.error('Error fetching map places:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlaces = selectedCategory === 'All' 
    ? places 
    : places.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#6B4EFF" />
        <Text style={{ color: colors.text, marginTop: 10 }}>Loading Tamil Nadu Map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 11.1271,
          longitude: 78.6569,
          latitudeDelta: 5.0,
          longitudeDelta: 5.0,
        }}
        customMapStyle={theme === 'dark' ? darkMapStyle : []}
      >
        {filteredPlaces.map((place: any) => (
          <Marker
            key={place.id || place._id}
            coordinate={{
              latitude: place.latitude || place.location?.lat || 11.0,
              longitude: place.longitude || place.location?.lng || 78.0,
            }}
            title={place.name}
            description={place.category}
            onPress={() => setSelectedPlace(place)}
          >
            <View style={[styles.markerContainer, { backgroundColor: '#6B4EFF' }]}>
                <Ionicons 
                    name={
                        (place.category?.toLowerCase().includes('temple') ? 'business' :
                        place.category?.toLowerCase().includes('hill') ? 'mountain' :
                        place.category?.toLowerCase().includes('beach') ? 'water' : 'location') as any
                    } 
                    size={16} 
                    color="#fff" 
                />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.headerOverlay}>
        <TouchableOpacity style={styles.backFab} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
           {categories.map(cat => (
             <TouchableOpacity 
               key={cat} 
               style={[styles.filterChip, selectedCategory === cat && styles.activeFilterChip]}
               onPress={() => setSelectedCategory(cat)}
             >
               <Text style={[styles.filterText, selectedCategory === cat && styles.activeFilterText]}>{cat}</Text>
             </TouchableOpacity>
           ))}
        </ScrollView>
      </View>

      {selectedPlace && (
        <View style={styles.detailCardContainer}>
           <TouchableOpacity 
             style={[styles.detailCard, { backgroundColor: colors.card }]}
             onPress={() => router.push(`/destination/${selectedPlace.id || selectedPlace._id}` as any)}
             activeOpacity={0.9}
           >
             <Image source={{ uri: selectedPlace.image || 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220' }} style={styles.detailImage} />
             <View style={styles.detailInfo}>
               <View style={styles.detailHeader}>
                 <Text style={[styles.detailName, { color: colors.text }]}>{selectedPlace.name}</Text>
                 <TouchableOpacity onPress={() => setSelectedPlace(null)}>
                   <Ionicons name="close-circle" size={24} color={colors.textLight} />
                 </TouchableOpacity>
               </View>
               <Text style={[styles.detailCategory, { color: colors.textSecondary }]}>{selectedPlace.category}</Text>
               <View style={styles.detailFooter}>
                 <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#FBBF24" />
                    <Text style={[styles.ratingText, { color: colors.text }]}>{selectedPlace.rating || '4.5'}</Text>
                 </View>
                 <Text style={styles.exploreBtnText}>Explorer →</Text>
               </View>
             </View>
           </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { ...StyleSheet.absoluteFillObject },
  markerContainer: { padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  headerOverlay: { position: 'absolute', top: 50, left: 0, right: 0, paddingHorizontal: 20 },
  backFab: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  filterScroll: { flexDirection: 'row' },
  filterChip: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  activeFilterChip: { backgroundColor: '#6B4EFF' },
  filterText: { color: '#333', fontWeight: '600' },
  activeFilterText: { color: '#fff' },
  detailCardContainer: { position: 'absolute', bottom: 40, left: 20, right: 20 },
  detailCard: { flexDirection: 'row', borderRadius: 20, padding: 12 },
  detailImage: { width: 100, height: 100, borderRadius: 12 },
  detailInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailName: { fontSize: 18, fontWeight: 'bold' },
  detailCategory: { fontSize: 14, marginTop: 2 },
  detailFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '600' },
  exploreBtnText: { color: '#6B4EFF', fontSize: 12, fontWeight: 'bold' }
});

export default TamilMap;
