import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Mock data for categories
const CATEGORY_DATA: Record<string, any> = {
  'Hill Stations': {
    name: 'Hill Stations',
    icon: '🏔️',
    description: 'Escape to the cool, misty hills of Tamil Nadu',
    destinations: [
      {
        id: '1',
        name: 'Ooty',
        subtitle: 'Queen of Hill Stations',
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=1080&auto=format&fit=crop',
        location: 'Nilgiris',
        bestTime: 'Oct-Jun',
        altitude: '2,240 m',
      },
      {
        id: '2',
        name: 'Kodaikanal',
        subtitle: 'Princess of Hills',
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1080&auto=format&fit=crop',
        location: 'Dindigul',
        bestTime: 'Oct-Mar',
        altitude: '2,133 m',
      },
      {
        id: '3',
        name: 'Yercaud',
        subtitle: 'Jewel of the South',
        rating: 4.4,
        image: 'https://images.unsplash.com/photo-1624886510372-f7311d2c6e6e?q=80&w=1080&auto=format&fit=crop',
        location: 'Salem',
        bestTime: 'Oct-Jun',
        altitude: '1,515 m',
      },
      {
        id: '4',
        name: 'Coonoor',
        subtitle: 'Tea Garden Paradise',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1589782185678-1e7b6b4a7e8b?q=80&w=1080&auto=format&fit=crop',
        location: 'Nilgiris',
        bestTime: 'Oct-Jun',
        altitude: '1,850 m',
      },
      {
        id: '5',
        name: 'Valparai',
        subtitle: 'Hidden Gem',
        rating: 4.3,
        image: 'https://images.unsplash.com/photo-1597135096739-1fd8641c5edb?q=80&w=1080&auto=format&fit=crop',
        location: 'Coimbatore',
        bestTime: 'Oct-Mar',
        altitude: '1,193 m',
      },
    ],
  },
  'Temple Trails': {
    name: 'Temple Trails',
    icon: '🛕',
    description: 'Explore the magnificent temples and spiritual heritage',
    destinations: [
      {
        id: '1',
        name: 'Madurai',
        subtitle: 'Meenakshi Amman Temple',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1080&auto=format&fit=crop',
        location: 'Madurai',
        bestTime: 'Oct-Mar',
        built: '17th Century',
      },
      {
        id: '2',
        name: 'Rameswaram',
        subtitle: 'Ramanathaswamy Temple',
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1587135941948-670b381f08ce?q=80&w=1080&auto=format&fit=crop',
        location: 'Ramanathapuram',
        bestTime: 'Oct-Mar',
        built: '12th Century',
      },
      {
        id: '3',
        name: 'Kanchipuram',
        subtitle: 'City of Thousand Temples',
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1600100996106-3d6a6a7c5b9a?w=400',
        location: 'Kanchipuram',
        bestTime: 'Nov-Feb',
        built: 'Pallava Era',
      },
      {
        id: '4',
        name: 'Thanjavur',
        subtitle: 'Brihadeeswarar Temple',
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1624886510372-f7311d2c6e6e?w=400',
        location: 'Thanjavur',
        bestTime: 'Oct-Mar',
        built: '1010 AD',
      },
    ],
  },
  'Beaches': {
    name: 'Beaches',
    icon: '🏖️',
    description: 'Relax on the pristine coastal shores',
    destinations: [
      {
        id: '1',
        name: 'Mahabalipuram',
        subtitle: 'Shore Temple Beach',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1590074211438-6623668383e7?q=80&w=1080&auto=format&fit=crop',
        location: 'Chengalpattu',
        bestTime: 'Nov-Feb',
        waterTemp: '27°C',
      },
      {
        id: '2',
        name: 'Kanyakumari',
        subtitle: 'Sunset Point',
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1598977123118-4e30ba3c77f5?w=400',
        location: 'Kanyakumari',
        bestTime: 'Oct-Mar',
        waterTemp: '26°C',
      },
      {
        id: '3',
        name: 'Marina Beach',
        subtitle: 'Urban Beach',
        rating: 4.3,
        image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1080&auto=format&fit=crop',
        location: 'Chennai',
        bestTime: 'Nov-Feb',
        waterTemp: '28°C',
      },
    ],
  },
  'Waterfalls': {
    name: 'Waterfalls',
    icon: '💧',
    description: 'Witness the majestic waterfalls',
    destinations: [
      {
        id: '1',
        name: 'Hogenakkal',
        subtitle: 'Diamond of the South',
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1592927946945-c98511f87bcc?w=400',
        location: 'Dharmapuri',
        bestTime: 'Jul-Mar',
        height: '20 m',
      },
      {
        id: '2',
        name: 'Courtallam',
        subtitle: 'Spa of South India',
        rating: 4.4,
        image: 'https://images.unsplash.com/photo-1592927946945-c98511f87bcc?w=400',
        location: 'Tenkasi',
        bestTime: 'Jun-Sep',
        height: '30 m',
      },
    ],
  },
  'Heritage Sites': {
    name: 'Heritage Sites',
    icon: '🏛️',
    description: 'Discover UNESCO World Heritage sites',
    destinations: [
      {
        id: '1',
        name: 'Mahabalipuram',
        subtitle: 'Group of Monuments',
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1590074211438-6623668383e7?q=80&w=1080&auto=format&fit=crop',
        location: 'Chengalpattu',
        bestTime: 'Nov-Feb',
        era: '7th-8th Century',
      },
      {
        id: '2',
        name: 'Thanjavur',
        subtitle: 'Brihadeeswarar Temple',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1624886510372-f7311d2c6e6e?w=400',
        location: 'Thanjavur',
        bestTime: 'Oct-Mar',
        era: 'Chola Dynasty',
      },
    ],
  },
};

