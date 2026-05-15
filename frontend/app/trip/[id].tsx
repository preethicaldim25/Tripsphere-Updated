import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { tripsAPI, expensesAPI, itineraryAPI, DayItinerary, destinationsAPI } from '../../services/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
// Assuming ExploreMap is available globally or similar
import ExploreMap from '../../components/ExploreMap';

const { width } = Dimensions.get('window');

const AnimatedTouchable = ({ onPress, style, children, disabled, onLongPress }: any) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  return (
    <TouchableOpacity 
        onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress} 
        onLongPress={onLongPress} disabled={disabled} activeOpacity={0.9}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Component for animating numbers
const AnimatedNumber = ({ value, style }: { value: number, style?: any }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) return;
    let start = 0;
    const steps = 30; // 60fps for half a second
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      start++;
      current += increment;
      if (start >= steps) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <Text style={style}>₹{display}</Text>;
};

const ItineraryDayCard = ({ day, idx, currentDay, toggleActivity, onAdd, onEdit, onDelete, styles }: any) => {
    const delayAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
        Animated.timing(delayAnim, { toValue: 1, duration: 1000, delay: idx * 300, useNativeDriver: true }).start();
    }, [idx]);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'food': return 'restaurant';
            case 'sightseeing': return 'camera';
            case 'travel': return 'car';
            case 'accommodation': return 'bed';
            default: return 'ellipse';
        }
    };

    return (
        <Animated.View style={{ 
            opacity: delayAnim, 
            transform: [{ translateY: delayAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] 
        }}>
            <View style={styles.timelineDay}>
                <View style={styles.dayIndicator}>
                    <View style={[styles.dayDot, day.day === currentDay && styles.activeDot]} />
                    <View style={styles.dayLine} />
                </View>
                <View style={styles.dayContent}>
                    <View style={styles.dayHeader}>
                        <View>
                            <Text style={styles.dayTitle}>Day {day.day}</Text>
                            <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{new Date(day.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</Text>
                        </View>
                        <TouchableOpacity style={styles.inlineAddBtn} onPress={() => onAdd(day.day)}>
                            <Ionicons name="add-circle" size={24} color="#6B4EFF" />
                        </TouchableOpacity>
                    </View>
                    
                    {day.activities.length === 0 ? (
                        <View style={styles.emptyActivity}>
                            <Text style={styles.emptyActivityText}>No activities added yet.</Text>
                        </View>
                    ) : (
                        day.activities.map((activity: any) => (
                            <View key={activity.id} style={styles.activityContainer}>
                                <AnimatedTouchable 
                                    style={[styles.activityCard, activity.completed && styles.completedCard, { flex: 1, marginBottom: 0 }]}
                                    onPress={() => toggleActivity(day.day, activity.id)}
                                >
                                    <View style={styles.activityMain}>
                                        <Ionicons 
                                            name={activity.completed ? 'checkmark-circle' : 'ellipse-outline'} 
                                            size={22} 
                                            color={activity.completed ? '#4CAF50' : '#6B4EFF'} 
                                        />
                                        <View style={{ marginLeft: 10, flex: 1 }}>
                                            <Text style={[styles.activityTitle, activity.completed && styles.completedText]} numberOfLines={1}>{activity.title}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                                <Ionicons name={getCategoryIcon(activity.category) as any} size={10} color="#999" style={{ marginRight: 4 }} />
                                                <Text style={styles.activityTime}>{activity.time} {activity.cost > 0 ? `• ₹${activity.cost}` : ''}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </AnimatedTouchable>
                                <View style={styles.activityActions}>
                                    <TouchableOpacity onPress={() => onEdit(day.day, activity)} style={styles.actActionBtn}>
                                        <Ionicons name="pencil" size={16} color="#6B4EFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => onDelete(day.day, activity.id)} style={styles.actActionBtn}>
                                        <Ionicons name="trash" size={16} color="#FF4B4B" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                    <View style={{ height: 10 }} />
                </View>
            </View>
        </Animated.View>
    );
};

export default function TripDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const [trip, setTrip] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [itinerary, setItinerary] = useState<DayItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [destinationDetails, setDestinationDetails] = useState<any>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [selectedPin, setSelectedPin] = useState<any>(null);

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState('');
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [activeEditingDay, setActiveEditingDay] = useState<number | null>(null);
  const [editingActivity, setEditingActivity] = useState<any | null>(null);
  const [activityForm, setActivityForm] = useState({
    title: '',
    time: '09:00',
    location: '',
    cost: '',
    category: 'sightseeing'
  });
  
  const [selectedDay, setSelectedDay] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [tripMode, setTripMode] = useState(false);

  const getDayPlaces = (trip: any, selectedDay: number) => {
    if (!trip || !trip.itinerary) return [];
    const dayData = trip.itinerary.find((d: any) => d?.day === selectedDay);
    if (!dayData || !dayData.activities) return [];
    
    return dayData.activities.map((a: any) => ({
      id: a?.id || Math.random().toString(),
      name: a?.title || a?.location || 'Activity',
      latitude: Number(a?.coordinates?.lat || a?.lat || 11.0),
      longitude: Number(a?.coordinates?.lng || a?.lng || 78.0),
      category: a?.category || 'general'
    }));
  };

  const getMapPlaces = (trip: any, dayNum: number) => {
    // If user has manually defined stops, prioritize them (manual trip mode)
    if (trip?.stops && Array.isArray(trip.stops) && trip.stops.length > 0) {
      return trip.stops.map((s: any) => ({
          name: s?.name || s || 'Stop',
          lat: Number(s?.coordinates?.lat || s?.lat || 11.0),
          lng: Number(s?.coordinates?.lng || s?.lng || 78.0)
      }));
    }
    // Otherwise derive from itinerary (AI trip mode)
    return getDayPlaces(trip, dayNum).map(p => ({
        ...p,
        lat: p.latitude,
        lng: p.longitude
    }));
  };

  const fadeAnimHeader = useRef(new Animated.Value(0)).current;
  const fadeAnimContent = useRef(new Animated.Value(0)).current;
  const fadeAnimMap = useRef(new Animated.Value(0)).current;
  const fadeAnimBudget = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const stepSlideAnim = useRef(new Animated.Value(0)).current;
  const routeLineAnim = useRef(new Animated.Value(0)).current;

  // Auth guard — use Redirect component instead of router.replace() in useEffect
  // to avoid "navigate before Root Layout mounted" error
  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    loadTripData();
  }, [id]);

  const triggerEntryAnimations = (percentUsed: number) => {
    console.log("🚀 Animations started!");
    // Sequence staggered fades
    Animated.stagger(300, [
        Animated.timing(fadeAnimHeader, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnimMap, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnimBudget, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnimContent, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();

    // Progress bar fill
    Animated.timing(progressAnim, {
        toValue: percentUsed,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false // width needs false
    }).start();

    // Route line fill
    Animated.timing(routeLineAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false
    }).start();

    Animated.timing(stepSlideAnim, {
        toValue: 1,
        duration: 1000,
        delay: 600,
        useNativeDriver: true
    }).start();
  };

  const loadTripData = async () => {
    try {
      setLoading(true);
      const tripData = await tripsAPI.getById(id as string);
      
      setTrip(tripData);
      
      // Expenses are now calculated in used_budget from backend, 
      // but we still load them if needed for detail view (not strictly required for dashboard anymore)
      try {
        const expensesData = await expensesAPI.getByTrip(id as string);
        setExpenses((expensesData as any).expenses || []);
      } catch (e) {}

      // Auto-generate itinerary days if empty
      let finalItinerary = tripData.itinerary || [];
      if (finalItinerary.length === 0) {
          const start = new Date(tripData.start_date);
          const end = new Date(tripData.end_date);
          const daysCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
          for (let i = 0; i < daysCount; i++) {
              const date = new Date(start);
              date.setDate(start.getDate() + i);
              finalItinerary.push({
                  day: i + 1,
                  date: date.toISOString().split('T')[0],
                  activities: [],
              });
          }
      }
      setItinerary(finalItinerary);
      
      const start = new Date(tripData.start_date);
      const today = new Date();
      const diff = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const end = new Date(tripData.end_date);
      const totalNights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      setCurrentDay(Math.max(1, Math.min(diff, totalNights + 1)));
      
      // Calculate budget for progress bar animation using real backend data
      const pct = Math.min(((tripData.used_budget || 0) / tripData.budget) * 100, 100);
      
      // Run progress/route line animations after load
      setTimeout(() => triggerEntryAnimations(pct), 400);
    } catch (error) {
      console.error('Error loading trip:', error);
      triggerEntryAnimations(0);
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = (trip: any) => {
      if (!trip?.start_date || !trip?.end_date) return 0;
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const saveItineraryToBackend = async (newItinerary: any[]) => {
    try {
        await itineraryAPI.updateItinerary(id as string, newItinerary);
    } catch (error) {
        console.error('Error saving itinerary:', error);
        Alert.alert('Sync Error', 'Could not save itinerary changes to server.');
    }
  };


  const handleSaveBudget = async () => {
    const val = Number(tempBudget);
    if (isNaN(val) || val <= 0) {
        Alert.alert('Invalid Budget', 'Please enter a valid amount.');
        return;
    }
    try {
        setLoading(true);
        await tripsAPI.update(id as string, { budget: val });
        setTrip({ ...trip, budget: val });
        setIsEditingBudget(false);
        
        // Update progress bar
        const totalE = expenses.reduce((s, e) => s + e.amount, 0);
        const pct = Math.min((totalE / val) * 100, 100);
        Animated.timing(progressAnim, { toValue: pct, duration: 800, useNativeDriver: false }).start();
    } catch (error) {
        Alert.alert('Error', 'Failed to update budget.');
    } finally {
        setLoading(false);
    }
  };

  const handleAddActivity = (day: number) => {
    setActiveEditingDay(day);
    setEditingActivity(null);
    setActivityForm({
        title: '',
        time: '09:00',
        location: '',
        cost: '',
        category: 'sightseeing'
    });
    setActivityModalVisible(true);
  };

  const handleEditActivity = (dayNum: number, activity: any) => {
    setActiveEditingDay(dayNum);
    setEditingActivity(activity);
    setActivityForm({
        title: activity.title,
        time: activity.time,
        location: activity.location || '',
        cost: String(activity.cost || ''),
        category: activity.category || 'sightseeing'
    });
    setActivityModalVisible(true);
  };

  const handleSaveActivity = async () => {
    if (!activityForm.title.trim()) {
        Alert.alert('Error', 'Activity title is required.');
        return;
    }

    const newActivity = {
        id: editingActivity?.id || Date.now().toString(),
        title: activityForm.title,
        time: activityForm.time,
        location: activityForm.location,
        cost: Number(activityForm.cost) || 0,
        category: activityForm.category,
        completed: editingActivity?.completed || false
    };

    const updatedItinerary = itinerary.map((d: any) => {
        if (d.day === activeEditingDay) {
            if (editingActivity) {
                return {
                    ...d,
                    activities: d.activities.map((a: any) => a.id === editingActivity.id ? newActivity : a)
                };
            } else {
                return {
                    ...d,
                    activities: [...d.activities, newActivity].sort((a, b) => a.time.localeCompare(b.time))
                };
            }
        }
        return d;
    });

    setItinerary(updatedItinerary);
    setActivityModalVisible(false);
    await saveItineraryToBackend(updatedItinerary);
  };

  const handleDeleteActivity = (dayNum: number, activityId: string) => {
    Alert.alert('Delete Activity', 'Remove this from your plan?', [
        { text: 'Cancel', style: 'cancel' },
        { 
            text: 'Delete', 
            style: 'destructive', 
            onPress: async () => {
                const updated = itinerary.map((d: any) => {
                    if (d.day === dayNum) {
                        return { ...d, activities: d.activities.filter((a: any) => a.id !== activityId) };
                    }
                    return d;
                });
                setItinerary(updated);
                await saveItineraryToBackend(updated);
            }
        }
    ]);
  };

  const handleDownload = async () => {
      setDownloading(true);
      try {
          const htmlContent = generateTripHTML();
          const { uri } = await Print.printToFileAsync({
              html: htmlContent,
              base64: false
          });
          
          if (Platform.OS === 'ios' || Platform.OS === 'android') {
              await Sharing.shareAsync(uri, {
                 UTI: '.pdf',
                 mimeType: 'application/pdf',
              });
          }
          
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 3000);
      } catch (error) {
          console.error('Error generating PDF:', error);
          Alert.alert('Error', 'Failed to generate trip plan PDF.');
      } finally {
          setDownloading(false);
      }
  };

  const generateTripHTML = () => {
      const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
      
      let activitiesHtml = '';
      itinerary.forEach((day: any) => {
          activitiesHtml += `
            <div class="day-card">
              <h2>Day ${day.day} - ${new Date(day.date).toLocaleDateString()}</h2>
              <ul class="activities">
          `;
          if (day.activities.length === 0) {
              activitiesHtml += `<li>No activities planned for this day.</li>`;
          } else {
              day.activities.forEach((act: any) => {
                 activitiesHtml += `
                    <li>
                      <strong>${act.time}</strong>: ${act.title}
                      <br/>
                      <span class="location">📌 ${act.location || 'Location TBA'} | 💰 ₹${act.cost || 0} | 🏷 ${act.category}</span>
                    </li>
                 `;
              });
          }
          activitiesHtml += `
              </ul>
            </div>
          `;
      });

      const routeSequence = [];
      if (trip.start_location) routeSequence.push(trip.start_location);
      if (trip.stop_details) trip.stop_details.forEach((s: any) => routeSequence.push(s.name));
      if (trip.destination_details) routeSequence.push(trip.destination_details.name);
      
      return `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 20px; line-height: 1.6; }
              h1 { color: #6B4EFF; text-align: center; font-size: 32px; margin-bottom: 5px; }
              .subtitle { text-align: center; color: #666; font-size: 18px; margin-bottom: 30px; }
              .summary-card { background: #F8F9FF; border: 1px solid #E0E0E0; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
              .summary-card h3 { margin-top: 0; color: #1A1A1A; }
              .summary-grid { display: flex; flex-wrap: wrap; gap: 15px; }
              .summary-item { flex: 1; min-width: 120px; }
              .summary-label { font-size: 12px; color: #888; text-transform: uppercase; }
              .summary-value { font-size: 16px; font-weight: bold; color: #222; }
              .budget-value { color: #6B4EFF; font-weight: bold; }
              .route-box { background: #F0EDFF; border-left: 5px solid #6B4EFF; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
              .route-title { font-weight: bold; color: #6B4EFF; margin-bottom: 5px; }
              .day-card { border-bottom: 2px dashed #E0E0E0; padding-bottom: 20px; margin-bottom: 20px; }
              .day-card h2 { color: #1A1A1A; border-left: 4px solid #6B4EFF; padding-left: 10px; }
              .activities { list-style: none; padding-left: 0; }
              .activities li { background: #fff; border: 1px solid #EEE; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
              .location { font-size: 13px; color: #666; display: block; margin-top: 5px; }
              .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #AAA; }
            </style>
          </head>
          <body>
            <h1>${trip.name}</h1>
            <div class="subtitle">Trip to ${trip.destination_details?.name || trip.destination || 'your destination'}</div>
            
            <div class="route-box">
              <div class="route-title">Planned Route</div>
              <div>${routeSequence.join(' → ')}</div>
            </div>

            <div class="summary-card">
              <h3>Trip Summary</h3>
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="summary-label">Travelers</div>
                  <div class="summary-value">${trip.travelers || 1} Persons</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Total Budget</div>
                  <div class="summary-value budget-value">₹${trip.budget}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Current Spent</div>
                  <div class="summary-value">₹${totalSpent}</div>
                </div>
              </div>
            </div>
            
            <h3>Detailed Itinerary</h3>
            ${activitiesHtml}
            
            <div class="footer">
              Generated by TripSphere Planner • Enjoy your trip!
            </div>
          </body>
        </html>
      `;
  };

  const toggleActivity = async (dayNum: number, activityId: string) => {
    const updated = itinerary.map((d: any) => {
        if (d.day === dayNum) {
            return {
                ...d,
                activities: d.activities.map((a: any) => 
                    a.id === activityId ? { ...a, completed: !a.completed } : a
                )
            };
        }
        return d;
    });
    setItinerary(updated);
    await saveItineraryToBackend(updated);
  };

  const openNavigation = (lat: number, lng: number) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`,
      web: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    });
    
    if (Platform.OS === 'web') {
        window.open(url, '_blank');
    } else {
        // For native, you'd usually use Linking.openURL
        Alert.alert('Navigation', 'Open in Maps?', [
            { text: 'Cancel' },
            { text: 'Open', onPress: () => { /* use Linking.openURL(url) */ } }
        ]);
    }
  };

  const renderRoute = () => {
      const displayStops: string[] = [];
      
      if (trip?.start_location) {
          displayStops.push(trip.start_location);
      } else {
          displayStops.push('Home');
      }

      if (trip?.stop_details && Array.isArray(trip.stop_details)) {
          trip.stop_details.forEach((s: any) => displayStops.push(s.name));
      }

      if (trip?.destination_details) {
          displayStops.push(trip.destination_details.name);
      }

      return (
          <View style={styles.routeCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={styles.sectionTitle}>Sequential Route</Text>
                  <View style={{ backgroundColor: '#EDE9FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                      <Text style={{ fontSize: 11, color: '#6B4EFF', fontWeight: '700' }}>{displayStops.length - 1} Segment{displayStops.length - 1 !== 1 ? 's' : ''}</Text>
                  </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4, paddingHorizontal: 4 }}>
                  {displayStops.map((loc, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === displayStops.length - 1;
                      const nodeColor = isFirst ? '#10B981' : isLast ? '#EF4444' : '#6B4EFF';
                      return (
                          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <View style={{ alignItems: 'center' }}>
                                  <View style={[styles.routeNodeDot, { backgroundColor: nodeColor }]}>
                                      <Ionicons
                                          name={isFirst ? 'home-outline' : isLast ? 'flag' : 'location'}
                                          size={14}
                                          color="#fff"
                                      />
                                  </View>
                                  <Text style={[styles.routeNodeText, { color: nodeColor }]} numberOfLines={1}>{loc}</Text>
                              </View>
                              {idx < displayStops.length - 1 && (
                                  <View style={styles.routeArrow}>
                                      <View style={styles.routeArrowLine} />
                                      <Ionicons name="chevron-forward" size={14} color="#6B4EFF" />
                                  </View>
                              )}
                          </View>
                      );
                  })}
              </ScrollView>
          </View>
      );
  };

  const renderItinerary = () => {
      return (
          <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 15 }}>
                  <Text style={styles.sectionTitle}>Journey Plan</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="information-circle-outline" size={16} color="#6B4EFF" style={{ marginRight: 5 }} />
                      <Text style={{ fontSize: 12, color: '#6B4EFF', fontWeight: '600' }}>Manage daily spots</Text>
                  </View>
              </View>
              {itinerary.length === 0 ? (
                  <View style={{ padding: 30, alignItems: 'center' }}>
                      <Ionicons name="calendar-outline" size={48} color="#ccc" />
                      <Text style={{ color: '#999', marginTop: 10, textAlign: 'center' }}>Initializing itinerary...</Text>
                  </View>
              ) : (
                  itinerary.map((day: any, idx: number) => (
                      <ItineraryDayCard 
                          key={day.day} 
                          day={day} 
                          idx={idx} 
                          currentDay={currentDay} 
                          toggleActivity={toggleActivity} 
                          onAdd={handleAddActivity}
                          onEdit={handleEditActivity}
                          onDelete={handleDeleteActivity}
                          styles={styles} 
                      />
                  ))
              )}
          </View>
      );
  };

  const renderBudgetInsights = () => {
    const totalSpent = trip.used_budget || 0;
    const remaining = trip.budget - totalSpent;

    return (
        <Animated.View style={[styles.insightSection, { opacity: fadeAnimBudget, transform: [{ translateY: fadeAnimBudget.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}>
            <View style={styles.budgetProgressContainer}>
                <View style={styles.budgetFlowHeader}>
                    <Text style={styles.insightTitle}>Financial Health</Text>
                    <TouchableOpacity 
                        style={[styles.miniEditBtn, isEditingBudget && { backgroundColor: '#6B4EFF' }]} 
                        onPress={() => {
                            if (isEditingBudget) {
                                handleSaveBudget();
                            } else {
                                setTempBudget(String(trip.budget));
                                setIsEditingBudget(true);
                            }
                        }}
                    >
                        <Ionicons name={isEditingBudget ? "checkmark" : "pencil"} size={14} color={isEditingBudget ? "#fff" : "#6B4EFF"} />
                        <Text style={[styles.miniEditBtnTxt, isEditingBudget && { color: '#fff' }]}>{isEditingBudget ? 'Save' : 'Edit'}</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.progressBarBg}>
                    <Animated.View style={[styles.progressBarFill, { 
                        width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), 
                        backgroundColor: remaining < 0 ? '#FF4B4B' : '#6B4EFF' 
                    }]} />
                </View>
                <View style={styles.budgetDetails}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.budgetText}>Total Limit: </Text>
                        {isEditingBudget ? (
                            <TextInput
                                style={styles.inlineBudgetInput}
                                value={tempBudget}
                                onChangeText={setTempBudget}
                                keyboardType="numeric"
                                autoFocus
                                selectTextOnFocus
                            />
                        ) : (
                            <Text style={[styles.budgetText, { fontWeight: 'bold', color: '#1A1A1A' }]}>₹{trip.budget.toLocaleString()}</Text>
                        )}
                    </View>
                    <Text style={styles.budgetText}>Used: <AnimatedNumber value={totalSpent} /></Text>
                </View>
                <View style={[styles.budgetDetails, { marginTop: 8 }]}>
                    <Text style={[styles.budgetText, { color: remaining < 0 ? '#FF4B4B' : '#4CAF50', fontWeight: 'bold' }]}>
                        {remaining < 0 ? 'Shortfall: ' : 'Remaining: '} ₹{Math.abs(remaining).toLocaleString()}
                    </Text>
                </View>
            </View>
        </Animated.View>
    );
  };
  const renderMap = () => {
      if (!trip) return null;

      let places = getDayPlaces(trip, selectedDay);
      
      // Fallback: If no day-specific activities with coords, show trip's manual stops
      if (places.length === 0 && trip.stop_details && trip.stop_details.length > 0) {
          places = trip.stop_details.map((s: any) => ({
              name: s.name || 'Stop',
              lat: s.coordinates?.lat || s.lat,
              lng: s.coordinates?.lng || s.lng,
              category: s.category || 'Stop'
          })).filter((p: any) => p.lat && p.lng);
      }

      // Secondary Fallback: Show the main destination
      if (places.length === 0 && trip.destination_details) {
          const d = trip.destination_details;
          const lat = d.coordinates?.lat || d.lat;
          const lng = d.coordinates?.lng || d.lng;
          if (lat && lng) {
              places = [{
                  name: d.name,
                  lat: Number(lat),
                  lng: Number(lng),
                  category: d.category || 'Destination'
              }];
          }
      }

      console.log("📅 Selected Day:", selectedDay);
      console.log("📍 Places for Map:", places);

      return (
          <View style={[
              styles.mapContainer,
              isFullScreen && {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9999,
                  backgroundColor: '#fff',
                  padding: 0
              }
          ]}>
              {!isFullScreen && (
                  <View style={styles.daySelectorContainer}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelectorScroll}>
                          {itinerary.map((day) => (
                              <TouchableOpacity
                                  key={day.day}
                                  onPress={() => setSelectedDay(day.day)}
                                  style={[
                                      styles.dayButton,
                                      selectedDay === day.day && styles.selectedDayButton
                                  ]}
                              >
                                  <Text style={[
                                      styles.dayButtonText,
                                      selectedDay === day.day && styles.selectedDayButtonText
                                  ]}>
                                      Day {day.day}
                                  </Text>
                              </TouchableOpacity>
                          ))}
                      </ScrollView>
                  </View>
              )}

              <Animated.View style={[
                  styles.mapFrame, 
                  { opacity: fadeAnimMap },
                  isFullScreen && { height: '100%', borderRadius: 0 }
              ]}>
                  {places.length > 0 ? (
                      <ExploreMap 
                        places={places} 
                        routePlaces={places} 
                        onPinSelect={setSelectedPin} 
                        theme="light" 
                        showRoute={true} 
                        id={`trip-${id}`} 
                        isFullScreen={isFullScreen}
                      />
                  ) : (
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
                          <Ionicons name="map-outline" size={48} color="#ccc" />
                          <Text style={{ marginTop: 10, color: '#999', fontWeight: 'bold' }}>No locations available for this day</Text>
                      </View>
                  )}

                  <TouchableOpacity
                      onPress={() => setIsFullScreen(!isFullScreen)}
                      style={[
                          styles.fullScreenBtn,
                          isFullScreen ? styles.fullScreenBtnActive : styles.fullScreenBtnNormal
                      ]}
                  >
                      <Ionicons 
                          name={isFullScreen ? "close" : "expand"} 
                          size={20} 
                          color="#fff" 
                      />
                      <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 5 }}>
                          {isFullScreen ? "Close" : "Full View"}
                      </Text>
                  </TouchableOpacity>

                  {selectedPin && (
                      <View style={styles.pinCard}>
                          <View style={{ flex: 1 }}>
                              <Text style={styles.pinTitle} numberOfLines={1}>{selectedPin.name}</Text>
                              <Text style={styles.pinCat}>{selectedPin.category || 'Location'}</Text>
                          </View>
                          <TouchableOpacity style={styles.addBtn} onPress={() => setSelectedPin(null)}>
                              <Text style={styles.addBtnTxt}>Close</Text>
                          </TouchableOpacity>
                      </View>
                  )}
              </Animated.View>
          </View>
      );
  };


  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#6B4EFF" />
    </View>
  );

  if (!trip) return (
      <View style={styles.loadingContainer}>
          <Text style={{ color: '#666' }}>Trip details could not be found.</Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Back</Text>
          </TouchableOpacity>
      </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FF' }}>
      <Stack.Screen options={{ title: '', headerTransparent: true, headerTintColor: '#fff', headerLeft: () => null }} />
      
      {/* Floating Top Navigation */}
      <View style={styles.floatingNav}>
          <TouchableOpacity 
              style={styles.navCircleBtn} 
              onPress={() => router.back()}
              activeOpacity={0.7}
          >
              <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <TouchableOpacity 
              style={styles.navCircleBtn} 
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.7}
          >
              <Ionicons name="home" size={22} color="#1A1A1A" />
          </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Top Banner (Animated) */}
          <Animated.View style={[styles.topBanner, { opacity: fadeAnimHeader, transform: [{ translateY: fadeAnimHeader.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}>
              <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerTitle}>{trip.name}</Text>
                  <Text style={styles.bannerDest}>{trip.destination_details?.name || 'Your Trip'}</Text>
                  <View style={styles.bannerTags}>
                      <View style={styles.tag}><Ionicons name="calendar" size={14} color="#fff" /><Text style={styles.tagTxt}>{calculateNights(trip)} Nights</Text></View>
                      <View style={styles.tag}><Ionicons name="people" size={14} color="#fff" /><Text style={styles.tagTxt}>{trip.travelers || 2} Travelers</Text></View>
                  </View>
              </View>
          </Animated.View>

          <Animated.View style={[styles.contentArea, { opacity: fadeAnimContent, transform: [{ translateY: fadeAnimContent.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}>
              {/* 1. Map View, Instructions, Summary */}
              {renderMap()}

              {/* 2 & 3. Route & Budget (wrapped with padding) */}
              <View style={{ paddingHorizontal: 20 }}>
                  <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 15 }]}>Route & Budget</Text>
                  {renderRoute()}
                  {renderBudgetInsights()}
              </View>

              {/* 4. Detailed Itinerary */}
              <View style={{ marginTop: 20 }}>
                  <Text style={[styles.sectionTitle, { marginLeft: 20 }]}>Day-by-Day Itinerary</Text>
                  {renderItinerary()}
              </View>

              {/* 5. Notes (if any) */}
              {trip.notes ? (
                  <View style={{ padding: 20, marginTop: 10, paddingBottom: 40 }}>
                      <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Trip Notes</Text>
                      <Text style={{ fontSize: 16, lineHeight: 24, color: '#444' }}>{trip.notes}</Text>
                  </View>
              ) : null}
          </Animated.View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.bottomActionBar}>
          <TouchableOpacity style={styles.actionBtnLight} onPress={() => router.push('/(tabs)')}>
              <Ionicons name="home-outline" size={20} color="#6B4EFF" />
              <Text style={styles.actionBtnLightTxt}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtnDark, { backgroundColor: '#10B981', flex: 1.5 }]} 
            onPress={() => setTripMode(true)}
          >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.actionBtnDarkTxt}>Start Trip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtnDark, { flex: 0.8 }]} onPress={handleDownload}>
              {downloading ? (
                  <ActivityIndicator color="#fff" size="small" />
              ) : downloadSuccess ? (
                  <Ionicons name="checkmark-done" size={20} color="#fff" />
              ) : (
                  <Ionicons name="download-outline" size={20} color="#fff" />
              )}
          </TouchableOpacity>
      </View>

      {/* Activity Edit Modal */}
      <Modal
          animationType="fade"
          transparent={true}
          visible={activityModalVisible}
          onRequestClose={() => setActivityModalVisible(false)}
      >
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>{editingActivity ? 'Edit Activity' : 'Add Activity'}</Text>
                      <TouchableOpacity onPress={() => setActivityModalVisible(false)}>
                          <Ionicons name="close" size={24} color="#333" />
                      </TouchableOpacity>
                  </View>
                  
                  <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                      <View style={styles.field}>
                          <Text style={styles.fieldLabel}>Activity Title</Text>
                          <TextInput 
                              style={styles.fieldInput} 
                              placeholder="e.g. Visit Museum"
                              value={activityForm.title}
                              onChangeText={(t) => setActivityForm({...activityForm, title: t})}
                          />
                      </View>

                      <View style={styles.fieldRow}>
                          <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
                              <Text style={styles.fieldLabel}>Time</Text>
                              <TextInput 
                                  style={styles.fieldInput} 
                                  placeholder="09:00"
                                  value={activityForm.time}
                                  onChangeText={(t) => setActivityForm({...activityForm, time: t})}
                              />
                          </View>
                          <View style={[styles.field, { flex: 1 }]}>
                              <Text style={styles.fieldLabel}>Cost (₹)</Text>
                              <TextInput 
                                  style={styles.fieldInput} 
                                  placeholder="0"
                                  keyboardType="numeric"
                                  value={activityForm.cost}
                                  onChangeText={(t) => setActivityForm({...activityForm, cost: t})}
                              />
                          </View>
                      </View>

                      <View style={styles.field}>
                          <Text style={styles.fieldLabel}>Location</Text>
                          <TextInput 
                              style={styles.fieldInput} 
                              placeholder="Specific spot name"
                              value={activityForm.location}
                              onChangeText={(t) => setActivityForm({...activityForm, location: t})}
                          />
                      </View>

                      <View style={styles.field}>
                          <Text style={styles.fieldLabel}>Category</Text>
                          <View style={styles.catGrid}>
                              {['sightseeing', 'food', 'travel', 'accommodation', 'other'].map(cat => (
                                  <TouchableOpacity 
                                      key={cat}
                                      style={[styles.catChip, activityForm.category === cat && styles.catChipActive]}
                                      onPress={() => setActivityForm({...activityForm, category: cat})}
                                  >
                                      <Text style={[styles.catChipTxt, activityForm.category === cat && styles.catChipTxtActive]}>{cat}</Text>
                                  </TouchableOpacity>
                              ))}
                          </View>
                      </View>
                  </ScrollView>

                  <View style={styles.modalFooter}>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => setActivityModalVisible(false)}>
                          <Text style={styles.cancelBtnTxt}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.saveBtn} onPress={handleSaveActivity}>
                          <Text style={styles.saveBtnTxt}>{editingActivity ? 'Update' : 'Add Activity'}</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

      {/* TRIP MODE OVERLAY (Full Screen Experience) */}
      {tripMode && (
          <View style={styles.tripModeOverlay}>
              <View style={{ flex: 1 }}>
                <ExploreMap 
                    places={getDayPlaces(trip, selectedDay)} 
                    routePlaces={getDayPlaces(trip, selectedDay)} 
                    onPinSelect={setSelectedPin} 
                    theme="light" 
                    showRoute={true} 
                    id={`trip-mode-${id}`} 
                    isFullScreen={true}
                />
              </View>

              {/* Top Exit Button */}
              <TouchableOpacity 
                style={styles.tripModeExit} 
                onPress={() => setTripMode(false)}
              >
                  <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>

              {/* Bottom Panel */}
              <View style={styles.tripModePanel}>
                  <View style={styles.tripModePanelHeader}>
                      <Text style={styles.tripModeDayTitle}>Day {selectedDay}</Text>
                      <View style={styles.tripModeDaySelector}>
                          <TouchableOpacity onPress={() => setSelectedDay(Math.max(1, selectedDay - 1))}>
                              <Ionicons name="chevron-back" size={24} color="#6B4EFF" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setSelectedDay(Math.min(itinerary.length, selectedDay + 1))}>
                              <Ionicons name="chevron-forward" size={24} color="#6B4EFF" />
                          </TouchableOpacity>
                      </View>
                  </View>

                  <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                      {getDayPlaces(trip, selectedDay).length === 0 ? (
                          <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>No activities scheduled for this day.</Text>
                      ) : (
                          getDayPlaces(trip, selectedDay).map((place: any, idx: number) => (
                              <View key={idx} style={styles.tripModeItem}>
                                  <View style={styles.tripModeIcon}>
                                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>{idx + 1}</Text>
                                  </View>
                                  <View style={{ flex: 1 }}>
                                      <Text style={styles.tripModeItemName}>{place.name}</Text>
                                      <Text style={styles.tripModeItemCat}>{place.category || 'Sightseeing'}</Text>
                                  </View>
                                  <TouchableOpacity 
                                    style={styles.tripModeNavBtn}
                                    onPress={() => openNavigation(place.lat, place.lng)}
                                  >
                                      <Ionicons name="navigate" size={18} color="#fff" />
                                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>Go</Text>
                                  </TouchableOpacity>
                              </View>
                          ))
                      )}
                  </ScrollView>
              </View>
          </View>
      )}
    </View>
  );
}

// Helpers
const calculateNights = (t: any) => {
    if (!t) return 0;
    const start = new Date(t.start_date);
    const end = new Date(t.end_date);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FF' },
  errorBtn: { marginTop: 15, backgroundColor: '#6B4EFF', padding: 15, borderRadius: 10, minHeight: 44, justifyContent: 'center' },
  topBanner: { height: 260, width: '100%', backgroundColor: '#6B4EFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#6B4EFF', shadowOffset: {height: 10, width: 0}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  bannerOverlay: { padding: 25, paddingTop: 90 },
  bannerTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  bannerDest: { color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 5, letterSpacing: -1 },
  bannerTags: { flexDirection: 'row', gap: 10, marginTop: 15 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 5 },
  tagTxt: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A', marginBottom: 15 },
  routeCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  routeNodeDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  routeArrow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 6, marginBottom: 16 },
  routeArrowLine: { width: 28, height: 2, backgroundColor: '#E0D9FF' },
  routeNode: { alignItems: 'center', backgroundColor: '#F5F3FF', padding: 12, borderRadius: 16 },
  routeNodeText: { fontSize: 11, fontWeight: '700', marginTop: 2, maxWidth: 70, textAlign: 'center' },
  insightSection: { backgroundColor: '#fff', padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  budgetProgressContainer: { },
  budgetFlowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  insightTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  budgetLabel: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  progressBarBg: { height: 12, backgroundColor: '#F0F0F0', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 6 },
  budgetDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  budgetText: { fontSize: 14, color: '#666', fontWeight: '500' },
  contentArea: { paddingHorizontal: 5, paddingVertical: 20 },
  timelineDay: { flexDirection: 'row', paddingHorizontal: 15 },
  dayIndicator: { width: 30, alignItems: 'center' },
  dayDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#E0E0E0', marginTop: 25, borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  activeDot: { backgroundColor: '#6B4EFF' },
  dayLine: { flex: 1, width: 2, backgroundColor: '#F0F0F0' },
  dayContent: { flex: 1, paddingBottom: 25, paddingLeft: 10 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 18 },
  dayTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  dayCost: { fontSize: 15, fontWeight: '800', color: '#6B4EFF' },
  activityCard: { backgroundColor: '#fff', padding: 18, borderRadius: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 3 },
  completedCard: { opacity: 0.5, backgroundColor: '#F8F9FA' },
  activityMain: { flexDirection: 'row', alignItems: 'center' },
  activityTitle: { fontSize: 17, fontWeight: '700', color: '#222' },
  completedText: { textDecorationLine: 'line-through' },
  activityTime: { fontSize: 13, color: '#888', marginTop: 4, fontWeight: '500' },
  floatingDl: { display: 'none' },
  successToast: { position: 'absolute', top: 50, alignSelf: 'center', backgroundColor: '#4CAF50', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, zIndex: 200, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 },
  mapContainer: { padding: 5 },
  mapFrame: { height: 350, width: '100%', borderRadius: 30, overflow: 'hidden', backgroundColor: '#e0e0e0', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  bottomActionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: Platform.OS === 'ios' ? 30 : 20, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderColor: '#EEE', flexDirection: 'row', gap: 15, zIndex: 100 },
  actionBtnLight: { flex: 1, height: 55, borderRadius: 16, backgroundColor: '#F0F0FF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  actionBtnLightTxt: { color: '#6B4EFF', fontWeight: 'bold', fontSize: 16 },
  actionBtnDark: { flex: 1, height: 55, borderRadius: 16, backgroundColor: '#6B4EFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#6B4EFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  actionBtnDarkTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  roadmapSummaryCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 24, marginTop: -40, marginHorizontal: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.1, shadowRadius: 15, elevation: 8, zIndex: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  rsItem: { alignItems: 'center', flex: 1 },
  rsLabel: { fontSize: 10, color: '#888', marginTop: 8, fontWeight: '700', textTransform: 'uppercase' },
  rsValue: { fontSize: 14, color: '#222', marginTop: 4, fontWeight: '900' },
  stepCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 18, borderRadius: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, alignItems: 'center', marginHorizontal: 15 },
  stepIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#6B4EFF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  stepNum: { fontSize: 11, color: '#888', fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 },
  stepDesc: { fontSize: 15, color: '#222', fontWeight: 'bold' },
  stepContent: { flex: 1 },
  pinCard: { position: 'absolute', bottom: 20, left: 15, right: 15, backgroundColor: 'rgba(255,255,255,0.95)', padding: 15, borderRadius: 20, shadowColor: '#000', shadowOffset: {height: 4, width: 0}, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pinTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  pinCat: { fontSize: 12, color: '#888', textTransform: 'capitalize', marginTop: 2 },
  addBtn: { backgroundColor: '#6B4EFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  addBtnTxt: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  // Summary card enhancements
  rsIconBg: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  rsDivider: { width: 1, height: 36, backgroundColor: '#F0F0F0', alignSelf: 'center' },
  // Vertical Timeline Stepper
  timelineWrapper: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 10 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  timelineLeft: { width: 38, alignItems: 'center', marginRight: 14, paddingTop: 2 },
  timelineDot: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 4 },
  timelineLine: { width: 2, backgroundColor: '#E0E0E0', minHeight: 32, marginTop: 3 },
  timelineCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#6B4EFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  timelineStep: { fontSize: 10, fontWeight: '800', color: '#aaa', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  timelineLabel: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  timelineSub: { fontSize: 12, color: '#888', lineHeight: 18 },
  midBadge: { backgroundColor: '#EDE9FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  midBadgeTxt: { fontSize: 10, fontWeight: '800', color: '#6B4EFF', textTransform: 'uppercase' },
  // Direct Editing & Modal Styles
  miniEditBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0EDFF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 4 },
  miniEditBtnTxt: { fontSize: 11, fontWeight: '700', color: '#6B4EFF' },
  inlineBudgetInput: { borderBottomWidth: 2, borderBottomColor: '#6B4EFF', fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', padding: 0, minWidth: 60, marginHorizontal: 5 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusBadgeTxt: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  inlineAddBtn: { padding: 4 },
  emptyActivity: { padding: 15, backgroundColor: '#F8F9FF', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#E0D9FF', alignItems: 'center', marginTop: 10 },
  emptyActivityText: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  activityContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  activityActions: { flexDirection: 'row', gap: 6 },
  actActionBtn: { width: 34, height: 34, backgroundColor: '#fff', borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0EDFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
  modalBody: { marginBottom: 20 },
  field: { marginBottom: 18 },
  fieldRow: { flexDirection: 'row' },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 8 },
  fieldInput: { backgroundColor: '#F8F9FF', borderWidth: 1, borderColor: '#F0EDFF', borderRadius: 12, padding: 15, fontSize: 15, color: '#333' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F8F9FF', borderWidth: 1, borderColor: '#F0EDFF' },
  catChipActive: { backgroundColor: '#6B4EFF', borderColor: '#6B4EFF' },
  catChipTxt: { fontSize: 12, fontWeight: '600', color: '#666' },
  catChipTxtActive: { color: '#fff' },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#F8F9FF', alignItems: 'center' },
  cancelBtnTxt: { fontWeight: '700', color: '#666' },
  saveBtn: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#6B4EFF', alignItems: 'center' },
  saveBtnTxt: { fontWeight: '700', color: '#fff' },
  breakdownContainer: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 15, gap: 10 },
  breakdownRow: { flexDirection: 'row', gap: 10 },
  breakdownItem: { flex: 1, backgroundColor: '#F8F9FF', padding: 10, borderRadius: 12, alignItems: 'center' },
  breakdownLabel: { fontSize: 10, color: '#888', marginBottom: 2 },
  breakdownValue: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  floatingNav: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  navCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  daySelectorContainer: { backgroundColor: '#fff', paddingVertical: 12, marginBottom: 5 },
  daySelectorScroll: { paddingHorizontal: 15, gap: 10, flexDirection: 'row' },
  dayButton: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F8F9FF', borderWidth: 1, borderColor: '#F0F0FF', minWidth: 80, alignItems: 'center' },
  selectedDayButton: { backgroundColor: '#6B4EFF', borderColor: '#6B4EFF', shadowColor: '#6B4EFF', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  dayButtonText: { fontSize: 13, fontWeight: '700', color: '#6B4EFF' },
  selectedDayButtonText: { color: '#fff' },
  fullScreenBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fullScreenBtnNormal: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  fullScreenBtnActive: {
    backgroundColor: '#FF4B4B',
    top: 20,
    bottom: 'auto',
  },
  tripModeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 10000,
  },
  tripModeExit: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
  },
  tripModePanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 10002,
  },
  tripModePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tripModeDayTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  tripModeDaySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  tripModeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tripModeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B4EFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  tripModeItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  tripModeItemCat: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  tripModeNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B4EFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
});