import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, TextInput, ActivityIndicator, Platform } from 'react-native';
import { SmartImage } from '../components/ui/SmartImage';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/themecontext';
import { destinationsAPI, Destination } from '../services/api';
import { getDestinationImage } from '../constants/images';
import ExploreMap from '../components/ExploreMap';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { AppHeader } from '../components/ui/AppHeader';

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
    <ScreenContainer padded={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader 
        title="Hidden Gems" 
        subtitle="Discover unexplored spots" 
        rightAction={
          <TouchableOpacity 
            onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            style={{ padding: 8, backgroundColor: 'rgba(107, 78, 255, 0.1)', borderRadius: 20 }}
          >
            <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={20} color={colors.primary} />
          </TouchableOpacity>
        }
      />

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
          ListHeaderComponent={
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
          }
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
              <SmartImage 
                gradientOnly={true}
                name={item.name}
                category={item.category || 'Nature'}
                style={styles.image} 
              />
              <View style={styles.overlay}>
                <View style={styles.cardHeader}>
                  <Text style={styles.name}>{item.name}</Text>
                  <View style={styles.ratingBox}>
                    <Ionicons name="star" size={12} color="#FBBF24" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                </View>
                <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
                <View style={styles.cardFooter}>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.locationText}>{item.district || item.location}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.exploreBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push(`/destination/${item.name}`);
                    }}
                  >
                    <Text style={styles.exploreBtnText}>Explorer →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenContainer>
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
    paddingBottom: 100, // Safe padding for bottom tabs
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 20,
    justifyContent: 'flex-end',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '800',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  exploreBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
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