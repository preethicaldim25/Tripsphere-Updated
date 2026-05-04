import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/themecontext';
import { getDestinationImage } from '../constants/images';

const WEEKEND_TRIPS = [
  { id: '1', name: 'Yercaud', distance: '3 hrs', image: 'https://images.unsplash.com/photo-1624886510372-f7311d2c6e6e?q=80&w=1080&auto=format&fit=crop', rating: 4.3, type: 'Hill Station', price: '₹2,500', activities: ['Boating', 'Trekking', 'Coffee Plantations'] },
  { id: '2', name: 'Yelagiri', distance: '2.5 hrs', image: 'https://images.unsplash.com/photo-1516646255117-f9f933680173?q=80&w=1080&auto=format&fit=crop', rating: 4.2, type: 'Hill Station', price: '₹2,000', activities: ['Paragliding', 'Lake View', 'Nature Walk'] },
  { id: '3', name: 'Hogenakkal Falls', distance: '4 hrs', image: 'https://images.unsplash.com/photo-1592927946945-c98511f87bcc?q=80&w=1080&auto=format&fit=crop', rating: 4.5, type: 'Waterfall', price: '₹1,500', activities: ['Boat Ride', 'Coracle Ride', 'Picnic'] },
  { id: '4', name: 'Kolli Hills', distance: '5 hrs', image: 'https://images.unsplash.com/photo-1516646255117-f9f933680173?q=80&w=1080&auto=format&fit=crop', rating: 4.4, type: 'Hill Station', price: '₹2,200', activities: ['Waterfalls', 'View Points', 'Trekking'] },
  { id: '5', name: 'Valparai', distance: '6 hrs', image: 'https://images.unsplash.com/photo-1597135096739-1fd8641c5edb?q=80&w=1080&auto=format&fit=crop', rating: 4.6, type: 'Hill Station', price: '₹3,000', activities: ['Tea Estate', 'Wildlife', 'Scenic Drives'] },
];

import { destinationsAPI, Destination } from '../services/api';

export default function WeekendTripsScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [loading, setLoading] = useState(true);
  const [weekendTrips, setWeekendTrips] = useState<Destination[]>([]);

  useEffect(() => {
    fetchWeekendTrips();
  }, []);

  const fetchWeekendTrips = async () => {
    try {
      setLoading(true);
      const data = await destinationsAPI.getExploreData();
      if (data && data.weekendTrips) {
        setWeekendTrips(data.weekendTrips);
      }
    } catch (error) {
      console.error('Error fetching weekend trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const types = ['All', 'Hill Station', 'Waterfall', 'Coastal', 'Nature'];

  const filteredTrips = weekendTrips.filter(trip => {
    const matchesSearch = trip.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || trip.category === selectedType;
    return matchesSearch && matchesType;
  });

  // Handle destination press with safe navigation
  const handleDestinationPress = (destination: Destination) => {
    try {
      const targetId = destination.id || destination._id;
      console.log("📍 Navigating to destination ID:", targetId, "Name:", destination.name);
      
      router.push({
        pathname: `/destination/${targetId}`,
        params: { name: destination.name } // Pass name as fallback
      } as any);
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Could not open destination details');
    }
  };

  const styles = getStyles(colors);

  return (
    <>
      <Stack.Screen options={{
        title: 'Weekend Getaways',
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
      }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={colors.card} />
        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textLight} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search destinations..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Type Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterContainer}>
            {types.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  selectedType === type && [styles.activeChip, { backgroundColor: colors.primary }],
                  { borderColor: colors.border }
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[
                  styles.filterText,
                  selectedType === type && { color: '#fff' },
                  { color: colors.text }
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Results */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textSecondary }}>Finding perfect getaways...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTrips}
            keyExtractor={item => (item.id || item._id || item.name)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card }]}
                onPress={() => handleDestinationPress(item)}
                activeOpacity={0.8}
              >
                <Image 
                  source={{ uri: item.image || getDestinationImage(item.name) }} 
                  style={styles.cardImage} 
                  resizeMode="cover"
                />
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardName, { color: colors.text }]}>{item.name}</Text>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#FBBF24" />
                      <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{item.rating || '4.5'}</Text>
                    </View>
                  </View>
                  <View style={styles.tags}>
                    <View style={styles.tag}>
                      <Ionicons name="location-outline" size={12} color={colors.primary} />
                      <Text style={[styles.tagText, { color: colors.textSecondary }]}>{item.district || 'Tamil Nadu'}</Text>
                    </View>
                    <View style={styles.tag}>
                      <Ionicons name="cash-outline" size={12} color={colors.primary} />
                      <Text style={[styles.tagText, { color: colors.textSecondary }]}>₹{item.avg_cost_per_person || '2000'}</Text>
                    </View>
                  </View>
                  <Text style={[styles.typeText, { color: colors.primary }]}>{item.category}</Text>
                  <View style={styles.activities}>
                    <Text style={[styles.activitiesLabel, { color: colors.textSecondary }]}>Highlights:</Text>
                    <Text style={[styles.activitiesText, { color: colors.textLight }]} numberOfLines={1}>
                      {(item.speciality_tags || []).join(' • ') || 'Nature • Peace • Sightseeing'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 50 }}>
                <Ionicons name="search-outline" size={50} color={colors.textLight} />
                <Text style={{ color: colors.textSecondary, marginTop: 10 }}>No matching getaways found</Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    padding: 0,
  },
  filterScroll: {
    maxHeight: 50,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  activeChip: {
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
  },
  tags: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagText: {
    fontSize: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  activities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  activitiesLabel: {
    fontSize: 11,
  },
  activitiesText: {
    fontSize: 11,
    flex: 1,
  },
});