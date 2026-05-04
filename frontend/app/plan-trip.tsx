import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/themecontext';
import { tripsAPI, aiAPI, destinationsAPI } from '../services/api';

// Popular destinations for picker
const POPULAR_DESTINATIONS = [
  'Ooty',
  'Kodaikanal',
  'Mahabalipuram',
  'Madurai',
  'Chennai',
  'Coimbatore',
  'Trichy',
  'Kanyakumari',
  'Rameswaram',
  'Yercaud',
  'Yelagiri',
  'Kolli Hills',
];

export default function PlanTripScreen() {
  const router = useRouter();
  const { destination, suggestedBudget, duration, tripType } = useLocalSearchParams();
  const { isAuthenticated, user } = useAuth();
  const { colors, theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const [flow, setFlow] = useState<'selection' | 'add' | 'ai'>('selection');
  const [step, setStep] = useState<1 | 2>(1);

  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [selectedNearby, setSelectedNearby] = useState<string[]>([]);
  const [allDestinations, setAllDestinations] = useState<any[]>([]);
  
  // 2. FIX DROPDOWN VALUE BINDING:
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const [destinationName, setDestinationName] = useState("");
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [showStopsDropdown, setShowStopsDropdown] = useState(false);

  // Extra route state
  const [startLocation, setStartLocation] = useState('');
  const [stops, setStops] = useState<string[]>([]);

  // Fetch all destinations on mount
  React.useEffect(() => {
    const fetchAll = async () => {
      try {
        const data = await destinationsAPI.getAll({ limit: 100 });
        console.log("🌍 Destinations API response (PlanTrip):", data);
        if (data && data.destinations) {
          setAllDestinations(data.destinations);
          console.log("📍 Stored destinations (PlanTrip):", data.destinations);
          console.log('✅ Loaded', data.destinations.length, 'destinations from DB');
        }
      } catch (error) {
        console.error('Error loading destinations:', error);
      }
    };
    fetchAll();
  }, []);

  // Form state
  interface PlanTripFormData {
    name: string;
    destination: string;
    startDate: Date | null;
    endDate: Date | null;
    travelers: string;
    accommodation: string;
    notes: string;
    budget: string;
    budgetType: 'total' | 'per_person';
    pace: 'relaxed' | 'balanced' | 'packed';
  }

  const [formData, setFormData] = useState<PlanTripFormData>({
    name: '',
    destination: '',
    startDate: null,
    endDate: null,
    travelers: '1',
    accommodation: '',
    notes: '',
    budget: '',
    budgetType: 'total',
    pace: 'balanced',
  });

  const [budgetBreakdown, setBudgetBreakdown] = useState({
    travel: '',
    stay: '',
    food: '',
    other: '',
  });

  const addStop = (dest: string) => {
    if (dest && !stops.includes(dest) && dest !== formData.destination) {
      setStops(prev => [...prev, dest]);
    }
  };

  const removeStop = (dest: string) => {
    setStops(prev => prev.filter(s => s !== dest));
  };

  const [destinationId, setDestinationId] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [destinationDetails, setDestinationDetails] = useState<any>(null);

  const fetchDestinationDetails = async (destId: string) => {
    console.log("📍 destinationId:", destId);
    if (!destId || destId === "undefined") {
      console.warn("🚫 Blocked invalid destinationId:", destId);
      return;
    }
    
    try {
      setLoadingDetails(true);
      console.log("📡 Fetching destination:", destId);
      const data = await destinationsAPI.getPlace(destId);
      if (data) {
        setDestinationDetails(data);
        setDestinationId(data._id || data.id || '');
        if (data.nearby_places) setNearbyPlaces(data.nearby_places);
      }
    } catch (error) {
      console.error('❌ Error fetching destination details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle incoming params
  React.useEffect(() => {
    if (destination && allDestinations.length > 0) {
      // Find the destination object to get its ID
      const found = allDestinations.find(d => d.name.toLowerCase() === String(destination).toLowerCase());
      if (found) {
        const dId = found._id || found.id;
        console.log("🎯 Found destination from params:", found.name, "ID:", dId);
        
        const budgetClean = suggestedBudget ? String(suggestedBudget).replace(/[^\d]/g, '') : '';
        const paceValue = tripType === 'hill stations' ? 'relaxed' : 'balanced';
        
        setFormData(prev => ({
          ...prev,
          destination: found.name,
          name: `Trip to ${found.name}`,
          budget: budgetClean,
          pace: paceValue as any,
        }));
        
        // Sync custom states
        setSelectedDestination(found);
        setDestinationName(found.name);
        setDestinationId(dId);
        fetchDestinationDetails(dId);
      }
    }
  }, [destination, suggestedBudget, tripType, allDestinations]);

  const toggleNearby = (name: string) => {
    if (selectedNearby.includes(name)) {
      setSelectedNearby(selectedNearby.filter(n => n !== name));
    } else {
      setSelectedNearby([...selectedNearby, name]);
    }
  };

  // Debug logs
  console.log('PlanTrip - isAuthenticated:', isAuthenticated);
  console.log('PlanTrip - user:', user);

  // Check authentication
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Plan a Trip' }} />
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={60} color="#6B4EFF" />
          <Text style={styles.title}>Login Required</Text>
          <Text style={styles.subtitle}>Please login to plan a trip</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleStartDateConfirm = (date: Date) => {
    setShowStartDatePicker(false);
    
    // If end date is before start date, update end date to null
    if (formData.endDate && date > formData.endDate) {
      setFormData({ ...formData, startDate: date, endDate: null });
    } else {
      setFormData({ ...formData, startDate: date });
    }
  };

  const handleEndDateConfirm = (date: Date) => {
    setShowEndDatePicker(false);
    if (!formData.startDate) {
      setFormData({ ...formData, endDate: date });
    } else if (date >= formData.startDate) {
      setFormData({ ...formData, endDate: date });
    } else {
      if (Platform.OS === 'web') {
        window.alert('End date must be after start date');
      } else {
        Alert.alert('Invalid Date', 'End date must be after start date');
      }
    }
  };

  const calculateNights = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const diffTime = Math.abs(formData.endDate.getTime() - formData.startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const validateStep1 = () => {
    const showAlert = (title: string, msg: string) => {
      if (Platform.OS === 'web') {
        window.alert(`${title}: ${msg}`);
      } else {
        Alert.alert(title, msg);
      }
    };

    if (!formData.name.trim()) {
      showAlert('Error', 'Please enter a trip name');
      return false;
    }
    if (!formData.destination) {
      showAlert('Error', 'Please select a destination');
      return false;
    }
    if (!formData.startDate) {
      showAlert('Error', 'Please select a start date');
      return false;
    }
    if (!formData.endDate) {
      showAlert('Error', 'Please select an end date');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const showAlert = (title: string, msg: string) => {
      if (Platform.OS === 'web') {
        window.alert(`${title}: ${msg}`);
      } else {
        Alert.alert(title, msg);
      }
    };

    if (!formData.budget || isNaN(Number(formData.budget)) || Number(formData.budget) <= 0) {
      showAlert('Error', 'Please enter a valid budget');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1);
    } else {
      setFlow('selection');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const finalBudget = formData.budgetType === 'per_person' 
        ? Number(formData.budget) * Number(formData.travelers)
        : Number(formData.budget);

      if (flow === 'ai') {
        // AI Itinerary Flow
        const aiResponse = await aiAPI.generateTripPlan({
          name: formData.name,
          destination: formData.destination,
          startDate: formData.startDate!.toISOString(),
          endDate: formData.endDate!.toISOString(),
          budget: finalBudget,
          budgetType: formData.budgetType,
          travelers: Number(formData.travelers),
          pace: formData.pace,
          notes: formData.notes
        });

        // Save the AI generated trip - Mapping to new schema
        const tripResponse = await tripsAPI.create({
          title: aiResponse.name,
          destination_id: destinationId, // Using the ID we fetched
          start_date: aiResponse.start_date,
          end_date: aiResponse.end_date,
          total_budget: aiResponse.budget,
          travelers: aiResponse.travelers,
          itinerary: aiResponse.itinerary,
          notes: aiResponse.notes
        });

        router.push({
          pathname: '/trip/itinerary',
          params: { 
            tripId: tripResponse.id,
            startDate: tripResponse.start_date,
            endDate: tripResponse.end_date
          }
        } as any);
      } else {
        // Manual Add Flow
        if (!destinationId) {
            throw new Error("Please select a valid destination");
        }

        const tripData = {
          title: formData.name,
          destination_id: destinationId,
          start_location: startLocation || undefined,
          stops: stops.length > 0 ? stops : undefined,
          start_date: formData.startDate!.toISOString().split('T')[0],
          end_date: formData.endDate!.toISOString().split('T')[0],
          total_budget: finalBudget,
          budget_breakdown: {
              travel: Number(budgetBreakdown.travel) || 0,
              stay: Number(budgetBreakdown.stay) || 0,
              food: Number(budgetBreakdown.food) || 0,
              other: Number(budgetBreakdown.other) || 0,
          },
          travelers: Number(formData.travelers),
          accommodation: formData.accommodation,
          notes: `Pace: ${formData.pace}. ` +
                 (selectedNearby.length > 0 ? `Include: ${selectedNearby.join(', ')}. ` : '') +
                 formData.notes,
          itinerary: []
        };

        console.log('🚀 Sending Trip Payload:', JSON.stringify(tripData, null, 2));
        const response = await tripsAPI.create(tripData as any);
        console.log('✅ Trip Created Successfully:', response);
        
        router.push({
          pathname: '/trip/itinerary',
          params: {
            tripId: response.id,
            startDate: response.start_date,
            endDate: response.end_date
          }
        } as any);
      }
    } catch (error: any) {
      console.error('❌ Critical error creating trip:', error);
      const errorMsg = error?.message || 'Server encountered an unexpected error';
      if (Platform.OS === 'web') {
        window.alert(`Trip Creation Failed: ${errorMsg}`);
      } else {
        Alert.alert('Trip Creation Failed', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Plan a Trip',
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
      }} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: colors.background }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {flow === 'selection' ? (
            <View style={styles.selectionContainer}>
              <View style={styles.selectionHeader}>
                <Ionicons name="map-outline" size={80} color={colors.primary} />
                <Text style={[styles.selectionTitle, { color: colors.text }]}>How would you like to plan?</Text>
                <Text style={[styles.selectionSubtitle, { color: colors.textSecondary }]}>Choose your preferred way to build your journey</Text>
              </View>

              <TouchableOpacity 
                style={[styles.selectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setFlow('add')}
              >
                <View style={[styles.selectionIconBg, { backgroundColor: colors.lightPurple }]}>
                  <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
                </View>
                <View style={styles.selectionContent}>
                  <Text style={[styles.selectionCardTitle, { color: colors.text }]}>Add Trip Manually</Text>
                  <Text style={[styles.selectionCardDesc, { color: colors.textSecondary }]}>Create a custom itinerary day-by-day with your own spots.</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textLight} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.selectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setFlow('ai')}
              >
                <View style={[styles.selectionIconBg, { backgroundColor: '#F5F3FF' }]}>
                  <Ionicons name="sparkles" size={32} color="#6B4EFF" />
                </View>
                <View style={styles.selectionContent}>
                  <Text style={[styles.selectionCardTitle, { color: colors.text }]}>Generate AI Itinerary</Text>
                  <Text style={[styles.selectionCardDesc, { color: colors.textSecondary }]}>Let AI curate the best places and budget for your destination.</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                {step === 1 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={handlePrevStep} style={{ marginRight: 15 }}>
                      <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View>
                      <Text style={[styles.headerTitle, { color: colors.text }]}>{flow === 'ai' ? 'AI Trip Planner' : 'Manual Trip Plan'}</Text>
                      <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{flow === 'ai' ? 'Generating smart recommendations' : 'Build your own adventure'}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={handlePrevStep} style={{ marginRight: 15 }}>
                      <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View>
                      <Text style={[styles.headerTitle, { color: colors.text }]}>Great! Let's build your plan.</Text>
                      <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Customize your target budget and pace</Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.form}>
                {step === 1 && (
                  <>
                    {/* Trip Name */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>Trip Name <Text style={styles.required}>*</Text></Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                        placeholder="e.g., Summer Vacation 2024"
                        placeholderTextColor={colors.textLight}
                        value={formData.name}
                        onChangeText={(text: string) => setFormData({ ...formData, name: text })}
                        maxLength={50}
                      />
                    </View>

                    {/* Start Location */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>Starting From <Text style={{ color: colors.textSecondary, fontWeight: '400' }}>(optional)</Text></Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                        placeholder="e.g., Chennai, Bangalore"
                        placeholderTextColor={colors.textLight}
                        value={startLocation}
                        onChangeText={setStartLocation}
                      />
                    </View>

                    {/* Destination */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>Main Destination <Text style={styles.required}>*</Text></Text>
                      
                      {/* 1. FIX INPUT UI (DARK THEME) & 6. FIX WHITE BOX ISSUE */}
                      <TouchableOpacity 
                        style={[
                          styles.customDropdownInput, 
                          { 
                            backgroundColor: "#1E1E1E", 
                            borderColor: "#333",
                          }
                        ]}
                        onPress={() => setShowDestinationDropdown(!showDestinationDropdown)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.dropdownValueText, 
                          { color: destinationName ? "#FFFFFF" : "#888" }
                        ]}>
                          {destinationName || "Select a destination"}
                        </Text>
                        <Ionicons 
                          name={showDestinationDropdown ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#888" 
                        />
                      </TouchableOpacity>

                      {/* Dropdown Options */}
                      {showDestinationDropdown && (
                        <View style={[styles.dropdownOptions, { backgroundColor: "#1E1E1E", borderColor: "#333" }]}>
                          <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled={true}>
                            {allDestinations.map((dest: any) => {
                               const isSelected = (selectedDestination?._id || selectedDestination?.id) === (dest._id || dest.id);
                               return (
                                 <TouchableOpacity
                                   key={dest._id || dest.id}
                                   style={[
                                     styles.dropdownOption,
                                     isSelected && { backgroundColor: "#333" }
                                   ]}
                                   onPress={() => {
                                     // 3. ON SELECT & 8. DEBUG LOG
                                     console.log("Selected:", dest);
                                     setSelectedDestination(dest);
                                     setDestinationName(dest.name);
                                     setFormData({ ...formData, destination: dest.name });
                                     setDestinationId(dest._id || dest.id);
                                     fetchDestinationDetails(dest._id || dest.id);
                                     setShowDestinationDropdown(false);
                                   }}
                                 >
                                   <Text style={[styles.optionText, { color: isSelected ? colors.primary : "#FFFFFF" }]}>
                                     {dest.name} {isSelected && " ✓"}
                                   </Text>
                                 </TouchableOpacity>
                               );
                            })}
                          </ScrollView>
                        </View>
                      )}
                    </View>

                    {/* Additional Stops */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>Add Stops <Text style={{ color: colors.textSecondary, fontWeight: '400' }}>(optional)</Text></Text>
                      
                      <TouchableOpacity 
                        style={[
                          styles.customDropdownInput, 
                          { 
                            backgroundColor: "#1E1E1E", 
                            borderColor: "#333",
                          }
                        ]}
                        onPress={() => setShowStopsDropdown(!showStopsDropdown)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.dropdownValueText, 
                          { color: "#888" }
                        ]}>
                          + Add a stop
                        </Text>
                        <Ionicons 
                          name={showStopsDropdown ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#888" 
                        />
                      </TouchableOpacity>

                      {/* Stops Dropdown Options */}
                      {showStopsDropdown && (
                        <View style={[styles.dropdownOptions, { backgroundColor: "#1E1E1E", borderColor: "#333" }]}>
                          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                            {allDestinations
                              .filter(d => (d._id || d.id) !== destinationId && !stops.includes(d._id || d.id))
                              .map((dest: any) => (
                                <TouchableOpacity
                                  key={dest._id || dest.id}
                                  style={styles.dropdownOption}
                                  onPress={() => {
                                    addStop(dest._id || dest.id);
                                    setShowStopsDropdown(false);
                                  }}
                                >
                                  <Text style={[styles.optionText, { color: "#FFFFFF" }]}>
                                    {dest.name}
                                  </Text>
                                </TouchableOpacity>
                              ))
                            }
                            {allDestinations.filter(d => (d._id || d.id) !== destinationId && !stops.includes(d._id || d.id)).length === 0 && (
                              <View style={styles.dropdownOption}>
                                <Text style={{ color: "#888", textAlign: 'center' }}>No more destinations</Text>
                              </View>
                            )}
                          </ScrollView>
                        </View>
                      )}
                      {stops.length > 0 && (
                        <View style={styles.stopsContainer}>
                          {/* Route preview */}
                          <View style={styles.routePreview}>
                            <Text style={[styles.routePreviewItem, { color: '#10B981' }]}>🏠 {startLocation || 'Home'}</Text>
                            {stops.map((s, i) => {
                               const stopObj = allDestinations.find(d => (d._id || d.id) === s);
                               return <Text key={i} style={[styles.routePreviewItem, { color: '#6B4EFF' }]}>→ 📍 {stopObj?.name || s}</Text>;
                            })}
                            {formData.destination ? <Text style={[styles.routePreviewItem, { color: '#EF4444' }]}>→ 🏁 {formData.destination}</Text> : null}
                          </View>
                          {stops.map((stop, idx) => {
                            const stopObj = allDestinations.find(d => (d._id || d.id) === stop);
                            return (
                              <View key={idx} style={[styles.stopChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Ionicons name="location" size={14} color="#6B4EFF" />
                                <Text style={[styles.stopChipText, { color: colors.text }]} numberOfLines={1}>{stopObj?.name || stop}</Text>
                                <TouchableOpacity onPress={() => removeStop(stop)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                  <Ionicons name="close-circle" size={18} color={colors.error} />
                                </TouchableOpacity>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* Dates */}
                    <View style={styles.row}>
                      <View style={styles.inputGroupRow}>
                        <Text style={[styles.label, { color: colors.text }]}>Start Date <Text style={styles.required}>*</Text></Text>
                        {Platform.OS === 'web' ? React.createElement('input', {
                          type: 'date',
                          style: {
                            padding: '11px',
                            borderRadius: '12px',
                            border: `1px solid ${colors.border}`,
                            fontSize: '16px',
                            color: formData.startDate ? colors.text : colors.textLight,
                            fontFamily: 'inherit',
                            backgroundColor: colors.card,
                            width: '100%',
                            boxSizing: 'border-box',
                            outline: 'none',
                          },
                          value: formData.startDate ? formData.startDate.toISOString().split('T')[0] : '',
                          min: new Date().toISOString().split('T')[0],
                          onChange: (e: any) => {
                            if (e.target.value) {
                              const selectedDate = new Date(e.target.value);
                              handleStartDateConfirm(selectedDate);
                            }
                          }
                        }) : (
                          <TouchableOpacity
                            style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => setShowStartDatePicker(true)}
                          >
                            <Ionicons name="calendar-outline" size={20} color={formData.startDate ? colors.primary : colors.textLight} />
                            <Text style={[styles.dateText, { color: formData.startDate ? colors.text : colors.textLight }]}>
                              {formData.startDate ? formData.startDate.toLocaleDateString('en-IN') : 'Select Date'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={styles.inputGroupRow}>
                        <Text style={[styles.label, { color: colors.text }]}>End Date <Text style={styles.required}>*</Text></Text>
                        {Platform.OS === 'web' ? React.createElement('input', {
                          type: 'date',
                          style: {
                            padding: '11px',
                            borderRadius: '12px',
                            border: `1px solid ${colors.border}`,
                            fontSize: '16px',
                            color: formData.endDate ? colors.text : colors.textLight,
                            fontFamily: 'inherit',
                            backgroundColor: colors.card,
                            width: '100%',
                            boxSizing: 'border-box',
                            outline: 'none',
                          },
                          value: formData.endDate ? formData.endDate.toISOString().split('T')[0] : '',
                          min: formData.startDate ? formData.startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                          onChange: (e: any) => {
                            if (e.target.value) {
                              const selectedDate = new Date(e.target.value);
                              handleEndDateConfirm(selectedDate);
                            }
                          }
                        }) : (
                          <TouchableOpacity
                            style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => setShowEndDatePicker(true)}
                          >
                            <Ionicons name="calendar-outline" size={20} color={formData.endDate ? colors.primary : colors.textLight} />
                            <Text style={[styles.dateText, { color: formData.endDate ? colors.text : colors.textLight }]}>
                              {formData.endDate ? formData.endDate.toLocaleDateString('en-IN') : 'Select Date'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* Duration indicator */}
                    {(formData.destination && formData.startDate && formData.endDate) ? (
                      <View style={[styles.durationBadge, { backgroundColor: colors.lightPurple }]}>
                        <Ionicons name="moon-outline" size={16} color={colors.primary} />
                        <Text style={[styles.durationText, { color: colors.primary }]}>
                          {calculateNights()} night{calculateNights() !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    ) : null}

                    {/* Travelers */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>Travelers</Text>
                      <View style={[styles.travelerSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TouchableOpacity
                          style={styles.travelerButton}
                          onPress={() => {
                            const val = Number(formData.travelers);
                            if (val > 1) setFormData({ ...formData, travelers: String(val - 1) });
                          }}
                        >
                          <Ionicons name="remove" size={20} color={colors.primary} />
                        </TouchableOpacity>
                        <Text style={[styles.travelerCount, { color: colors.text }]}>{formData.travelers}</Text>
                        <TouchableOpacity
                          style={styles.travelerButton}
                          onPress={() => {
                            const val = Number(formData.travelers);
                            if (val < 10) setFormData({ ...formData, travelers: String(val + 1) });
                          }}
                        >
                          <Ionicons name="add" size={20} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Accommodation */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>Accommodation (Optional)</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                        placeholder="e.g., Hotel Name, Homestay"
                        placeholderTextColor={colors.textLight}
                        value={formData.accommodation}
                        onChangeText={(text: string) => setFormData({ ...formData, accommodation: text })}
                      />
                    </View>

                    {/* Nearby Places Selection */}
                    {nearbyPlaces.length > 0 && (
                      <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Include Nearby Places</Text>
                        <View style={styles.chipContainer}>
                          {nearbyPlaces.map((place, index) => (
                            <TouchableOpacity
                              key={index}
                              style={[
                                styles.chip,
                                { borderColor: colors.primary, backgroundColor: colors.card },
                                selectedNearby.includes(place.name) && [styles.chipActive, { backgroundColor: colors.primary }]
                              ]}
                              onPress={() => toggleNearby(place.name)}
                            >
                              <Text style={[
                                styles.chipText,
                                { color: colors.primary },
                                selectedNearby.includes(place.name) && [styles.chipTextActive, { color: '#fff' }]
                              ]}>
                                {place.name} ({place.distance})
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Notes */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
                      <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                        placeholder="Any special requirements or notes..."
                        placeholderTextColor={colors.textLight}
                        value={formData.notes}
                        onChangeText={(text: string) => setFormData({ ...formData, notes: text })}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </View>

                    {/* Next Step Button */}
                    <TouchableOpacity
                      style={[styles.submitButton, { backgroundColor: colors.primary }]}
                      onPress={handleNextStep}
                    >
                      <Text style={styles.submitButtonText}>Next: Build Plan</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                  </>
                )}

                {step === 2 && (
                  <>
                    {/* Action 1: Budget */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { fontSize: 16, marginBottom: 12, color: colors.text }]}>What is your target budget for this trip? <Text style={styles.required}>*</Text></Text>
                      
                      <View style={[styles.budgetTypeSelector, { backgroundColor: colors.background === '#000' ? '#1A1A1A' : '#F3F0FF' }]}>
                        <TouchableOpacity
                          style={[styles.budgetTypeBtn, formData.budgetType === 'total' && [styles.budgetTypeBtnActive, { backgroundColor: colors.primary }]]}
                          onPress={() => setFormData({ ...formData, budgetType: 'total' })}
                        >
                          <Text style={[styles.budgetTypeTxt, { color: colors.primary }, formData.budgetType === 'total' && styles.budgetTypeTxtActive]}>Total</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.budgetTypeBtn, formData.budgetType === 'per_person' && [styles.budgetTypeBtnActive, { backgroundColor: colors.primary }]]}
                          onPress={() => setFormData({ ...formData, budgetType: 'per_person' })}
                        >
                          <Text style={[styles.budgetTypeTxt, { color: colors.primary }, formData.budgetType === 'per_person' && styles.budgetTypeTxtActive]}>Per Person</Text>
                        </TouchableOpacity>
                      </View>

                      <TextInput
                        style={[styles.input, { fontSize: 24, paddingVertical: 16, textAlign: 'center', backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                        placeholder="₹ 0"
                        placeholderTextColor={colors.textLight}
                        value={formData.budget}
                        onChangeText={(text: string) => setFormData({ ...formData, budget: text })}
                        keyboardType="numeric"
                      />
                    </View>

                    {/* Budget Breakdown */}
                    <View style={[styles.inputGroup, { marginTop: 10 }]}>
                      <Text style={[styles.label, { color: colors.text }]}>Budget Breakdown <Text style={{ color: colors.textSecondary, fontWeight: '400' }}>(Optional)</Text></Text>
                      <View style={{ gap: 10 }}>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                           <View style={{ flex: 1 }}>
                             <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Travel</Text>
                             <TextInput
                               style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                               placeholder="₹"
                               placeholderTextColor={colors.textLight}
                               value={budgetBreakdown.travel}
                               onChangeText={(text) => setBudgetBreakdown({ ...budgetBreakdown, travel: text })}
                               keyboardType="numeric"
                             />
                           </View>
                           <View style={{ flex: 1 }}>
                             <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Stay</Text>
                             <TextInput
                               style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                               placeholder="₹"
                               placeholderTextColor={colors.textLight}
                               value={budgetBreakdown.stay}
                               onChangeText={(text) => setBudgetBreakdown({ ...budgetBreakdown, stay: text })}
                               keyboardType="numeric"
                             />
                           </View>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                           <View style={{ flex: 1 }}>
                             <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Food</Text>
                             <TextInput
                               style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                               placeholder="₹"
                               placeholderTextColor={colors.textLight}
                               value={budgetBreakdown.food}
                               onChangeText={(text) => setBudgetBreakdown({ ...budgetBreakdown, food: text })}
                               keyboardType="numeric"
                             />
                           </View>
                           <View style={{ flex: 1 }}>
                             <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Other</Text>
                             <TextInput
                               style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                               placeholder="₹"
                               placeholderTextColor={colors.textLight}
                               value={budgetBreakdown.other}
                               onChangeText={(text) => setBudgetBreakdown({ ...budgetBreakdown, other: text })}
                               keyboardType="numeric"
                             />
                           </View>
                        </View>
                      </View>
                    </View>

                    {/* Action 2: Pace */}
                    <View style={[styles.inputGroup, { marginTop: 24 }]}>
                      <Text style={[styles.label, { fontSize: 16, marginBottom: 12, color: colors.text }]}>How do you like to travel?</Text>
                      
                      <TouchableOpacity
                        style={[styles.paceOption, { backgroundColor: colors.card, borderColor: colors.border }, formData.pace === 'relaxed' && [styles.paceOptionActive, { borderColor: colors.primary, backgroundColor: colors.background === '#000' ? '#1A1A1A' : '#F8F6FF' }]]}
                        onPress={() => setFormData({ ...formData, pace: 'relaxed' })}
                      >
                        <Text style={[styles.paceTitle, { color: colors.text }, formData.pace === 'relaxed' && [styles.paceTitleActive, { color: colors.primary }]]}>☕ Relaxed</Text>
                        <Text style={[styles.paceSubtitle, { color: colors.textSecondary }, formData.pace === 'relaxed' && [styles.paceSubtitleActive, { color: colors.primary }]]}>1-2 spots/day</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.paceOption, { backgroundColor: colors.card, borderColor: colors.border }, formData.pace === 'balanced' && [styles.paceOptionActive, { borderColor: colors.primary, backgroundColor: colors.background === '#000' ? '#1A1A1A' : '#F8F6FF' }]]}
                        onPress={() => setFormData({ ...formData, pace: 'balanced' })}
                      >
                        <Text style={[styles.paceTitle, { color: colors.text }, formData.pace === 'balanced' && [styles.paceTitleActive, { color: colors.primary }]]}>🚶‍♂️ Balanced</Text>
                        <Text style={[styles.paceSubtitle, { color: colors.textSecondary }, formData.pace === 'balanced' && [styles.paceSubtitleActive, { color: colors.primary }]]}>3-4 spots/day</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.paceOption, { backgroundColor: colors.card, borderColor: colors.border }, formData.pace === 'packed' && [styles.paceOptionActive, { borderColor: colors.primary, backgroundColor: colors.background === '#000' ? '#1A1A1A' : '#F8F6FF' }]]}
                        onPress={() => setFormData({ ...formData, pace: 'packed' })}
                      >
                        <Text style={[styles.paceTitle, { color: colors.text }, formData.pace === 'packed' && [styles.paceTitleActive, { color: colors.primary }]]}>🎒 Packed</Text>
                        <Text style={[styles.paceSubtitle, { color: colors.textSecondary }, formData.pace === 'packed' && [styles.paceSubtitleActive, { color: colors.primary }]]}>See it all!</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Create Draft Itinerary Button */}
                    <TouchableOpacity
                      style={[styles.submitButton, { backgroundColor: colors.primary }, loading && styles.submitButtonDisabled]}
                      onPress={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="sparkles" size={20} color="#fff" />
                          <Text style={styles.submitButtonText}>{flow === 'ai' ? 'Generate AI Itinerary' : 'Create Draft Itinerary'}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Pickers */}
      {Platform.OS !== 'web' && (
        <>
          <DateTimePicker
            isVisible={showStartDatePicker}
            mode="date"
            onConfirm={handleStartDateConfirm}
            onCancel={() => setShowStartDatePicker(false)}
            minimumDate={new Date()}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          />

          <DateTimePicker
            isVisible={showEndDatePicker}
            mode="date"
            onConfirm={handleEndDateConfirm}
            onCancel={() => setShowEndDatePicker(false)}
            minimumDate={formData.startDate || new Date()}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D9FF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF6B6B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0D9FF',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    width: '100%',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  selectionContainer: {
    padding: 20,
    paddingTop: 40,
  },
  selectionHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  selectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  selectionSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  selectionIconBg: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionContent: {
    flex: 1,
    marginLeft: 15,
    marginRight: 10,
  },
  selectionCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  selectionCardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6B4EFF',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#6B4EFF',
  },
  chipText: {
    fontSize: 12,
    color: '#6B4EFF',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0D9FF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: 'column',
    marginBottom: 0,
  },
  inputGroupRow: {
    width: '100%',
    marginBottom: 20,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0D9FF',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: -10,
    marginBottom: 20,
    gap: 4,
  },
  durationText: {
    fontSize: 14,
    color: '#6B4EFF',
    fontWeight: '500',
  },
  travelerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0D9FF',
    borderRadius: 12,
    padding: 4,
  },
  travelerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  travelerCount: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#6B4EFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 20,
    marginBottom: 20,
    gap: 8,
    shadowColor: '#6B4EFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#6B4EFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  
  /* Step 2 specific styles */
  budgetTypeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F0FF',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  budgetTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  budgetTypeBtnActive: {
    backgroundColor: '#6B4EFF',
  },
  budgetTypeTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B4EFF',
  },
  budgetTypeTxtActive: {
    color: 'white',
  },
  paceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0D9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paceOptionActive: {
    borderColor: '#6B4EFF',
    backgroundColor: '#F8F6FF',
  },
  paceTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  paceTitleActive: {
    color: '#6B4EFF',
  },
  paceSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  paceSubtitleActive: {
    color: '#6B4EFF',
  },
  // Stops management
  stopsContainer: {
    marginTop: 12,
    gap: 8,
  },
  routePreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 4,
  },
  routePreviewItem: {
    fontSize: 13,
    fontWeight: '700',
  },
  stopChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  stopChipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  customDropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    height: 52,
  },
  dropdownValueText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownOptions: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 5,
  },
  dropdownOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});