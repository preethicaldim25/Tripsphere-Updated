import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, TextInput, ScrollView, Platform } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDestinationImage } from '../constants/images';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/themecontext';
import { tripsAPI, TripCreate, DayItinerary, Activity } from '../services/api';

export default function YourTripScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { user } = useAuth();
    
    const [places, setPlaces] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [showForm, setShowForm] = useState(false);
    const [tripName, setTripName] = useState('My Awesome Trip');
    const [days, setDays] = useState('3');
    const [budget, setBudget] = useState('10000');
    const [travelers, setTravelers] = useState('2');

    const loadDraft = async () => {
        try {
            const existing = await AsyncStorage.getItem('draft_trip_places');
            if (existing) {
                setPlaces(JSON.parse(existing));
            }
        } catch (e) {
            console.error(e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadDraft();
        }, [])
    );

    const handleRemove = async (name: string) => {
        const updated = places.filter(p => p.name !== name);
        setPlaces(updated);
        await AsyncStorage.setItem('draft_trip_places', JSON.stringify(updated));
    };    const handlePlanTrip = async () => {
        console.log("🚀 Create Itinerary clicked");
        if (!tripName || !days || !budget || !travelers) {
            console.log("⚠️ Validation failed: Missing fields");
            Alert.alert("Error", "Please fill all fields");
            return;
        }
        
        setLoading(true);
        try {
            const numDays = parseInt(days) || 1;
            console.log("📦 Trip Data:", { tripName, numDays, budget, travelers });
            
            
            const itinerary: DayItinerary[] = [];
            const currentDate = new Date();
            
            for (let i = 1; i <= numDays; i++) {
                const placeIndex = places.length > 0 ? Math.floor(((i - 1) / numDays) * places.length) : 0;
                const placeForDay = places[placeIndex];
                
                const d = new Date(currentDate);
                d.setDate(currentDate.getDate() + (i - 1));
                
                const dayItin: DayItinerary = {
                    day: i,
                    date: d.toISOString().split('T')[0],
                    activities: []
                };

                if (placeForDay) {
                    dayItin.activities.push({
                        id: Date.now().toString() + i,
                        title: `Explore ${placeForDay.name}`,
                        time: '10:00 AM',
                        location: placeForDay.name,
                        category: 'sightseeing',
                        cost: 0,
                        completed: false
                    });
                }
                itinerary.push(dayItin);
            }

            const tripData: TripCreate = {
                title: tripName,
                destination_id: places[0]?.id || places[0]?._id || "65c3b1234567890123456789", // Fallback to a valid-ish ObjectId format if missing
                start_date: currentDate.toISOString().split('T')[0],
                end_date: new Date(currentDate.getTime() + ((numDays - 1) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
                total_budget: parseInt(budget),
                travelers: parseInt(travelers),
                itinerary: itinerary
            };

            console.log("🌐 Calling itinerary API...");
            const createdTrip = await tripsAPI.create(tripData);
            console.log("✅ API Response:", createdTrip);
            
            const tripId = (createdTrip as any)._id || (createdTrip as any).id;
            
            // clear draft
            await AsyncStorage.removeItem('draft_trip_places');
            setPlaces([]);
            
            console.log("📍 Navigating to ItineraryScreen:", tripId);
            router.push(`/trip/${tripId}`);
            
        } catch (error: any) {
            console.error("❌ Itinerary Error:", error);
            Alert.alert("Error", error?.message || "Failed to create trip");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <Stack.Screen options={{ title: 'My Trip Selection', headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text }} />
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {places.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Ionicons name="map-outline" size={80} color={colors.textLight} />
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 15 }}>No places selected yet.</Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 5, textAlign: 'center' }}>
                        Browse destinations and tap "+ Add to Trip" to start building your multi-place plan.
                    </Text>
                    <TouchableOpacity style={{ marginTop: 30, backgroundColor: '#6B4EFF', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12, minHeight: 44, width: '100%', alignItems: 'center' }} onPress={() => router.push('/(tabs)/explore')}>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Explore Places</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 15 }}>Selected Destinations</Text>
                    
                    {places.map((item, index) => (
                        <View key={index} style={{ flexDirection: 'row', backgroundColor: colors.card, padding: 12, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }}>
                            <Image source={{ uri: item.image || getDestinationImage(item.name) }} style={{ width: 60, height: 60, borderRadius: 12 }} />
                            <View style={{ marginLeft: 15, flex: 1, justifyContent: 'center' }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{item.name}</Text>
                                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{item.district}</Text>
                            </View>
                            <TouchableOpacity style={{ justifyContent: 'center', paddingLeft: 10 }} onPress={() => handleRemove(item.name)}>
                                <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {!showForm ? (
                        <TouchableOpacity style={{ backgroundColor: '#6B4EFF', width: '100%', minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginTop: 20, paddingVertical: 12 }} onPress={() => setShowForm(true)}>
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Plan My Trip</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ marginTop: 20, backgroundColor: colors.card, padding: 20, borderRadius: 16 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 }}>Trip Details</Text>
                            
                            <Text style={{ color: colors.textSecondary, marginBottom: 5, fontSize: 13, fontWeight: 'bold' }}>Trip Name</Text>
                            <TextInput style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 15, color: colors.text }} value={tripName} onChangeText={setTripName} />
                            
                            <View style={{ flexDirection: 'row', width: '100%', gap: 15, marginBottom: 15 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: colors.textSecondary, marginBottom: 5, fontSize: 13, fontWeight: 'bold' }}>Days</Text>
                                    <TextInput style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.text }} keyboardType="numeric" value={days} onChangeText={setDays} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: colors.textSecondary, marginBottom: 5, fontSize: 13, fontWeight: 'bold' }}>Travelers</Text>
                                    <TextInput style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.text }} keyboardType="numeric" value={travelers} onChangeText={setTravelers} />
                                </View>
                            </View>

                            <Text style={{ color: colors.textSecondary, marginBottom: 5, fontSize: 13, fontWeight: 'bold' }}>Total Budget (₹)</Text>
                            <TextInput style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 20, color: colors.text }} keyboardType="numeric" value={budget} onChangeText={setBudget} />

                            <TouchableOpacity 
                                disabled={loading}
                                style={{ backgroundColor: '#6B4EFF', width: '100%', minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 12, paddingVertical: 12 }} 
                                onPress={handlePlanTrip}
                            >
                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{loading ? "Generating..." : "Create Itinerary"}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
        </>
    );
}
