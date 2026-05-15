import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/themecontext';
import { images } from '../constants/images';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { AppHeader } from '../components/ui/AppHeader';
import { GradientCard } from '../components/ui/GradientCard';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

// Popular destinations data
const POPULAR_DESTINATIONS = [
  { id: '1', name: 'Chennai', subtitle: 'Capital City', rating: 4.8, image: images.destinations.chennai, category: 'City', places: 45 },
  { id: '2', name: 'Coimbatore', subtitle: 'Manchester of South India', rating: 4.6, image: images.destinations.coimbatore, category: 'City', places: 38 },
  { id: '3', name: 'Trichy', subtitle: 'Rock Fort City', rating: 4.5, image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800', category: 'City', places: 32 },
  { id: '4', name: 'Madurai', subtitle: 'Temple City', rating: 4.9, image: images.destinations.madurai, category: 'Temple', places: 52 },
  { id: '5', name: 'Ooty', subtitle: 'Queen of Hill Stations', rating: 4.7, image: images.destinations.ooty, category: 'Hill Station', places: 28 },
  { id: '6', name: 'Kodaikanal', subtitle: 'Princess of Hills', rating: 4.6, image: images.destinations.kodaikanal, category: 'Hill Station', places: 25 },
  { id: '7', name: 'Mahabalipuram', subtitle: 'Ancient Temples', rating: 4.5, image: images.destinations.mahabalipuram, category: 'Heritage', places: 18 },
  { id: '8', name: 'Kanyakumari', subtitle: 'Land\'s End', rating: 4.6, image: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800', category: 'Beach', places: 22 },
];

export default function PopularScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filters = ['All', 'City', 'Temple', 'Hill Station', 'Heritage', 'Beach'];

  const filteredDestinations = selectedFilter === 'All' 
    ? POPULAR_DESTINATIONS 
    : POPULAR_DESTINATIONS.filter(d => d.category === selectedFilter);

  const renderDestinationCard = ({ item }: { item: typeof POPULAR_DESTINATIONS[0] }) => (
    <GradientCard
      name={item.name}
      subtitle={item.subtitle}
      category={item.category}
      rating={item.rating}
      width={cardWidth}
      onPress={() => router.push(`/destination/${encodeURIComponent(item.name)}`)}
    />
  );

  return (
    <ScreenContainer padded={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title="Popular Cities" subtitle="Explore Tamil Nadu’s top destinations" />

      <FlatList
        data={filteredDestinations}
        renderItem={renderDestinationCard}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Header Stats */}
            <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>{POPULAR_DESTINATIONS.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textLight }]}>Destinations</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {Math.max(...POPULAR_DESTINATIONS.map(d => d.rating))}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textLight }]}>Top Rated</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {POPULAR_DESTINATIONS.filter(d => d.rating >= 4.7).length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textLight }]}>Featured</Text>
              </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {filters.map((filter) => (
                  <TouchableOpacity 
                    key={filter} 
                    style={[
                      styles.filterChip, 
                      { backgroundColor: colors.card, borderColor: colors.border },
                      selectedFilter === filter && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    <Text style={[
                      styles.filterText, 
                      { color: colors.textSecondary },
                      selectedFilter === filter && { color: '#FFF' }
                    ]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={50} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No destinations found in this category.</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    margin: 16,
    borderRadius: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  filterWrapper: {
    marginBottom: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
  },
});