export default function CategoryScreen() {
  const { name } = useLocalSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'rating', 'name'

  const categoryName = typeof name === 'string' ? name : String(name);
  const category = CATEGORY_DATA[categoryName];

  if (!category) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="sad-outline" size={60} color="#999" />
        <Text style={styles.errorTitle}>Category Not Found</Text>
        <Text style={styles.errorText}>We couldn't find "{categoryName}"</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Filter and sort destinations
  const filteredDestinations = category.destinations
    .filter((dest: any) =>
      dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: any, b: any) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      return a.name.localeCompare(b.name);
    });

  const renderDestination = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.destinationCard}
      onPress={() => router.push(`/destination/${item.name}`)}
    >
      <Image source={{ uri: item.image }} style={styles.destinationImage} />
      <View style={styles.destinationOverlay}>
        <View style={styles.destinationHeader}>
          <Text style={styles.destinationName}>{item.name}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FBBF24" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        <Text style={styles.destinationSubtitle}>{item.subtitle}</Text>
        <View style={styles.destinationFooter}>
          <View style={styles.destinationInfo}>
            <Ionicons name="location" size={12} color="#fff" />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
          <View style={styles.destinationInfo}>
            <Ionicons name="calendar" size={12} color="#fff" />
            <Text style={styles.infoText}>{item.bestTime}</Text>
          </View>
        </View>
        {item.altitude && (
          <View style={styles.destinationTag}>
            <Ionicons name="arrow-up" size={10} color="#fff" />
            <Text style={styles.tagText}>{item.altitude}</Text>
          </View>
        )}
        {item.built && (
          <View style={styles.destinationTag}>
            <Ionicons name="time" size={10} color="#fff" />
            <Text style={styles.tagText}>{item.built}</Text>
          </View>
        )}
        {item.waterTemp && (
          <View style={styles.destinationTag}>
            <Ionicons name="thermometer" size={10} color="#fff" />
            <Text style={styles.tagText}>{item.waterTemp}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{
        headerShown: true,
        title: category.name,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        ),
      }} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categoryDescription}>{category.description}</Text>
          </View>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search in ${category.name}`}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Sort by:</Text>
            <TouchableOpacity
              style={[styles.filterChip, sortBy === 'name' && styles.activeFilter]}
              onPress={() => setSortBy('name')}
            >
              <Text style={[styles.filterChipText, sortBy === 'name' && styles.activeFilterText]}>Name</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, sortBy === 'rating' && styles.activeFilter]}
              onPress={() => setSortBy('rating')}
            >
              <Text style={[styles.filterChipText, sortBy === 'rating' && styles.activeFilterText]}>Rating</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results count */}
        <Text style={styles.resultsCount}>
          {filteredDestinations.length} {filteredDestinations.length === 1 ? 'place' : 'places'} found
        </Text>

        {/* Destinations List */}
        <FlatList
          data={filteredDestinations}
          renderItem={renderDestination}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No destinations found</Text>
              <Text style={styles.emptySubText}>Try adjusting your search</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F6FF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F6FF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F6FF',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#6B4EFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#6B4EFF',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  searchSection: {
    padding: 20,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeFilter: {
    backgroundColor: '#6B4EFF',
    borderColor: '#6B4EFF',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  destinationCard: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  destinationImage: {
    width: '100%',
    height: '100%',
  },
  destinationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  destinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 3,
  },
  destinationSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  destinationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  destinationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 10,
    color: '#fff',
    marginLeft: 3,
    opacity: 0.9,
  },
  destinationTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 78, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    color: '#fff',
    marginLeft: 3,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
});