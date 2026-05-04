import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tripsAPI, Trip } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/themecontext';

const { width } = Dimensions.get('window');

export default function TripsScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user, logout } = useAuth();
  const { colors, theme } = useTheme();
  
  const styles = getStyles(colors);

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        loadTrips();
      } else {
        setLoading(false);
        setTrips([]);
        setError('Please login to view your trips');
      }
    }, [isAuthenticated])
  );

  const loadTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('token');
      console.log("🌐 Calling API: /trips/");
      console.log("🔑 Auth Token present:", token ? "Yes" : "No");

      const data = await tripsAPI.getAll();
      console.log("📦 Trips API Response:", data);
      
      setTrips(data);
    } catch (error: any) {
      console.error('❌ Error loading trips:', error);
      
      // Handle session expired
      if (error.message === 'Session expired. Please login again.') {
        setError('Your session has expired. Please login again.');
      } else {
        // Show actual error message for debugging
        setError(`Failed to load trips: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadTrips();
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const performLogoutAction = async () => {
    try {
      await logout();
      setTrips([]);
      setError('Please login to view your trips');
    } catch (e) {
      if (Platform.OS === 'web') {
        window.alert('Failed to logout');
      } else {
        Alert.alert('Error', 'Failed to logout');
      }
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        await performLogoutAction();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: performLogoutAction
          }
        ]
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: 'transparent', borderBottomColor: 'transparent' }]}>
      <Text style={[styles.headerTitle, { color: colors.primary }]}>My Trips</Text>
      {isAuthenticated && (
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );

  const wrapScreen = (content: React.ReactNode) => (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {content}
      </View>
    </SafeAreaView>
  );

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return wrapScreen(
      <>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={80} color={colors.textLight} />
          <Text style={[styles.emptyText, { color: colors.text }]}>Please login to view your trips</Text>
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
          >
            <Text style={[styles.loginButtonText, { color: '#fff' }]}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  if (loading) {
    return wrapScreen(
      <>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your trips...</Text>
        </View>
      </>
    );
  }

  return wrapScreen(
    <>
      {renderHeader()}

      {error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={80} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.warning }]}
              onPress={handleRetry}
            >
              <Text style={[styles.retryButtonText, { color: '#fff' }]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={80} color={colors.textLight} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No trips yet. Create one!</Text>
          <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>Start planning your first adventure today.</Text>
          <TouchableOpacity 
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/plan-trip')}
          >
            <Text style={[styles.createButtonText, { color: '#fff' }]}>Plan a Trip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.card, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/trip/${item._id || item.id}`)}
              activeOpacity={0.9}
            >
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: item.destination_details?.image || 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=1080&auto=format&fit=crop' }}
                  style={styles.cardImage} 
                  resizeMode="cover"
                />
                <View style={[styles.imageRatingBadge, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                  <Ionicons name="wallet-outline" size={12} color="#FBBF24" />
                  <Text style={styles.imageRatingText}>₹{item.budget}</Text>
                </View>
              </View>
              
              <View style={styles.cardContent}>
                <Text style={[styles.cardName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item.destination_details?.name || 'Explore Journey'} • {item.destination_details?.district || 'Tamil Nadu'}
                </Text>
                
                <View style={styles.cardFooter}>
                  <View style={styles.locationContainer}>
                    <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                    <Text style={[styles.locationText, { color: colors.primary }]} numberOfLines={1}>
                      {formatDate(item.start_date)} - {formatDate(item.end_date)}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  listContent: {
    padding: 15,
    paddingBottom: 120,
  },
  card: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageRatingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  imageRatingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  cardName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'column',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
  },
  createButton: {
    paddingHorizontal: 30,
    width: '100%',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    paddingHorizontal: 20,
    width: '100%',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    paddingHorizontal: 20,
    width: '100%',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});