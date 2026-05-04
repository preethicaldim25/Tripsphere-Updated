import React, { useState } from 'react';
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
  FlatList,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/themecontext';
import { destinationsAPI, Destination } from '../services/api';
import ExploreMap from '../components/ExploreMap';

export default function RoadTripScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [routeStops, setRouteStops] = useState<Destination[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const handlePlanTrip = async () => {
    if (!startLocation || !endLocation) {
      Alert.alert('Error', 'Please enter start and end locations');
      return;
    }
    
    setLoading(true);
    try {
      // Corrected call to match API in api.ts
      const response = await (destinationsAPI as any).getRoutePlan(startLocation, endLocation);
      setRouteStops(response.stops || []);
      setHasSearched(true);
    } catch (error) {
      console.error('Error planning route:', error);
      Alert.alert('Route Failed', 'Could not plan route. Please try different locations.');
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(colors);

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Road Trip Planner',
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerRight: () => (
          hasSearched && (
            <TouchableOpacity 
              onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              style={{ marginRight: 15 }}
            >
              <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={24} color={colors.primary} />
            </TouchableOpacity>
          )
        ),
      }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Custom Route Planner */}
        <View style={[styles.plannerCard, { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Plan Your Route</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Ionicons name="location" size={18} color={colors.primary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Start"
                placeholderTextColor={colors.textLight}
                value={startLocation}
                onChangeText={setStartLocation}
              />
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.textLight} style={{ marginHorizontal: 8 }} />
            <View style={styles.inputContainer}>
              <Ionicons name="flag" size={18} color={colors.primary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="End"
                placeholderTextColor={colors.textLight}
                value={endLocation}
                onChangeText={setEndLocation}
              />
            </View>
          </View>
          <TouchableOpacity
            style={[styles.planButton, { backgroundColor: colors.primary }]}
            onPress={handlePlanTrip}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.planButtonText}>Find Route Stops</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {hasSearched ? (
          viewMode === 'map' ? (
            <ExploreMap 
              places={routeStops} 
              onPinSelect={(place: any) => router.push(`/destination/${place.name}`)}
              theme={theme}
            />
          ) : (
            <FlatList
              data={routeStops}
              keyExtractor={item => item.id || item._id || item.name}
              contentContainerStyle={styles.list}
              ListHeaderComponent={
                <Text style={[styles.listHeader, { color: colors.text }]}>
                  {routeStops.length} Stops found along the route
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.stopCard, { backgroundColor: colors.card }]}
                  onPress={() => router.push(`/destination/${item.name}`)}
                >
                  <Image source={{ uri: item.image }} style={styles.stopImage} />
                  <View style={styles.stopContent}>
                    <Text style={[styles.stopName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.stopDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <TouchableOpacity 
                      style={[styles.addBtn, { backgroundColor: colors.primary }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push({ pathname: '/plan-trip', params: { destination: item.name }} as any);
                      }}
                    >
                      <Text style={styles.addBtnText}>+ Add Stop to Trip</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
            />
          )
        ) : (
          <ScrollView>
            <View style={styles.introSection}>
              <Ionicons name="car-outline" size={80} color={colors.textLight} />
              <Text style={[styles.introTitle, { color: colors.text }]}>Start Your Journey</Text>
              <Text style={[styles.introDesc, { color: colors.textSecondary }]}>
                Enter your start and end points to discover attractions, eateries, and scenic spots along your route.
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1 },
  plannerCard: { padding: 20, marginBottom: 0 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8 },
  input: { flex: 1, fontSize: 14 },
  planButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  planButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  list: { padding: 16 },
  listHeader: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  stopCard: { flexDirection: 'row', borderRadius: 16, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  stopImage: { width: 100, height: 120 },
  stopContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  stopName: { fontSize: 16, fontWeight: 'bold' },
  stopDesc: { fontSize: 12, marginBottom: 8 },
  addBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' },
  addBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  introSection: { alignItems: 'center', padding: 40, marginTop: 40 },
  introTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  introDesc: { textAlign: 'center', fontSize: 16, lineHeight: 24 },
});