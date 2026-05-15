import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/themecontext';

// Real festival data for 2026
const FESTIVALS_2026 = [
  // January 2026
  { id: '1', name: 'Pongal', month: 'January', date: 'Jan 14-17, 2026', icon: '🌾', desc: 'Harvest Festival - 4 days of celebration with Bhogi, Pongal, Mattu Pongal, and Kaanum Pongal', type: 'Harvest', region: 'Tamil Nadu' },
  { id: '2', name: 'Thai Poosam', month: 'January', date: 'Jan 28, 2026', icon: '⚔️', desc: 'Devotional festival at Murugan temples, celebrated with grand processions', type: 'Religious', region: 'Tamil Nadu' },
  
  // February 2026
  { id: '3', name: 'Maha Shivaratri', month: 'February', date: 'Feb 15, 2026', icon: '🕉️', desc: 'Great Night of Shiva - All-night vigil at temples across Tamil Nadu', type: 'Religious', region: 'Tamil Nadu' },
  { id: '4', name: 'Natyanjali', month: 'February', date: 'Feb 20-24, 2026', icon: '💃', desc: 'Dance Festival at Chidambaram Nataraja Temple - Classical dancers from across India perform', type: 'Cultural', region: 'Chidambaram' },
  
  // March 2026
  { id: '5', name: 'Panguni Uthiram', month: 'March', date: 'Mar 13, 2026', icon: '🚗', desc: 'Celestial wedding festival celebrated at Murugan and Shiva temples', type: 'Religious', region: 'Tamil Nadu' },
  
  // April 2026
  { id: '6', name: 'Tamil New Year', month: 'April', date: 'Apr 14, 2026', icon: '🎉', desc: 'Puthandu - Tamil New Year celebration with traditional food and kolams', type: 'Cultural', region: 'Tamil Nadu' },
  { id: '7', name: 'Chithirai Festival', month: 'April', date: 'Apr 20-28, 2026', icon: '🏛️', desc: 'Grand festival at Madurai Meenakshi Temple - Celestial wedding of Meenakshi and Sundareswarar', type: 'Temple', region: 'Madurai' },
  
  // May 2026
  { id: '8', name: 'Vaikasi Visakam', month: 'May', date: 'May 18, 2026', icon: '🔱', desc: 'Birth anniversary of Lord Murugan, celebrated at all Murugan temples', type: 'Religious', region: 'Tamil Nadu' },
  
  // June 2026
  { id: '9', name: 'Aani Thirumanjanam', month: 'June', date: 'Jun 20, 2026', icon: '💧', desc: 'Sacred bath festival at Thiruvannamalai and other Shiva temples', type: 'Religious', region: 'Thiruvannamalai' },
  
  // July 2026
  { id: '10', name: 'Aadi Perukku', month: 'July', date: 'Jul 28, 2026', icon: '🌊', desc: 'Monsoon festival celebrated along riverbanks, especially in Kaveri', type: 'Harvest', region: 'Tamil Nadu' },
  { id: '11', name: 'Aadi Pooram', month: 'July', date: 'Jul 31, 2026', icon: '👑', desc: 'Celebration of goddess Andal at Srivilliputhur and Meenakshi Amman Temple', type: 'Religious', region: 'Madurai, Srivilliputhur' },
  
  // August 2026
  { id: '12', name: 'Varalakshmi Vratham', month: 'August', date: 'Aug 7, 2026', icon: '💎', desc: 'Festival dedicated to Goddess Lakshmi, observed by married women', type: 'Religious', region: 'Tamil Nadu' },
  { id: '13', name: 'Avani Avittam', month: 'August', date: 'Aug 17, 2026', icon: '🔔', desc: 'Sacred thread changing ceremony for Brahmins', type: 'Religious', region: 'Tamil Nadu' },
  { id: '14', name: 'Vinayaka Chaturthi', month: 'August', date: 'Aug 27, 2026', icon: '🐘', desc: 'Ganesh Chaturthi celebrations with elaborate decorations', type: 'Religious', region: 'Tamil Nadu' },
  
  // September 2026
  { id: '15', name: 'Navaratri', month: 'September', date: 'Sep 22 - Oct 2, 2026', icon: '🪔', desc: '9 nights of dance, devotion, and celebration - Golu displays across homes', type: 'Festival', region: 'Tamil Nadu' },
  { id: '16', name: 'Ayudha Pooja', month: 'September', date: 'Sep 30, 2026', icon: '🔧', desc: 'Worship of tools, vehicles, and instruments', type: 'Religious', region: 'Tamil Nadu' },
  { id: '17', name: 'Vijayadashami', month: 'September', date: 'Oct 1, 2026', icon: '🏹', desc: 'Celebration of victory of good over evil, start of education for children', type: 'Cultural', region: 'Tamil Nadu' },
  
  // October 2026
  { id: '18', name: 'Saraswati Pooja', month: 'October', date: 'Oct 1, 2026', icon: '📚', desc: 'Worship of Goddess Saraswati - Books and musical instruments are worshipped', type: 'Religious', region: 'Tamil Nadu' },
  { id: '19', name: 'Deepavali', month: 'October', date: 'Oct 20, 2026', icon: '🪔', desc: 'Festival of Lights - Firecrackers, new clothes, and sweets', type: 'Festival', region: 'Tamil Nadu' },
  { id: '20', name: 'Soora Samharam', month: 'October', date: 'Oct 26, 2026', icon: '⚔️', desc: 'Celebration of Lord Murugan\'s victory over demon Soorapadman', type: 'Religious', region: 'Tamil Nadu' },
  
  // November 2026
  { id: '21', name: 'Karthigai Deepam', month: 'November', date: 'Nov 30, 2026', icon: '🔥', desc: 'Festival of lamps - The great lamp is lit on Thiruvannamalai hill', type: 'Festival', region: 'Thiruvannamalai' },
  
  // December 2026
  { id: '22', name: 'Arudra Darisanam', month: 'December', date: 'Dec 15, 2026', icon: '💃', desc: 'Festival of Lord Nataraja at Chidambaram temple', type: 'Religious', region: 'Chidambaram' },
  { id: '23', name: 'Margazhi Music Season', month: 'December', date: 'Dec 15 - Jan 15, 2027', icon: '🎵', desc: 'Chennai Music Season - Carnatic music and dance performances', type: 'Cultural', region: 'Chennai' },
  { id: '24', name: 'Christmas', month: 'December', date: 'Dec 25, 2026', icon: '🎄', desc: 'Christmas celebrations in churches across Tamil Nadu', type: 'Religious', region: 'Tamil Nadu' },
];

