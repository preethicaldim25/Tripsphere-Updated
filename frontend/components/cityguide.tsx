import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface CityGuideProps {
  city: any;
  onClose: () => void;
  colors: any;
}

export default function CityGuide({ city, onClose, colors }: CityGuideProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const openGoogleMaps = (lat: number, lng: number) => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  };

  const callPlace = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color="#FBBF24"
        />
      );
    }
    return stars;
  };

  const styles = getStyles(colors);

  return (
    <View style={styles.modalContainer}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: city.image }} style={styles.headerImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageGradient}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.cityName}>{city.name}</Text>
            <Text style={styles.cityTagline}>{city.tagline}</Text>
            <View style={styles.cityStats}>
              <View style={styles.statBadge}>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text style={styles.statBadgeText}>{city.rating}</Text>
              </View>
              <View style={styles.statBadge}>
                <Ionicons name="location" size={14} color="#fff" />
                <Text style={styles.statBadgeText}>{city.distance}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
          {['overview', 'stay', 'eat', 'do', 'tips'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'overview' && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About {city.name}</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {city.description}
              </Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Best Time to Visit</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {city.bestTime}
              </Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>How to Reach</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {city.howToReach}
              </Text>
            </View>
          )}

          {activeTab === 'stay' && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Where to Stay</Text>
              {city.accommodation?.map((item: any, idx: number) => (
                <View key={idx} style={[styles.card, { backgroundColor: colors.card }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                    <View style={styles.priceBadge}>
                      <Text style={[styles.priceText, { color: colors.primary }]}>{item.price}</Text>
                    </View>
                  </View>
                  <Text style={[styles.cardAddress, { color: colors.textSecondary }]}>{item.address}</Text>
                  <View style={styles.cardRating}>
                    {renderStars(item.rating)}
                    <Text style={[styles.cardRatingText, { color: colors.textSecondary }]}>
                      {item.rating} ({item.reviews} reviews)
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.bookButton, { borderColor: colors.primary }]}
                    onPress={() => openGoogleMaps(item.lat, item.lng)}
                  >
                    <Text style={[styles.bookButtonText, { color: colors.primary }]}>View on Map</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'eat' && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Where to Eat</Text>
              
              {/* Veg Section */}
              <Text style={[styles.subSectionTitle, { color: colors.primary }]}>🥗 Vegetarian</Text>
              {city.food?.veg?.map((item: any, idx: number) => (
                <View key={idx} style={[styles.card, { backgroundColor: colors.card }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                    <View style={styles.cuisineBadge}>
                      <Text style={[styles.cuisineText, { color: colors.primary }]}>{item.cuisine}</Text>
                    </View>
                  </View>
                  <Text style={[styles.cardAddress, { color: colors.textSecondary }]}>{item.address}</Text>
                  <View style={styles.cardRating}>
                    {renderStars(item.rating)}
                    <Text style={[styles.cardRatingText, { color: colors.textSecondary }]}>
                      {item.rating} ({item.reviews} reviews)
                    </Text>
                  </View>
                  <Text style={[styles.mustTry, { color: colors.primary }]}>Must Try: {item.mustTry}</Text>
                  <TouchableOpacity
                    style={[styles.bookButton, { borderColor: colors.primary }]}
                    onPress={() => openGoogleMaps(item.lat, item.lng)}
                  >
                    <Text style={[styles.bookButtonText, { color: colors.primary }]}>Get Directions</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Non-Veg Section */}
              <Text style={[styles.subSectionTitle, { color: colors.primary }]}>🍗 Non-Vegetarian</Text>
              {city.food?.nonVeg?.map((item: any, idx: number) => (
                <View key={idx} style={[styles.card, { backgroundColor: colors.card }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                    <View style={styles.cuisineBadge}>
                      <Text style={[styles.cuisineText, { color: colors.primary }]}>{item.cuisine}</Text>
                    </View>
                  </View>
                  <Text style={[styles.cardAddress, { color: colors.textSecondary }]}>{item.address}</Text>
                  <View style={styles.cardRating}>
                    {renderStars(item.rating)}
                    <Text style={[styles.cardRatingText, { color: colors.textSecondary }]}>
                      {item.rating} ({item.reviews} reviews)
                    </Text>
                  </View>
                  <Text style={[styles.mustTry, { color: colors.primary }]}>Must Try: {item.mustTry}</Text>
                  <TouchableOpacity
                    style={[styles.bookButton, { borderColor: colors.primary }]}
                    onPress={() => openGoogleMaps(item.lat, item.lng)}
                  >
                    <Text style={[styles.bookButtonText, { color: colors.primary }]}>Get Directions</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'do' && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Attractions</Text>
              {city.attractions?.map((item: any, idx: number) => (
                <View key={idx} style={[styles.attractionCard, { backgroundColor: colors.card }]}>
                  <Image source={{ uri: item.image }} style={styles.attractionImage} />
                  <View style={styles.attractionContent}>
                    <Text style={[styles.attractionName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.attractionDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                    <View style={styles.attractionMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={colors.primary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.time}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="cash-outline" size={14} color={colors.primary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.fee}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'tips' && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Travel Tips</Text>
              {city.tips?.map((tip: string, idx: number) => (
                <View key={idx} style={[styles.tipCard, { backgroundColor: colors.card }]}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip}</Text>
                </View>
              ))}
              
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Sample Itinerary</Text>
              {city.itinerary?.map((day: any, idx: number) => (
                <View key={idx} style={[styles.itineraryCard, { backgroundColor: colors.card }]}>
                  <View style={styles.itineraryHeader}>
                    <Text style={[styles.itineraryDay, { color: colors.primary }]}>Day {day.day}</Text>
                    <Text style={[styles.itineraryTitle, { color: colors.text }]}>{day.title}</Text>
                  </View>
                  {day.activities.map((activity: string, actIdx: number) => (
                    <View key={actIdx} style={styles.itineraryActivity}>
                      <Ionicons name="time-outline" size={14} color={colors.primary} />
                      <Text style={[styles.itineraryText, { color: colors.textSecondary }]}>{activity}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  imageContainer: {
    height: 280,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  cityName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cityTagline: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  cityStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statBadgeText: {
    color: '#fff',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#6B4EFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  priceBadge: {
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardAddress: {
    fontSize: 12,
    marginBottom: 8,
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  cardRatingText: {
    fontSize: 11,
  },
  cuisineBadge: {
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cuisineText: {
    fontSize: 11,
    fontWeight: '500',
  },
  mustTry: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
  },
  bookButton: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  bookButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  attractionCard: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  attractionImage: {
    width: 100,
    height: 100,
  },
  attractionContent: {
    flex: 1,
    padding: 12,
  },
  attractionName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  attractionDesc: {
    fontSize: 12,
    marginBottom: 6,
  },
  attractionMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  itineraryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  itineraryHeader: {
    marginBottom: 12,
  },
  itineraryDay: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  itineraryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itineraryActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  itineraryText: {
    fontSize: 12,
  },
});