import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/themecontext';

export default function TripSuccessScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { tripId, destination, startDate, endDate, budget } = useLocalSearchParams<{
        tripId: string;
        destination: string;
        startDate: string;
        endDate: string;
        budget: string;
    }>();

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const formatDateRange = (start?: string, end?: string) => {
        if (!start || !end) return '';
        try {
            const d1 = new Date(start);
            const d2 = new Date(end);
            return `${d1.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${d2.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } catch(e) {
            return '';
        }
    };

    const targetBudget = budget ? parseInt(budget, 10) : 0;

    const styles = getStyles(colors);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
            
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                
                <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
                    <LinearGradient
                        colors={['#6B4EFF', '#4ECDC4']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconCircle}
                    >
                        <Ionicons name="checkmark-sharp" size={60} color="#fff" />
                    </LinearGradient>
                </Animated.View>

                <Text style={[styles.title, { color: colors.text }]}>Trip Created Successfully!</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your adventure awaits. Everything is set up and ready to go.</Text>

                <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.summaryItem}>
                        <View style={[styles.summaryIconBox, { backgroundColor: 'rgba(107, 78, 255, 0.1)' }]}>
                            <Ionicons name="location" size={20} color="#6B4EFF" />
                        </View>
                        <View style={styles.summaryTextContainer}>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Destination</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]} numberOfLines={1}>{destination || 'Unknown'}</Text>
                        </View>
                    </View>

                    {startDate && endDate && (
                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIconBox, { backgroundColor: 'rgba(78, 205, 196, 0.1)' }]}>
                                <Ionicons name="calendar" size={20} color="#4ECDC4" />
                            </View>
                            <View style={styles.summaryTextContainer}>
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Travel Dates</Text>
                                <Text style={[styles.summaryValue, { color: colors.text }]}>{formatDateRange(startDate, endDate)}</Text>
                            </View>
                        </View>
                    )}

                    {targetBudget > 0 && (
                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIconBox, { backgroundColor: 'rgba(255, 179, 71, 0.1)' }]}>
                                <Ionicons name="wallet" size={20} color="#FFB347" />
                            </View>
                            <View style={styles.summaryTextContainer}>
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Planned Budget</Text>
                                <Text style={[styles.summaryValue, { color: colors.text }]}>₹{targetBudget.toLocaleString()}</Text>
                            </View>
                        </View>
                    )}
                </View>

            </Animated.View>

            <Animated.View style={[styles.footer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <TouchableOpacity 
                    style={styles.viewTripBtn}
                    onPress={() => {
                        // Go back to the trip details / itinerary
                        router.back();
                    }}
                >
                    <LinearGradient
                        colors={['#6B4EFF', '#FF4B4B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.btnInner}
                    >
                        <Text style={styles.btnTextPrimary}>View Trip Itinerary</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.homeBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                    onPress={() => {
                        router.replace('/(tabs)');
                    }}
                >
                    <Text style={[styles.btnTextSecondary, { color: colors.text }]}>Back to Home</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -40,
    },
    iconContainer: {
        marginBottom: 35,
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 30,
        fontWeight: '900',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 10,
        marginBottom: 40,
        lineHeight: 24,
    },
    summaryCard: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        gap: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    summaryIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryTextContainer: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryValue: {
        fontSize: 17,
        fontWeight: '800',
    },
    footer: {
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
        gap: 15,
    },
    viewTripBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#6B4EFF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    btnInner: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnTextPrimary: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    homeBtn: {
        paddingVertical: 18,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnTextSecondary: {
        fontSize: 16,
        fontWeight: '700',
    },
});