// Current month detection
const getCurrentMonth = (): string => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const now = new Date();
  return monthNames[now.getMonth()];
};

// Check if a date is upcoming
const isUpcoming = (dateStr: string): boolean => {
  try {
    const date = new Date(dateStr.replace(/[a-zA-Z]/g, '').trim());
    const today = new Date();
    return date >= today;
  } catch {
    return true;
  }
};

export default function FestivalsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [festivals] = useState(FESTIVALS_2026);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);

  const months = ['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const types = ['All', 'Harvest', 'Religious', 'Cultural', 'Temple', 'Festival'];
  const currentMonth = getCurrentMonth();

  const filteredFestivals = festivals.filter(festival => {
    const monthMatch = selectedMonth === 'All' || festival.month === selectedMonth;
    const typeMatch = selectedType === 'All' || festival.type === selectedType;
    const upcomingMatch = !showUpcomingOnly || isUpcoming(festival.date);
    return monthMatch && typeMatch && upcomingMatch;
  });

  const upcomingFestivals = festivals.filter(f => isUpcoming(f.date)).length;
  const currentMonthFestivals = festivals.filter(f => f.month === currentMonth).length;

  const styles = getStyles(colors);

  const handleFestivalPress = (festival: typeof FESTIVALS_2026[0]) => {
    Alert.alert(
      festival.name,
      `${festival.desc}\n\n📅 Date: ${festival.date}\n🎭 Type: ${festival.type}\n📍 Region: ${festival.region}\n\nJoin the celebrations!`,
      [{ text: 'OK' }]
    );
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Festivals & Culture 2026',
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
      }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Year Header */}
        <View style={[styles.yearHeader, { backgroundColor: colors.primary }]}>
          <Text style={styles.yearHeaderTitle}>Tamil Nadu Festivals</Text>
          <Text style={styles.yearHeaderYear}>2026 Calendar</Text>
          <Text style={styles.yearHeaderSubtitle}>Experience the rich cultural heritage</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{festivals.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Festivals</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{upcomingFestivals}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Upcoming</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{currentMonthFestivals}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This Month</Text>
          </View>
        </View>

        {/* Current Month Highlight */}
        <View style={[styles.currentMonthCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.currentMonthTitle, { color: colors.text }]}>📅 This Month: {currentMonth} 2026</Text>
          <Text style={[styles.currentMonthEvents, { color: colors.textSecondary }]}>
            {currentMonthFestivals} festival{currentMonthFestivals !== 1 ? 's' : ''} happening this month
          </Text>
          {currentMonthFestivals > 0 && (
            <TouchableOpacity 
              style={[styles.viewMonthButton, { borderColor: colors.primary }]}
              onPress={() => setSelectedMonth(currentMonth)}
            >
              <Text style={[styles.viewMonthText, { color: colors.primary }]}>View This Month</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Upcoming Toggle */}
        <TouchableOpacity
          style={[styles.upcomingToggle, { backgroundColor: colors.card }]}
          onPress={() => setShowUpcomingOnly(!showUpcomingOnly)}
        >
          <Ionicons 
            name={showUpcomingOnly ? 'checkbox' : 'square-outline'} 
            size={20} 
            color={colors.primary} 
          />
          <Text style={[styles.upcomingToggleText, { color: colors.text }]}>Show only upcoming festivals</Text>
        </TouchableOpacity>

        {/* Filters */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Filter by Month</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {months.map((month) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.filterChip,
                  selectedMonth === month && [styles.activeChip, { backgroundColor: colors.primary }],
                  { borderColor: colors.border }
                ]}
                onPress={() => setSelectedMonth(month)}
              >
                <Text style={[
                  styles.filterText,
                  selectedMonth === month && { color: '#fff' },
                  { color: colors.text }
                ]}>
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Filter by Type</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {types.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  selectedType === type && [styles.activeChip, { backgroundColor: colors.primary }],
                  { borderColor: colors.border }
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[
                  styles.filterText,
                  selectedType === type && { color: '#fff' },
                  { color: colors.text }
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results Count */}
        <View style={styles.resultHeader}>
          <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
            {filteredFestivals.length} festival{filteredFestivals.length !== 1 ? 's' : ''} found
          </Text>
          {(selectedMonth !== 'All' || selectedType !== 'All' || showUpcomingOnly) && (
            <TouchableOpacity onPress={() => {
              setSelectedMonth('All');
              setSelectedType('All');
              setShowUpcomingOnly(false);
            }}>
              <Text style={[styles.clearFilter, { color: colors.primary }]}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Festivals List */}
        <FlatList
          data={filteredFestivals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card }]}
              onPress={() => handleFestivalPress(item)}
              activeOpacity={0.8}
            >
              <View style={[styles.cardIcon, { backgroundColor: colors.primary + '10' }]}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{item.name}</Text>
                  {isUpcoming(item.date) && (
                    <View style={[styles.upcomingBadge, { backgroundColor: '#10B98120' }]}>
                      <Text style={[styles.upcomingBadgeText, { color: '#10B981' }]}>Live soon</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item.desc}
                </Text>
                <View style={styles.cardFooter}>
                  <View style={styles.cardDate}>
                    <Ionicons name="calendar-outline" size={12} color={colors.primary} />
                    <Text style={[styles.cardDateText, { color: colors.primary }]}>{item.date}</Text>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: colors.primary + '10' }]}>
                    <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{item.type?.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.regionRow}>
                    <Ionicons name="location-outline" size={10} color={colors.textLight} />
                    <Text style={[styles.cardRegion, { color: colors.textLight }]}>{item.region}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        <View style={styles.footerNote}>
          <Text style={[styles.footerText, { color: colors.textLight }]}>
            Dates are subject to change based on lunar calendar
          </Text>
          <Text style={[styles.footerText, { color: colors.textLight }]}>
            All festivals are celebrated across Tamil Nadu
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  yearHeader: {
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  yearHeaderTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  yearHeaderYear: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  yearHeaderSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  currentMonthCard: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentMonthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  currentMonthEvents: {
    fontSize: 14,
    marginBottom: 12,
  },
  viewMonthButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  viewMonthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  upcomingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upcomingToggleText: {
    fontSize: 14,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 8,
  },
  activeChip: {
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  resultCount: {
    fontSize: 13,
  },
  clearFilter: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  upcomingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  upcomingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardDesc: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardDateText: {
    fontSize: 12,
    fontWeight: '700',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardRegion: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerNote: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
  },
});