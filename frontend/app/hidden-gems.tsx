import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/themecontext';
import { destinationsAPI, Destination } from '../services/api';
import { getDestinationImage } from '../constants/images';
import ExploreMap from '../components/ExploreMap';

export default function HiddenGemsScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [gems, setGems] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    fetchGems();
  }, []);

  const fetchGems = async (search?: string) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { is_hidden_gem: 'true' };
      if (search) params.search = search;
      const response = await destinationsAPI.getAll(params);
      setGems(response.destinations || []);
    } catch (error) {
      console.error('Error fetching gems:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchGems(searchQuery);
  };

  const styles = getStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        headerTitle: 'Hidden Gems Explorer',
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerRight: () => (
          <TouchableOpacity 
            onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            style={{ marginRight: 15 }}
          >
            <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={24} color={colors.primary} />
          </TouchableOpacity>
        ),
      }} />

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textLight} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Enter a destination (e.g. Kodaikanal)"
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); fetchGems(); }}>
            <Ionicons name="close-circle" size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : viewMode === 'map' ? (
        <View style={{ flex: 1 }}>
          <ExploreMap 
            places={gems} 
            onPinSelect={(place: any) => router.push(`/destination/${place.name}`)}
            theme={theme}
          />
        </View>
      ) : (
        <FlatList
          data={gems}
          keyExtractor={item => item.id || item._id || item.name}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={60} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hidden gems found for "{searchQuery}"</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/destination/${item.name}`)}
            >
              <Image 
                source={{ uri: getDestinationImage(item.name) }} 
                style={styles.image} 
                resizeMode="cover"
              />
              <View style={styles.overlay}>
                <View style={styles.header}>
                  <Text style={styles.name}>{item.name}</Text>
                  <View style={styles.rating}>
                    <Ionicons name="star" size={14} color="#FBBF24" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                </View>
                <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
                <View style={styles.footer}>
                  <View style={styles.location}>
                    <Ionicons name="location-outline" size={14} color="#fff" />
                    <Text style={styles.locationText}>{item.district || item.location}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.addBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push({ pathname: '/plan-trip', params: { destination: item.name }} as any);
                    }}
                  >
                    <Text style={styles.addBtnText}>Add to Trip</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    height: 220,
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  addBtn: {
    backgroundColor: '#6B4EFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});