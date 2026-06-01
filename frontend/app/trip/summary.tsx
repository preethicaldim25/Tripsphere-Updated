import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Alert,
    Platform
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { tripsAPI, Trip, Activity, Category } from '../../services/api';

const { width } = Dimensions.get('window');

export default function BudgetSummaryScreen() {
    const router = useRouter();
    const { id, tripId } = useLocalSearchParams<{ id: string; tripId: string }>();
    const effectiveId = id || tripId;

    const [trip, setTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchTripData = async () => {
            if (!effectiveId) return;
            try {
                setLoading(true);
                const data = await tripsAPI.getById(effectiveId);
                setTrip(data);
            } catch (error) {
                console.error('Error fetching trip summary:', error);
                Alert.alert('Error', 'Failed to load trip summary');
            } finally {
                setLoading(false);
            }
        };
        fetchTripData();
    }, [effectiveId]);

    // Derived data calculations
    const calculateDerivedData = () => {
        if (!trip) return null;

        const itinerary = trip.itinerary || [];
        const allActivities = itinerary.flatMap(day => day.activities);
        
        const totalSpent = allActivities.reduce((sum, act) => sum + (act.cost || 0), 0);
        const plannedBudget = trip.total_budget || trip.budget || 0;
        
        // Category breakdown
        const categoryMap: Record<string, { spent: number; color: string }> = {
            food: { spent: 0, color: '#FF6B6B' },
            sightseeing: { spent: 0, color: '#4ECDC4' },
            travel: { spent: 0, color: '#6B4EFF' },
            accommodation: { spent: 0, color: '#FFB347' },
            other: { spent: 0, color: '#999' },
        };

        allActivities.forEach(act => {
            const cat = act.category || 'other';
            if (categoryMap[cat]) {
                categoryMap[cat].spent += (act.cost || 0);
            } else {
                categoryMap.other.spent += (act.cost || 0);
            }
        });

        // Daily breakdown
        const dailySpending = itinerary.map(day => ({
            day: day.day,
            date: new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            spent: day.activities.reduce((sum, act) => sum + (act.cost || 0), 0)
        }));

        const categories = Object.entries(categoryMap).map(([name, data]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            budget: 0, // In this app, we don't have per-category budget yet, so we compare to total or 0
            spent: data.spent,
            color: data.color
        })).filter(c => c.spent > 0);

        const start = new Date(trip.start_date);
        const end = new Date(trip.end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        return {
            name: trip.title || trip.name,
            destination: trip.destination_name || trip.destination,
            totalBudget: plannedBudget,
            spent: totalSpent,
            remaining: plannedBudget - totalSpent,
            days: days,
            categories,
            daily: dailySpending
        };
    };

    const tripMetrics = calculateDerivedData();

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>Loading summary...</Text>
            </View>
        );
    }

    if (!tripMetrics) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>No trip data found</Text>
            </View>
        );
    }

    const spentPercentage = tripMetrics.totalBudget > 0 
        ? (tripMetrics.spent / tripMetrics.totalBudget) * 100 
        : 100;
    const remainingPercentage = 100 - spentPercentage;

    const handleExport = async () => {
        if (!tripMetrics) return;
        try {
            // 1. Prepare data for Excel
            const summaryData = [
                { 'Trip Details': 'Name', 'Value': tripMetrics.name },
                { 'Trip Details': 'Destination', 'Value': tripMetrics.destination },
                { 'Trip Details': 'Planned Budget', 'Value': tripMetrics.totalBudget },
                { 'Trip Details': 'Total Spent', 'Value': tripMetrics.spent },
                { 'Trip Details': 'Remaining', 'Value': tripMetrics.remaining },
                { 'Trip Details': 'Duration (Days)', 'Value': tripMetrics.days },
            ];

            const categoryData = tripMetrics.categories.map(cat => ({
                'Category': cat.name,
                'Budget Used': cat.spent,
            }));

            const dailyData = tripMetrics.daily.map(day => ({
                'Day': day.day,
                'Date': day.date,
                'Amount Spent': day.spent,
            }));

            // 2. Create workbook and worksheets
            const wb = XLSX.utils.book_new();
            
            const wsSummary = XLSX.utils.json_to_sheet(summaryData);
            const wsCategories = XLSX.utils.json_to_sheet(categoryData);
            const wsDaily = XLSX.utils.json_to_sheet(dailyData);

            XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
            XLSX.utils.book_append_sheet(wb, wsCategories, "Categories");
            XLSX.utils.book_append_sheet(wb, wsDaily, "Daily Spending");

            // 3. Generate file content (Base64 for React Native)
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            
            // 4. Determine file path and save
            const fileName = `${tripMetrics.name.replace(/\s+/g, '_')}_Budget_Summary.xlsx`;
            let fileUri = '';

            if (Platform.OS === 'web') {
                 // For Web - Use a simple Blob download
                 const binaryString = window.atob(wbout);
                 const len = binaryString.length;
                 const bytes = new Uint8Array(len);
                 for (let i = 0; i < len; i++) {
                     bytes[i] = binaryString.charCodeAt(i);
                 }
                 const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                 
                 const url = window.URL.createObjectURL(blob);
                 const a = document.createElement('a');
                 a.href = url;
                 a.download = fileName;
                 document.body.appendChild(a);
                 a.click();
                 a.remove();
                 window.URL.revokeObjectURL(url);
                 return;
            } else {
                 // For Mobile (iOS/Android)
                 // @ts-ignore: documentDirectory exists at runtime
                 fileUri = FileSystem.documentDirectory + fileName;
                 await FileSystem.writeAsStringAsync(fileUri, wbout, {
                     // @ts-ignore: EncodingType exists at runtime
                     encoding: FileSystem.EncodingType.Base64
                 });
     
                 // 5. Share the file
                 const canShare = await Sharing.isAvailableAsync();
                 if (canShare) {
                     await Sharing.shareAsync(fileUri, {
                         mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                         dialogTitle: 'Export Budget Summary',
                     });
                 } else {
                     Alert.alert('Error', 'Sharing is not available on this device');
                 }
            }
        } catch (error) {
            console.error('Export error calculation:', error);
            if (Platform.OS !== 'web') {
                 Alert.alert('Error', 'Failed to export summary');
            } else {
                 window.alert('Failed to export summary');
            }
        }
    };
    return (
        <>
            <Stack.Screen options={{
                headerShown: false,
            }} />

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

            <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: 80, paddingBottom: 40 }}>
                {/* Header Card */}
                <View style={styles.headerCard}>
                    <Text style={styles.headerTitle}>{tripMetrics.name}</Text>
                    <Text style={styles.headerSubtitle}>{tripMetrics.destination}</Text>

                    <View style={styles.totalBudgetContainer}>
                        <Text style={styles.totalBudgetLabel}>Planned Budget</Text>
                        <Text style={styles.totalBudgetAmount}>₹{tripMetrics.totalBudget}</Text>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { 
                                        width: `${Math.min(spentPercentage, 100)}%`, 
                                        backgroundColor: spentPercentage > 100 ? '#FF6B6B' : '#6B4EFF' 
                                    }
                                ]}
                            />
                        </View>
                        <View style={styles.progressLabels}>
                            <Text style={styles.progressLabel}>Total Spent: ₹{tripMetrics.spent}</Text>
                            <Text style={styles.progressLabel}>Remaining: ₹{tripMetrics.remaining}</Text>
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{tripMetrics.days}</Text>
                            <Text style={styles.statLabel}>Days</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>₹{tripMetrics.days > 0 ? Math.round(tripMetrics.spent / tripMetrics.days) : 0}</Text>
                            <Text style={styles.statLabel}>Avg spent/day</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{Math.round(spentPercentage)}%</Text>
                            <Text style={styles.statLabel}>Budget Used</Text>
                        </View>
                    </View>
                </View>

                {/* Category Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Spending by Category</Text>
                    {tripMetrics.categories.length > 0 ? tripMetrics.categories.map((cat, index) => {
                        const percentageOfTotal = (tripMetrics.spent > 0) ? (cat.spent / tripMetrics.spent) * 100 : 0;
                        return (
                            <View key={index} style={styles.categoryItem}>
                                <View style={styles.categoryHeader}>
                                    <View style={styles.categoryTitleContainer}>
                                        <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                                        <Text style={styles.categoryName}>{cat.name}</Text>
                                    </View>
                                    <Text style={styles.categoryAmount}>
                                        ₹{cat.spent}
                                    </Text>
                                </View>
                                <View style={styles.categoryProgress}>
                                    <View
                                        style={[
                                            styles.categoryProgressFill,
                                            {
                                                width: `${percentageOfTotal}%`,
                                                backgroundColor: cat.color
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.categoryPercentage}>{Math.round(percentageOfTotal)}% of total spent</Text>
                            </View>
                        );
                    }) : (
                        <Text style={{ textAlign: 'center', color: '#999', marginVertical: 10 }}>No activities added yet</Text>
                    )}
                </View>

                {/* Daily Spending */}
                {tripMetrics.daily.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Daily Spending</Text>
                        <View style={styles.chartContainer}>
                            {tripMetrics.daily.map((day, index) => {
                                const maxSpent = Math.max(...tripMetrics.daily.map(d => d.spent), 1);
                                const height = (day.spent / maxSpent) * 150;
                                return (
                                    <View key={index} style={styles.barContainer}>
                                        <View style={[styles.bar, { height }]}>
                                            <View style={styles.barFill} />
                                        </View>
                                        <Text style={styles.barLabel}>Day {day.day}</Text>
                                        <Text style={styles.barValue}>₹{day.spent}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Tips Section */}
                <View style={styles.tipsSection}>
                    <Ionicons name="bulb-outline" size={24} color="#FFB347" />
                    <Text style={styles.tipsTitle}>Budget Insights</Text>
                    {spentPercentage > 100 ? (
                        <Text style={styles.tipsText}>
                            You have exceeded your planned budget by ₹{Math.abs(tripMetrics.remaining)}.
                            Try to optimize travel or food costs for any remaining activities.
                        </Text>
                    ) : spentPercentage > 80 ? (
                        <Text style={styles.tipsText}>
                            You've used {Math.round(spentPercentage)}% of your budget.
                            You have ₹{tripMetrics.remaining} left to spend.
                        </Text>
                    ) : (
                        <Text style={styles.tipsText}>
                            You are doing great! You have ₹{tripMetrics.remaining} remaining
                            from your initial budget of ₹{tripMetrics.totalBudget}.
                        </Text>
                    )}
                </View>

                {/* Export Button */}
                <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                    <Ionicons name="download-outline" size={20} color="#fff" />
                    <Text style={styles.exportButtonText}>Export Summary</Text>
                </TouchableOpacity>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F3FF',
        alignSelf: 'center',
        width: '100%',
        maxWidth: 480,
    },
    headerCard: {
        backgroundColor: 'white',
        margin: 16,
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B4EFF',
        marginTop: 2,
        marginBottom: 16,
    },
    totalBudgetContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    totalBudgetLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    totalBudgetAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#333',
    },
    progressContainer: {
        marginBottom: 20,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    progressLabel: {
        fontSize: 12,
        color: '#666',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    statBox: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    section: {
        backgroundColor: 'white',
        margin: 16,
        marginTop: 0,
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    categoryItem: {
        marginBottom: 16,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    categoryTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    categoryDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    categoryName: {
        fontSize: 14,
        color: '#333',
    },
    categoryAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    categoryProgress: {
        height: 4,
        backgroundColor: '#F0F0F0',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 4,
    },
    categoryProgressFill: {
        height: '100%',
        borderRadius: 2,
    },
    categoryPercentage: {
        fontSize: 11,
        color: '#999',
        textAlign: 'right',
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 200,
    },
    barContainer: {
        alignItems: 'center',
        width: (width - 80) / 5,
    },
    bar: {
        width: 30,
        backgroundColor: '#F3F0FF',
        borderRadius: 15,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: '#6B4EFF',
        borderRadius: 15,
    },
    barLabel: {
        fontSize: 11,
        color: '#666',
        marginTop: 6,
    },
    barValue: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
    tipsSection: {
        backgroundColor: '#FFF9E6',
        margin: 16,
        marginTop: 0,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
        marginBottom: 4,
    },
    tipsText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    exportButton: {
        backgroundColor: '#6B4EFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    exportButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
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
});