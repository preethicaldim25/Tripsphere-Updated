import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/themecontext';
import { images, getDestinationImage } from '../constants/images';

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
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/destination/${encodeURIComponent(item.name)}`)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: getDestinationImage(item.name) }} 
        style={styles.image} 
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <View style={styles.cardHeader}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.rating, { backgroundColor: colors.lightPurple }]}>
            <Ionicons name="star" size={12} color="#FBBF24" />
            <Text style={[styles.ratingText, { color: colors.primary }]}>{item.rating}</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>{item.subtitle}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.tag}>
            <Ionicons name="pricetag-outline" size={12} color={colors.primary} />
            <Text style={[styles.tagText, { color: colors.textSecondary }]}>{item.category}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={colors.card} />
      <Stack.Screen options={{
        title: 'Popular Places',
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 15 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
      }} />

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

      {/* Destinations Grid */}
      <FlatList
        data={filteredDestinations}
        renderItem={renderDestinationCard}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={50} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No destinations found in this category.</Text>
          </View>
        }
      />
    </View>
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
  card: {
    width: cardWidth,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 130,
  },
  overlay: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
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