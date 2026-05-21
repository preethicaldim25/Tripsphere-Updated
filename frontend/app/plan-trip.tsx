import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/themecontext';
import { tripsAPI, aiAPI, destinationsAPI } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const TRAVEL_STYLES = ['Relaxed', 'Explorer', 'Adventure', 'Luxury', 'Budget', 'Family-friendly', 'Solo traveler'];
const ACCOMMODATIONS = ['Hotel', 'Resort', 'Hostel', 'Homestay', 'Any'];

export default function PlanTripScreen() {
    const router = useRouter();
    const { destination, suggestedBudget, duration, tripType } = useLocalSearchParams();
    const { isAuthenticated, user } = useAuth();
    const { colors, theme } = useTheme();

    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const TOTAL_STEPS = 4;

    const [allDestinations, setAllDestinations] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        startLocation: '',
        destination: null as any,
        stops: [] as any[],
        startDate: null as Date | null,
        endDate: null as Date | null,
        travelers: 1,
        style: 'Explorer',
        accommodation: 'Any',
        budget: 0,
    });

    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showDestDropdown, setShowDestDropdown] = useState(false);
    const [stopInput, setStopInput] = useState('');

    useEffect(() => {
        destinationsAPI.getAll({ limit: 100 }).then(data => {
            if (data?.destinations) {
                setAllDestinations(data.destinations);
                if (destination) {
                    const found = data.destinations.find((d: any) => d.name.toLowerCase() === String(destination).toLowerCase());
                    if (found) {
                        setFormData(prev => ({
                            ...prev, 
                            destination: found,
                            name: `Trip to ${found.name}`,
                            style: tripType === 'hill stations' ? 'Relaxed' : 'Explorer',
                            budget: suggestedBudget ? parseInt(String(suggestedBudget).replace(/[^\d]/g, '')) : 0
                        }));
                    }
                }
            }
        }).catch(console.error);
    }, [destination]);

    // Animations
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const animateStep = (nextStep: number) => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true })
        ]).start();
        setTimeout(() => setStep(nextStep), 150);
    };

    const handleNext = () => {
        if (step === 1) {
            if (!formData.name || !formData.destination || !formData.startDate || !formData.endDate) {
                Alert.alert('Missing Details', 'Please fill in trip name, destination, and dates.');
                return;
            }
        }
        if (step < TOTAL_STEPS) {
            // Auto calculate budget if entering step 4
            if (step === 3 && formData.budget === 0) {
                let base = 2000;
                if (formData.style === 'Luxury') base = 8000;
                if (formData.style === 'Budget') base = 1000;
                
                const days = Math.max(1, Math.ceil((formData.endDate!.getTime() - formData.startDate!.getTime()) / (1000 * 60 * 60 * 24)));
                setFormData(prev => ({ ...prev, budget: base * days * prev.travelers }));
            }
            animateStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handlePrev = () => {
        if (step > 1) animateStep(step - 1);
        else router.back();
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Call AI Generator
            const aiResponse = await aiAPI.generateTripPlan({
                name: formData.name,
                destination: formData.destination.name,
                startDate: formData.startDate!.toISOString(),
                endDate: formData.endDate!.toISOString(),
                budget: formData.budget,
                budgetType: 'total',
                travelers: formData.travelers,
                pace: formData.style,
                accommodation: formData.accommodation,
                stops: formData.stops.map(s => s.name),
                notes: "Enable real-time smart enhancements: weather alerts, traffic conditions, crowd intelligence."
            });

            // Save to DB
            const tripResponse = await tripsAPI.create({
                title: aiResponse.name,
                destination_id: formData.destination._id || formData.destination.id,
                start_location: formData.startLocation || undefined,
                stops: formData.stops.map(s => s._id || s.id || s.name),
                start_date: aiResponse.start_date,
                end_date: aiResponse.end_date,
                total_budget: aiResponse.budget,
                budget_breakdown: aiResponse.budget_distribution,
                travelers: aiResponse.travelers,
                accommodation: formData.accommodation,
                metadata: aiResponse.metadata,
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

        } catch (error: any) {
            console.error('Trip Generation Error:', error);
            Alert.alert('Generation Failed', error.message || 'Could not build trip plan.');
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <Ionicons name="lock-closed" size={60} color={colors.primary} />
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold', marginTop: 20 }}>Login Required</Text>
                <TouchableOpacity style={{ marginTop: 20, padding: 15, backgroundColor: colors.primary, borderRadius: 12 }} onPress={() => router.push('/auth/login')}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go to Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <LinearGradient colors={['#6B4EFF', '#4ECDC4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.loaderCircle}>
                    <Ionicons name="sparkles" size={40} color="#fff" />
                </LinearGradient>
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: 'bold', marginTop: 30 }}>Building Your Itinerary...</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 10, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 }}>
                    Our AI is optimizing routes, selecting {formData.accommodation.toLowerCase()}s, and balancing your {formData.style.toLowerCase()} schedule.
                </Text>
            </View>
        );
    }

    const renderStepIndicator = () => (
        <View style={styles.stepIndicatorContainer}>
            {[1, 2, 3, 4].map(s => (
                <View key={s} style={[styles.stepDot, { backgroundColor: s <= step ? colors.primary : colors.border }]} />
            ))}
        </View>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen options={{ headerShown: false }} />
            
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={handlePrev} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Smart Trip Planner</Text>
                    {renderStepIndicator()}
                </View>
            </View>

            <Animated.ScrollView style={[styles.scrollContainer, { opacity: fadeAnim }]} contentContainerStyle={{ paddingBottom: 120 }}>
                {step === 1 && (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>Journey Details</Text>
                        <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>Where are you headed?</Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Trip Name</Text>
                            <TextInput 
                                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
                                placeholder="Summer Escape 2026" 
                                placeholderTextColor={colors.textLight}
                                value={formData.name}
                                onChangeText={t => setFormData({ ...formData, name: t })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Start Location (Optional)</Text>
                            <TextInput 
                                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
                                placeholder="e.g. Chennai" 
                                placeholderTextColor={colors.textLight}
                                value={formData.startLocation}
                                onChangeText={t => setFormData({ ...formData, startLocation: t })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Main Destination</Text>
                            <TouchableOpacity style={[styles.dropdownBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowDestDropdown(!showDestDropdown)}>
                                <Text style={{ color: formData.destination ? colors.text : colors.textLight }}>
                                    {formData.destination ? formData.destination.name : "Select destination"}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color={colors.textLight} />
                            </TouchableOpacity>
                            {showDestDropdown && (
                                <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                                        {allDestinations.map(d => (
                                            <TouchableOpacity key={d._id || d.id} style={styles.dropdownItem} onPress={() => { setFormData({ ...formData, destination: d, name: formData.name || `Trip to ${d.name}` }); setShowDestDropdown(false); }}>
                                                <Text style={{ color: colors.text }}>{d.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Add Stops (Optional)</Text>
                            <TextInput 
                                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginBottom: 10 }]} 
                                placeholder="e.g. Coimbatore, Salem" 
                                placeholderTextColor={colors.textLight}
                                value={stopInput}
                                onChangeText={setStopInput}
                                onBlur={() => {
                                    if (stopInput.trim()) {
                                        setFormData(prev => ({ ...prev, stops: [...prev.stops, { name: stopInput.trim() }] }));
                                        setStopInput('');
                                    }
                                }}
                            />
                            {formData.stops.length > 0 && (
                                <View style={styles.chipGrid}>
                                    {formData.stops.map((s, i) => (
                                        <View key={i} style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                                            <Text style={{ color: colors.text }}>{s.name}</Text>
                                            <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, stops: prev.stops.filter((_, idx) => idx !== i) }))}>
                                                <Ionicons name="close" size={16} color={colors.text} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
                                {Platform.OS === 'web' ? (
                                    <input type="date" style={{ padding: 14, borderRadius: 12, backgroundColor: colors.card, border: `1px solid ${colors.border}`, color: colors.text }} value={formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''} onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })} />
                                ) : (
                                    <TouchableOpacity style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowStartDatePicker(true)}>
                                        <Text style={{ color: formData.startDate ? colors.text : colors.textLight }}>{formData.startDate ? formData.startDate.toLocaleDateString() : 'Select Date'}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={styles.halfInput}>
                                <Text style={[styles.label, { color: colors.text }]}>End Date</Text>
                                {Platform.OS === 'web' ? (
                                    <input type="date" style={{ padding: 14, borderRadius: 12, backgroundColor: colors.card, border: `1px solid ${colors.border}`, color: colors.text }} value={formData.endDate ? formData.endDate.toISOString().split('T')[0] : ''} onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })} />
                                ) : (
                                    <TouchableOpacity style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowEndDatePicker(true)}>
                                        <Text style={{ color: formData.endDate ? colors.text : colors.textLight }}>{formData.endDate ? formData.endDate.toLocaleDateString() : 'Select Date'}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        
                        {/* Dates logic */}
                        <DateTimePicker isVisible={showStartDatePicker} mode="date" onConfirm={d => { setShowStartDatePicker(false); setFormData({ ...formData, startDate: d }); }} onCancel={() => setShowStartDatePicker(false)} />
                        <DateTimePicker isVisible={showEndDatePicker} mode="date" onConfirm={d => { setShowEndDatePicker(false); setFormData({ ...formData, endDate: d }); }} onCancel={() => setShowEndDatePicker(false)} />

                    </View>
                )}

                {step === 2 && (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>Personalize Your Trip</Text>
                        <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>Tailor the pacing and experience to your style.</Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Number of Travelers</Text>
                            <View style={styles.counterRow}>
                                <TouchableOpacity style={[styles.counterBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setFormData({ ...formData, travelers: Math.max(1, formData.travelers - 1) })}>
                                    <Ionicons name="remove" size={24} color={colors.text} />
                                </TouchableOpacity>
                                <Text style={[styles.counterText, { color: colors.text }]}>{formData.travelers}</Text>
                                <TouchableOpacity style={[styles.counterBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setFormData({ ...formData, travelers: formData.travelers + 1 })}>
                                    <Ionicons name="add" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Travel Style</Text>
                            <View style={styles.chipGrid}>
                                {TRAVEL_STYLES.map(style => (
                                    <TouchableOpacity 
                                        key={style} 
                                        style={[styles.chip, { backgroundColor: formData.style === style ? colors.primary : colors.card, borderColor: formData.style === style ? colors.primary : colors.border }]}
                                        onPress={() => setFormData({ ...formData, style: style as any })}
                                    >
                                        <Text style={{ color: formData.style === style ? '#fff' : colors.text, fontWeight: '600' }}>{style}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.aiNotice}>
                            <Ionicons name="sparkles" size={20} color="#6B4EFF" />
                            <Text style={[styles.aiNoticeText, { color: colors.textSecondary }]}>Your style affects daily pace, activities, and dining recommendations.</Text>
                        </View>
                    </View>
                )}

                {step === 3 && (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>Accommodation</Text>
                        <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>Where do you prefer to stay?</Text>

                        <View style={styles.inputGroup}>
                            <View style={styles.chipGrid}>
                                {ACCOMMODATIONS.map(acc => (
                                    <TouchableOpacity 
                                        key={acc} 
                                        style={[styles.chip, { backgroundColor: formData.accommodation === acc ? '#4ECDC4' : colors.card, borderColor: formData.accommodation === acc ? '#4ECDC4' : colors.border }]}
                                        onPress={() => setFormData({ ...formData, accommodation: acc as any })}
                                    >
                                        <Text style={{ color: formData.accommodation === acc ? '#fff' : colors.text, fontWeight: '600' }}>{acc}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.aiNotice}>
                            <Ionicons name="home" size={20} color="#4ECDC4" />
                            <Text style={[styles.aiNoticeText, { color: colors.textSecondary }]}>This informs the AI to pick the right areas and impacts your budget prediction.</Text>
                        </View>
                    </View>
                )}

                {step === 4 && (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>Smart Budget</Text>
                        <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>We've estimated a budget based on your choices.</Text>

                        <View style={[styles.budgetBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.budgetLabel, { color: colors.textSecondary }]}>Total Estimated Budget (₹)</Text>
                            <TextInput 
                                style={[styles.budgetInput, { color: colors.text }]}
                                keyboardType="numeric"
                                value={formData.budget.toString()}
                                onChangeText={t => setFormData({ ...formData, budget: parseInt(t.replace(/[^0-9]/g, '')) || 0 })}
                            />
                            <View style={styles.budgetBreakdown}>
                                <View style={styles.budgetPart}><View style={[styles.budgetDot, { backgroundColor: '#FF4B4B' }]} /><Text style={{ color: colors.textSecondary, fontSize: 12 }}>Stay</Text></View>
                                <View style={styles.budgetPart}><View style={[styles.budgetDot, { backgroundColor: '#4ECDC4' }]} /><Text style={{ color: colors.textSecondary, fontSize: 12 }}>Food</Text></View>
                                <View style={styles.budgetPart}><View style={[styles.budgetDot, { backgroundColor: '#6B4EFF' }]} /><Text style={{ color: colors.textSecondary, fontSize: 12 }}>Travel & Acts</Text></View>
                            </View>
                        </View>

                        <View style={styles.aiNotice}>
                            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                            <Text style={[styles.aiNoticeText, { color: colors.textSecondary }]}>Smart Features enabled: Weather aware, traffic optimized, crowd intelligent.</Text>
                        </View>
                    </View>
                )}
            </Animated.ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity style={styles.footerBtn} onPress={handleNext}>
                    <LinearGradient colors={['#6B4EFF', '#FF4B4B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnGradient}>
                        <Text style={styles.btnText}>{step === TOTAL_STEPS ? 'Generate Magic' : 'Continue'}</Text>
                        <Ionicons name={step === TOTAL_STEPS ? "sparkles" : "arrow-forward"} size={20} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, borderBottomWidth: 1 },
    backBtn: { padding: 8, marginRight: 10 },
    headerTextContainer: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
    stepIndicatorContainer: { flexDirection: 'row', gap: 6 },
    stepDot: { width: 24, height: 4, borderRadius: 2 },
    scrollContainer: { flex: 1, padding: 24 },
    stepContainer: { flex: 1 },
    stepTitle: { fontSize: 28, fontWeight: '900', marginBottom: 8 },
    stepDesc: { fontSize: 16, marginBottom: 30 },
    inputGroup: { marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { padding: 16, borderRadius: 16, borderWidth: 1, fontSize: 16 },
    dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1 },
    dropdownMenu: { marginTop: 8, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    dropdownItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    row: { flexDirection: 'row', gap: 15 },
    halfInput: { flex: 1 },
    counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: 16, borderWidth: 1 },
    counterBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
    counterText: { fontSize: 24, fontWeight: '800' },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, borderWidth: 1 },
    aiNotice: { flexDirection: 'row', gap: 12, backgroundColor: 'rgba(107,78,255,0.05)', padding: 16, borderRadius: 16, marginTop: 10, alignItems: 'center' },
    aiNoticeText: { flex: 1, fontSize: 13, lineHeight: 20 },
    budgetBox: { padding: 24, borderRadius: 24, borderWidth: 1, alignItems: 'center' },
    budgetLabel: { fontSize: 14, fontWeight: '700', marginBottom: 15, textTransform: 'uppercase' },
    budgetInput: { fontSize: 40, fontWeight: '900', textAlign: 'center', marginBottom: 20, width: '100%' },
    budgetBreakdown: { flexDirection: 'row', gap: 15, justifyContent: 'center' },
    budgetPart: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    budgetDot: { width: 10, height: 10, borderRadius: 5 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderTopWidth: 1 },
    footerBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: '#6B4EFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
    btnGradient: { flexDirection: 'row', padding: 18, justifyContent: 'center', alignItems: 'center', gap: 10 },
    btnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    loaderCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }
});