import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tripsAPI, itineraryAPI, Destination, Trip, DayItinerary, Activity } from '../services/api';
import { useRouter } from 'expo-router';

interface AddToTripModalProps {
  visible: boolean;
  onClose: () => void;
  destination: Destination;
}

export default function AddToTripModal({ visible, onClose, destination }: AddToTripModalProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (visible) {
      loadTrips();
    }
  }, [visible]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const data = await tripsAPI.getAll();
      setTrips(data || []);
      
      // If no trips, we could auto-redirect, but user wants modal first
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTrip = async (trip: Trip) => {
    try {
      setAdding(true);
      
      // 1. Fetch current itinerary
      const itinerary = await itineraryAPI.getByTrip(trip._id);
      
      // 2. Prepare new activity
      const newActivity: Activity = {
        id: Date.now().toString(),
        time: '10:00', // Default time
        title: `Visit ${destination.name}`,
        location: destination.district || destination.location,
        category: 'sightseeing',
        cost: destination.entryFee ? parseInt(destination.entryFee.replace(/[^0-9]/g, '')) || 0 : 0,
        completed: false
      };

      // 3. Add to first day or current day if applicable
      const updatedItinerary = [...(itinerary || [])];
      if (updatedItinerary.length === 0) {
          // Initialize days based on trip dates if itinerary is empty
          const start = new Date(trip.start_date);
          const end = new Date(trip.end_date);
          const daysCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          for(let i=1; i<=daysCount; i++) {
              const d = new Date(start);
              d.setDate(start.getDate() + i - 1);
              updatedItinerary.push({ day: i, date: d.toISOString().split('T')[0], activities: [] });
          }
      }

      // Add to Day 1 by default for simplicity or logic can be added to pick
      updatedItinerary[0].activities.push(newActivity);

      // 4. Update backend
      await itineraryAPI.updateItinerary(trip._id, updatedItinerary);
      
      Alert.alert(
        "Success ✅",
        `Added ${destination.name} to Day 1 of your trip "${trip.name}"`,
        [{ text: "View Trip", onPress: () => { onClose(); router.push(`/trip/${trip._id}` as any); } }, { text: "OK", onPress: onClose }]
      );

    } catch (error) {
      console.error('Error adding to itinerary:', error);
      Alert.alert("Error", "Failed to add destination to itinerary.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to Trip</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.destName}>Adding: {destination.name}</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#6B4EFF" style={{ marginVertical: 30 }} />
          ) : trips.length === 0 ? (
            <View style={styles.noTrips}>
                <Ionicons name="airplane-outline" size={50} color="#ccc" />
                <Text style={styles.noTripsTxt}>No active trips found.</Text>
                <TouchableOpacity 
                    style={styles.createBtn}
                    onPress={() => { onClose(); router.push({ pathname: '/plan-trip', params: { destination: destination.name }} as any); }}
                >
                    <Text style={styles.createBtnTxt}>Create New Trip</Text>
                </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={trips}
              keyExtractor={(item) => item._id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                    style={styles.tripItem}
                    onPress={() => handleAddToTrip(item)}
                    disabled={adding}
                >
                    <View style={styles.tripIcon}>
                        <Ionicons name="map" size={20} color="#6B4EFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.tripName}>{item.name}</Text>
                        <Text style={styles.tripDest}>{item.destination}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
              )}
              ListFooterComponent={
                  <TouchableOpacity 
                    style={styles.addTripBtn}
                    onPress={() => { onClose(); router.push({ pathname: '/plan-trip', params: { destination: destination.name }} as any); }}
                  >
                      <Ionicons name="add" size={20} color="#6B4EFF" />
                      <Text style={styles.addTripTxt}>Create New Trip</Text>
                  </TouchableOpacity>
              }
            />
          )}

          {adding && (
              <View style={styles.addingOverlay}>
                  <ActivityIndicator color="#fff" />
                  <Text style={{ color: '#fff', marginTop: 10 }}>Updating Itinerary...</Text>
              </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 25, width: '100%', maxWidth: 400, padding: 20, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  destName: { fontSize: 14, color: '#6B4EFF', fontWeight: '600', marginBottom: 20 },
  tripItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tripIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  tripName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  tripDest: { fontSize: 12, color: '#999', marginTop: 2 },
  addTripBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, marginTop: 10 },
  addTripTxt: { color: '#6B4EFF', fontWeight: 'bold', marginLeft: 5 },
  noTrips: { alignItems: 'center', paddingVertical: 30 },
  noTripsTxt: { color: '#999', marginTop: 10, marginBottom: 20 },
  createBtn: { backgroundColor: '#6B4EFF', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12 },
  createBtnTxt: { color: '#fff', fontWeight: 'bold' },
  addingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(107,78,255,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 10 }
});
