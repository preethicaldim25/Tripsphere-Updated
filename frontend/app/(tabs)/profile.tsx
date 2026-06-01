import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { tripsAPI, authAPI, Trip, Destination } from '../../services/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/themecontext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtBudget = (n: number) =>
  n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`;

// ─── Component ────────────────────────────────────────────────────────────────
// Preset avatars representing minimal clean travel-themed icons
const AVATAR_PRESETS = [
  { id: 'compass', icon: 'compass-outline', label: 'Navigator', color: '#7C5CFF', bg: 'rgba(124,92,255,0.1)' },
  { id: 'airplane', icon: 'airplane-outline', label: 'Jetsetter', color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
  { id: 'leaf', icon: 'leaf-outline', label: 'Nature', color: '#4ADE80', bg: 'rgba(74,222,128,0.1)' },
  { id: 'business', icon: 'business-outline', label: 'Landmark', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
  { id: 'map', icon: 'map-outline', label: 'Explorer', color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
];

export default function ProfileScreen() {
  const { user, logout, isAuthenticated, updateProfile } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();

  const [loading,       setLoading]      = useState(false);
  const [saving,        setSaving]       = useState(false);
  const [trips,         setTrips]        = useState<Trip[]>([]);
  const [savedPlaces,   setSavedPlaces]  = useState<Destination[]>([]);
  const [loadingData,   setLoadingData]  = useState(false);
  const [activeModal,   setActiveModal]  = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const s = getStyles(colors);
const [selectedLang, setSelectedLang] = useState('English');
  const [editName,      setEditName]     = useState(user?.name  || '');
  const [editEmail,     setEditEmail]    = useState(user?.email || '');
  const [editLocation,  setEditLocation] = useState(user?.location || '');
  const [editTagline,   setEditTagline]  = useState(user?.tagline || '');
  const [editAvatar,    setEditAvatar]   = useState(user?.profile_image || '');

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditLocation(user.location || '');
      setEditTagline(user.tagline || '');
      setEditAvatar(user.profile_image || '');
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) fetchUserData();
    }, [isAuthenticated])
  );

  const fetchUserData = async () => {
    try {
      setLoadingData(true);
      const tripsData = await tripsAPI.getAll();
      if (Array.isArray(tripsData)) setTrips(tripsData);
      try {
        const savedData = await authAPI.getSavedPlaces();
        if (Array.isArray(savedData)) setSavedPlaces(savedData);
      } catch (_) {}
    } catch (_) {}
    finally { setLoadingData(false); }
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      setLoading(true);
      try {
        await logout();
        setTrips([]); setSavedPlaces([]);
        router.replace('/auth/login');
      } catch (_) { Alert.alert('Error', 'Failed to logout'); }
      finally { setLoading(false); }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) doLogout();
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Full Name is required');
      return;
    }
    
    setSaving(true);
    try {
      const res = await updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        location: editLocation.trim(),
        tagline: editTagline.trim(),
        profile_image: editAvatar,
      });
      
      if (res.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        setActiveModal(null);
      } else {
        Alert.alert('Error', res.error || 'Failed to update profile');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An error occurred while saving profile');
    } finally {
      setSaving(false);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const completedTrips = trips.filter(
    t => t.status === 'completed' || (t.end_date && new Date(t.end_date) < new Date())
  ).length;

  const citiesVisited = Array.from(
    new Set(
      trips
        .map(t => t.destination_details?.district || t.destination_details?.name)
        .filter(Boolean)
    )
  ).length;

  const budgetSpent = trips.reduce((sum, t) => sum + (t.used_budget || t.budget || 0), 0);

  // ── Insights ───────────────────────────────────────────────────────────────
  let favDest = '—';
  if (trips.length > 0) {
    const dc: Record<string, number> = {};
    trips.forEach(t => {
      const n = t.destination_details?.name || t.name;
      if (n) dc[n] = (dc[n] || 0) + 1;
    });
    const sorted = Object.entries(dc).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0 && sorted[0][1] > 0) favDest = sorted[0][0];
  }

  let travelType = '—';
  if (trips.length > 0) {
    const avg = trips.reduce((s, t) => s + (t.travelers || 1), 0) / trips.length;
    travelType = avg === 1 ? 'Solo' : avg <= 4 ? 'Family' : 'Group';
  }

  let topCategory = '—';
  if (trips.length > 0) {
    const cc: Record<string, number> = {};
    trips.forEach(t => {
      const c = t.destination_details?.category;
      if (c) cc[c] = (cc[c] || 0) + 1;
    });
    const sorted = Object.entries(cc).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0 && sorted[0][1] > 0) topCategory = sorted[0][0];
  }

  // ── Achievements ───────────────────────────────────────────────────────────
  // 1. TN Explorer: Completed 10+ trips
  const tnExplorerUnlocked = completedTrips >= 10;

  // 2. Hill Lover: 5+ hill station visits
  const hillStationTrips = trips.filter(t =>
    t.destination_details?.category === 'Hill Station' ||
    ['ooty', 'kodaikanal', 'yercaud', 'coonoor', 'valparai', 'yelagiri', 'kolli', 'nilgiris'].some(kw =>
      t.destination_details?.name?.toLowerCase().includes(kw) ||
      t.name?.toLowerCase().includes(kw)
    )
  ).length;
  const hillLoverUnlocked = hillStationTrips >= 5;

  // 3. Temple Hopper: 15+ temple/spiritual visits
  const templeTrips = trips.filter(t =>
    t.destination_details?.category === 'Temple' ||
    t.destination_details?.category === 'Spiritual' ||
    ['temple', 'madurai', 'rameswaram', 'thanjavur', 'chidambaram', 'kanchipuram', 'srirangam', 'palani', 'mahabalipuram'].some(kw =>
      t.destination_details?.name?.toLowerCase().includes(kw) ||
      t.name?.toLowerCase().includes(kw)
    )
  ).length;
  const templeHopperUnlocked = templeTrips >= 15;

  // 4. Weekend Traveler: 5+ short trips (<= 3 days)
  const shortTrips = trips.filter(t => {
    if (!t.start_date || !t.end_date) return false;
    const diff = Math.ceil(Math.abs(new Date(t.end_date).getTime() - new Date(t.start_date).getTime()) / 86400000);
    return diff > 0 && diff <= 3;
  }).length;
  const weekendTravelerUnlocked = shortTrips >= 5;

  const achievements = [
    {
      id: 'tn_explorer',
      title: 'TN Explorer',
      desc: 'Complete 10+ trips across Tamil Nadu',
      hint: `Current progress: ${completedTrips}/10 trips completed`,
      icon: 'compass-outline' as const,
      mcIcon: null,
      unlocked: tnExplorerUnlocked,
    },
    {
      id: 'hill_lover',
      title: 'Hill Lover',
      desc: 'Visit 5+ hill stations in TN',
      hint: `Current progress: ${hillStationTrips}/5 hill station visits`,
      icon: 'leaf-outline' as const,
      mcIcon: null,
      unlocked: hillLoverUnlocked,
    },
    {
      id: 'temple_hopper',
      title: 'Temple Hopper',
      desc: 'Visit 15+ temples in Tamil Nadu',
      hint: `Current progress: ${templeTrips}/15 temple visits`,
      icon: 'business-outline' as const,
      mcIcon: null,
      unlocked: templeHopperUnlocked,
    },
    {
      id: 'weekend_traveler',
      title: 'Weekend Traveler',
      desc: 'Complete 5+ short trips (≤ 3 days)',
      hint: `Current progress: ${shortTrips}/5 short trips completed`,
      icon: 'calendar-outline' as const,
      mcIcon: null,
      unlocked: weekendTravelerUnlocked,
    },
  ];

  // ── Recent itineraries ─────────────────────────────────────────────────────
  const recentTrips = [...trips]
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
    .slice(0, 5);

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor="transparent" translucent />
        <ScrollView contentContainerStyle={s.guestScroll}>
          <View style={s.guestBox}>
            <View style={s.guestIconRing}>
              <Ionicons name="person-outline" size={36} color={colors.purple} />
            </View>
            <Text style={s.guestTitle}>Vannakkam!</Text>
            <Text style={s.guestSub}>
              Login to access your Tamil Nadu travel dashboard, stats, and achievements.
            </Text>
            <TouchableOpacity style={s.guestBtn} onPress={() => router.push('/auth/login')}>
              <Text style={s.guestBtnText}>Login to Your Account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={s.guestLink}>Don't have an account? Sign up</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.version}>Tripsphere v1.2.0</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const initials = user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'TN';

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── 1. Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerEyebrow}>Your Profile</Text>
            <Text style={s.headerTitle}>Dashboard</Text>
          </View>
          <TouchableOpacity style={s.settingsBtn} onPress={() => setActiveModal('settings')}>
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── 2. Profile Card ── */}
        <View style={s.profileCard}>
          <View style={s.avatarRing}>
            {user.profile_image && AVATAR_PRESETS.some(p => p.id === user.profile_image) ? (
              (() => {
                const preset = AVATAR_PRESETS.find(p => p.id === user.profile_image)!;
                return (
                  <View style={[s.avatar, { backgroundColor: preset.bg }]}>
                    <Ionicons name={preset.icon as any} size={26} color={preset.color} />
                  </View>
                );
              })()
            ) : (
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{user.name}</Text>
            <View style={s.profileLocRow}>
              <Ionicons name="location-outline" size={13} color={colors.purple} />
              <Text style={s.profileLoc}>{user.location || 'Tamil Nadu, India'}</Text>
            </View>
            <Text style={s.profileTagline} numberOfLines={2}>
              {user.tagline || "Explorer of Tamil Nadu's hidden wonders"}
            </Text>
          </View>
          <TouchableOpacity style={s.editBtn} onPress={() => setActiveModal('edit')}>
            <Ionicons name="create-outline" size={16} color={colors.purple} />
          </TouchableOpacity>
        </View>

        {/* ── 3. Stats ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Travel Stats</Text>
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: theme === 'light' ? 'rgba(107,78,255,0.08)' : 'rgba(183,156,255,0.12)' }]}>
                <Ionicons name="map-outline" size={18} color={colors.purple} />
              </View>
              <Text style={s.statNum}>{completedTrips}</Text>
              <Text style={s.statLabel}>Trips Done</Text>
            </View>
            <View style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: 'rgba(56,189,248,0.12)' }]}>
                <Ionicons name="business-outline" size={18} color="#38BDF8" />
              </View>
              <Text style={s.statNum}>{citiesVisited}</Text>
              <Text style={s.statLabel}>Cities</Text>
            </View>
            <View style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: 'rgba(74,222,128,0.12)' }]}>
                <Ionicons name="wallet-outline" size={18} color="#4ADE80" />
              </View>
              <Text style={s.statNum}>{fmtBudget(budgetSpent)}</Text>
              <Text style={s.statLabel}>Spent</Text>
            </View>
          </View>
        </View>

        {/* ── 4. Travel Insights ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Travel Insights</Text>
          <View style={s.insightsList}>
            <View style={s.insightRow}>
              <View style={s.insightLeft}>
                <View style={[s.insightIcon, { backgroundColor: 'rgba(251,191,36,0.1)' }]}>
                  <Ionicons name="star-outline" size={16} color="#FBBF24" />
                </View>
                <Text style={s.insightLabel}>Favourite Destination</Text>
              </View>
              <Text style={s.insightValue}>{favDest}</Text>
            </View>
            <View style={s.insightDivider} />
            <View style={s.insightRow}>
              <View style={s.insightLeft}>
                <View style={[s.insightIcon, { backgroundColor: theme === 'light' ? 'rgba(107,78,255,0.08)' : 'rgba(183,156,255,0.12)' }]}>
                  <Ionicons name="people-outline" size={16} color={colors.purple} />
                </View>
                <Text style={s.insightLabel}>Travel Style</Text>
              </View>
              <Text style={s.insightValue}>{travelType}</Text>
            </View>
            <View style={s.insightDivider} />
            <View style={s.insightRow}>
              <View style={s.insightLeft}>
                <View style={[s.insightIcon, { backgroundColor: 'rgba(56,189,248,0.1)' }]}>
                  <Ionicons name="layers-outline" size={16} color="#38BDF8" />
                </View>
                <Text style={s.insightLabel}>Top Category</Text>
              </View>
              <Text style={s.insightValue}>{topCategory}</Text>
            </View>
          </View>
        </View>

        {/* ── 5. Achievements ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Achievements</Text>
          <View style={s.achieveCard}>
            {achievements.map((a, idx) => (
              <View key={a.id}>
                <TouchableOpacity
                  style={s.achieveRow}
                  onPress={() => { setSelectedBadge(a); setActiveModal('badge'); }}
                  activeOpacity={0.75}
                >
                  <View style={[s.achieveIconCircle, a.unlocked ? s.achieveIconUnlocked : s.achieveIconLocked]}>
                    <Ionicons
                      name={a.icon}
                      size={18}
                      color={a.unlocked ? colors.purple : colors.textLight}
                    />
                  </View>
                  <View style={s.achieveText}>
                    <Text style={[s.achieveTitle, !a.unlocked && s.achieveTitleLocked]}>{a.title}</Text>
                    <Text style={s.achieveDesc}>{a.desc}</Text>
                  </View>
                  <View style={[s.achieveStatus, a.unlocked ? s.achieveStatusUnlocked : s.achieveStatusLocked]}>
                    <Text style={[s.achieveStatusText, a.unlocked ? s.achieveStatusTextUnlocked : s.achieveStatusTextLocked]}>
                      {a.unlocked ? 'Earned' : 'Locked'}
                    </Text>
                  </View>
                </TouchableOpacity>
                {idx < achievements.length - 1 && <View style={s.achieveDivider} />}
              </View>
            ))}
          </View>
          <Text style={s.achieveNote}>
            Achievements are earned based on real travel activity.
          </Text>
        </View>

        {/* ── 6. Recent Itineraries ── */}
        <View style={s.section}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>Recent Itineraries</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/trips' as any)}>
              <Text style={s.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>

          {loadingData ? (
            <View style={s.itinLoadingBox}>
              <ActivityIndicator size="small" color={colors.purple} />
            </View>
          ) : recentTrips.length > 0 ? (
            <View style={s.itinCard}>
              {recentTrips.map((trip, idx) => (
                <View key={trip.id || idx}>
                  <TouchableOpacity
                    style={s.itinRow}
                    onPress={() => router.push(`/trip/${trip._id || trip.id}` as any)}
                    activeOpacity={0.75}
                  >
                    <View style={s.itinIconWrap}>
                      <Ionicons name="map-outline" size={16} color={colors.purple} />
                    </View>
                    <View style={s.itinMeta}>
                      <Text style={s.itinName} numberOfLines={1}>{trip.name}</Text>
                      <Text style={s.itinDate}>{fmtDate(trip.start_date)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                  </TouchableOpacity>
                  {idx < recentTrips.length - 1 && <View style={s.itinDivider} />}
                </View>
              ))}
            </View>
          ) : (
            <View style={s.itinEmpty}>
              <Ionicons name="compass-outline" size={24} color={colors.textLight} />
              <Text style={s.itinEmptyText}>No trips yet</Text>
              <Text style={s.itinEmptySubText}>Start exploring Tamil Nadu</Text>
              <TouchableOpacity style={s.itinEmptyBtn} onPress={() => router.push('/plan-trip' as any)}>
                <Text style={s.itinEmptyBtnText}>Plan a Trip</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── 7. Account Actions ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Account</Text>
          <View style={s.actionCard}>
            <TouchableOpacity style={s.actionRow} onPress={() => setActiveModal('edit')}>
              <View style={s.actionLeft}>
                <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
                <Text style={s.actionText}>Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
            </TouchableOpacity>
            <View style={s.actionDivider} />
            <TouchableOpacity style={s.actionRow} onPress={() => setActiveModal('settings')}>
              <View style={s.actionLeft}>
                <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
                <Text style={s.actionText}>App Preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
            </TouchableOpacity>
            <View style={s.actionDivider} />
            <TouchableOpacity style={s.actionRow} onPress={() => setActiveModal('support')}>
              <View style={s.actionLeft}>
                <Ionicons name="help-circle-outline" size={18} color={colors.textSecondary} />
                <Text style={s.actionText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
            </TouchableOpacity>
            <View style={s.actionDivider} />
            <TouchableOpacity style={s.actionRow} onPress={handleLogout}>
              <View style={s.actionLeft}>
                <Ionicons name="log-out-outline" size={18} color={colors.error} />
                <Text style={[s.actionText, { color: colors.error }]}>Logout</Text>
              </View>
              {loading && <ActivityIndicator size="small" color={colors.error} />}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.footer}>Tripsphere • Tamil Nadu • v1.2.0</Text>
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={activeModal === 'edit'} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Edit Profile</Text>
            
            <Text style={s.modalLabel}>Full Name</Text>
            <TextInput
              style={s.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholderTextColor={colors.textLight}
              placeholder="e.g. Nandhitha"
            />
            
            <Text style={s.modalLabel}>Location</Text>
            <TextInput
              style={s.modalInput}
              value={editLocation}
              onChangeText={setEditLocation}
              placeholderTextColor={colors.textLight}
              placeholder="e.g. Chennai, Tamil Nadu"
            />
            
            <Text style={s.modalLabel}>Travel Tagline</Text>
            <TextInput
              style={s.modalInput}
              value={editTagline}
              onChangeText={setEditTagline}
              placeholderTextColor={colors.textLight}
              placeholder="e.g. Mountain lover & culture seeker"
            />
            
            <Text style={s.modalLabel}>Select Travel Icon</Text>
            <View style={s.presetContainer}>
              {AVATAR_PRESETS.map((p) => {
                const isSelected = editAvatar === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      s.presetCard,
                      isSelected && { borderColor: colors.purple, backgroundColor: colors.lightPurple },
                    ]}
                    onPress={() => setEditAvatar(p.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.presetIconWrap, { backgroundColor: p.bg }]}>
                      <Ionicons name={p.icon as any} size={20} color={p.color} />
                    </View>
                    <Text style={[s.presetLabel, isSelected && { color: colors.purple, fontWeight: '700' }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <View style={s.modalBtns}>
              <TouchableOpacity 
                style={s.modalBtnSecondary} 
                onPress={() => setActiveModal(null)}
                disabled={saving}
              >
                <Text style={s.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalBtnPrimary}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.modalBtnPrimaryText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Settings Modal ── */}
      <Modal visible={activeModal === 'settings'} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>App Preferences</Text>
            <View style={s.settingRow}>
              <View>
                <Text style={s.settingLabel}>Dark Theme</Text>
                <Text style={s.settingHint}>Reduce screen glare at night</Text>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.purple }}
                thumbColor="#ffffff"
              />
            </View>
            <View style={s.settingDivider} />
            <View style={s.settingRow}>
              <View>
                <Text style={s.settingLabel}>Language / மொழி</Text>
                <Text style={s.settingHint}>Change app display language</Text>
              </View>
              <TouchableOpacity
                style={s.langToggle}
                onPress={() => setSelectedLang(selectedLang === 'English' ? 'Tamil' : 'English')}
              >
                <Text style={s.langToggleText}>{selectedLang}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[s.modalBtnPrimary, { marginTop: 20 }]} onPress={() => setActiveModal(null)}>
              <Text style={s.modalBtnPrimaryText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Support Modal ── */}
      <Modal visible={activeModal === 'support'} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Help & Support</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
              {[
                { q: 'How do I earn achievements?', a: 'Achievements unlock automatically when you record trips matching the badge criteria.' },
                { q: 'Can I plan a multi-stop trip?', a: 'Yes! Use the Plan Trip button on the Home tab to build custom itineraries.' },
                { q: 'Is data saved offline?', a: 'Your dashboard and itineraries are cached securely on your device.' },
              ].map((item, i) => (
                <View key={i} style={s.faqItem}>
                  <Text style={s.faqQ}>{item.q}</Text>
                  <Text style={s.faqA}>{item.a}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[s.modalBtnPrimary, { marginTop: 16 }]}
              onPress={() => Alert.alert('Support', 'Email: support@tripsphere.com')}
            >
              <Text style={s.modalBtnPrimaryText}>Email Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalBtnGhost} onPress={() => setActiveModal(null)}>
              <Text style={s.modalBtnGhostText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Badge Detail Modal ── */}
      <Modal visible={activeModal === 'badge'} animationType="fade" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { alignItems: 'center' }]}>
            <View style={s.modalHandle} />
            {selectedBadge && (
              <>
                <View style={[s.badgeModalIcon, selectedBadge.unlocked ? s.badgeModalIconUnlocked : s.badgeModalIconLocked]}>
                  <Ionicons
                    name={selectedBadge.icon}
                    size={32}
                    color={selectedBadge.unlocked ? colors.purple : colors.textLight}
                  />
                </View>
                <Text style={s.badgeModalTitle}>{selectedBadge.title}</Text>
                <View style={[s.badgeModalStatus, selectedBadge.unlocked ? s.badgeModalStatusEarned : s.badgeModalStatusLocked]}>
                  <Text style={[s.badgeModalStatusText, { color: selectedBadge.unlocked ? colors.success : colors.textLight }]}>
                    {selectedBadge.unlocked ? '✓ Earned' : '🔒 Not yet earned'}
                  </Text>
                </View>
                <Text style={s.badgeModalDesc}>{selectedBadge.desc}</Text>
                <Text style={s.badgeModalHint}>{selectedBadge.hint}</Text>
                <TouchableOpacity style={[s.modalBtnPrimary, { width: '100%', marginTop: 20 }]} onPress={() => setActiveModal(null)}>
                  <Text style={s.modalBtnPrimaryText}>Got it</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const getStyles = (colors) => {
  const { background, card, border, text, textSecondary, textLight, purple, lightPurple, error, success, warning } = colors;
  const BG = background;
  const CARD = card;
  const BORDER = border;
  const TEXT = text;
  const TEXT2 = textSecondary;
  const TEXT3 = textLight;
  const PURPLE = purple;
  // Use colors directly where needed
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingTop: Platform.OS === 'ios' ? 56 : 36 },

  // ── Guest ─────────────────────────────────────────────────────────────────
  guestScroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  guestBox: { backgroundColor: colors.card, borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  guestIconRing: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.lightPurple, borderWidth: 1, borderColor: colors.purple + '33', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  guestTitle: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 10 },
  guestSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  guestBtn: { width: '100%', backgroundColor: colors.purple, borderRadius: 14, height: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  guestBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  guestLink: { color: colors.purple, fontWeight: '600', fontSize: 14 },
  version: { color: colors.textLight, fontSize: 11, textAlign: 'center', marginTop: 24 },

  // ── Header ────────────────────────────────────────────────────────────────
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 22, marginBottom: 22 },
  headerLeft: { gap: 2 },
  headerEyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2.5, color: colors.purple, textTransform: 'uppercase' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  settingsBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },

  // ── Profile card ──────────────────────────────────────────────────────────
  avatarRing: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: PURPLE, padding: 2 },
  avatar: { flex: 1, borderRadius: 27, backgroundColor: 'rgba(124,92,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: PURPLE, fontSize: 18, fontWeight: '800' },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { color: TEXT, fontSize: 16, fontWeight: '700' },
  profileLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  profileLoc: { color: TEXT2, fontSize: 12, fontWeight: '500' },
  profileTagline: { color: TEXT3, fontSize: 12, lineHeight: 17 },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(124,92,255,0.1)', borderWidth: 1, borderColor: 'rgba(124,92,255,0.25)', justifyContent: 'center', alignItems: 'center' },

  // ── Section ───────────────────────────────────────────────────────────────
  section: { paddingHorizontal: 22, marginBottom: 28 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 14, letterSpacing: -0.1 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  viewAll: { color: TEXT3, fontSize: 13, fontWeight: '500' },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: CARD, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: BORDER },
  statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statNum: { color: TEXT, fontSize: 20, fontWeight: '800' },
  statLabel: { color: TEXT2, fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },

  // ── Insights ──────────────────────────────────────────────────────────────
  insightsList: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  insightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  insightLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  insightIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  insightLabel: { color: TEXT2, fontSize: 14, fontWeight: '500' },
  insightValue: { color: TEXT, fontSize: 14, fontWeight: '700' },
  insightDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 14 },

  // ── Achievements ──────────────────────────────────────────────────────────
  achieveCard: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  achieveRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  achieveIconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  achieveIconUnlocked: { backgroundColor: 'rgba(124,92,255,0.12)', borderWidth: 1, borderColor: 'rgba(124,92,255,0.25)' },
  achieveIconLocked: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: BORDER },
  achieveText: { flex: 1 },
  achieveTitle: { color: TEXT, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  achieveTitleLocked: { color: TEXT3 },
  achieveDesc: { color: TEXT3, fontSize: 12 },
  achieveStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  achieveStatusUnlocked: { backgroundColor: 'rgba(124,92,255,0.1)' },
  achieveStatusLocked: { backgroundColor: 'rgba(255,255,255,0.04)' },
  achieveStatusText: { fontSize: 11, fontWeight: '700' },
  achieveStatusTextUnlocked: { color: PURPLE },
  achieveStatusTextLocked: { color: TEXT3 },
  achieveDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 14 },
  achieveNote: { color: TEXT3, fontSize: 12, marginTop: 10, lineHeight: 17, textAlign: 'center' },

  // ── Itineraries ───────────────────────────────────────────────────────────
  itinCard: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  itinRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  itinIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(124,92,255,0.1)', borderWidth: 1, borderColor: 'rgba(124,92,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  itinMeta: { flex: 1 },
  itinName: { color: TEXT, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  itinDate: { color: TEXT2, fontSize: 12 },
  itinDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 14 },
  itinLoadingBox: { height: 80, justifyContent: 'center', alignItems: 'center' },
  itinEmpty: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 32, alignItems: 'center', gap: 10 },
  itinEmptyText: { color: TEXT, fontSize: 15, fontWeight: '600' },
  itinEmptySubText: { color: TEXT2, fontSize: 12, textAlign: 'center', marginTop: -4 },
  itinEmptyBtn: { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: PURPLE },
  itinEmptyBtnText: { color: PURPLE, fontWeight: '700', fontSize: 13 },

  // ── Preset Selector ───────────────────────────────────────────────────────
  presetContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 12 },
  presetCard: { flex: 1, minWidth: '28%', backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 10, alignItems: 'center', gap: 6 },
  presetIconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  presetLabel: { color: TEXT2, fontSize: 11, fontWeight: '500' },

  // ── Actions ───────────────────────────────────────────────────────────────
  actionCard: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionText: { color: TEXT, fontSize: 14, fontWeight: '500' },
  actionDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 16 },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: { color: TEXT3, fontSize: 11, textAlign: 'center', marginBottom: 8 },

  // ── Modal base ────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#0F0F22', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, borderTopWidth: 1, borderColor: BORDER },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { color: TEXT, fontSize: 18, fontWeight: '700', marginBottom: 20 },
  modalLabel: { color: TEXT2, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  modalInput: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 12, height: 48, paddingHorizontal: 14, color: TEXT, fontSize: 15 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalBtnPrimary: { flex: 1, backgroundColor: PURPLE, borderRadius: 14, height: 50, justifyContent: 'center', alignItems: 'center' },
  modalBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalBtnSecondary: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, height: 50, justifyContent: 'center', alignItems: 'center' },
  modalBtnSecondaryText: { color: TEXT2, fontWeight: '600', fontSize: 15 },
  modalBtnGhost: { marginTop: 12, height: 44, justifyContent: 'center', alignItems: 'center' },
  modalBtnGhostText: { color: TEXT3, fontWeight: '600', fontSize: 14 },

  // ── Settings modal ────────────────────────────────────────────────────────
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settingLabel: { color: TEXT, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  settingHint: { color: TEXT3, fontSize: 12 },
  settingDivider: { height: 1, backgroundColor: BORDER },
  langToggle: { backgroundColor: 'rgba(124,92,255,0.12)', borderWidth: 1, borderColor: 'rgba(124,92,255,0.3)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  langToggleText: { color: PURPLE, fontWeight: '700', fontSize: 13 },

  // ── FAQ ───────────────────────────────────────────────────────────────────
  faqItem: { marginBottom: 16 },
  faqQ: { color: TEXT, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  faqA: { color: TEXT2, fontSize: 13, lineHeight: 19 },

  // ── Badge modal ───────────────────────────────────────────────────────────
  badgeModalIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  badgeModalIconUnlocked: { backgroundColor: 'rgba(124,92,255,0.12)', borderWidth: 1, borderColor: 'rgba(124,92,255,0.3)' },
  badgeModalIconLocked: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: BORDER },
  badgeModalTitle: { color: TEXT, fontSize: 20, fontWeight: '800', marginBottom: 10 },
  badgeModalStatus: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, marginBottom: 14 },
  badgeModalStatusEarned: { backgroundColor: 'rgba(74,222,128,0.1)' },
  badgeModalStatusLocked: { backgroundColor: 'rgba(255,255,255,0.04)' },
  badgeModalStatusText: { fontSize: 13, fontWeight: '700' },
  badgeModalDesc: { color: TEXT2, fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 6 },
  badgeModalHint: { color: TEXT3, fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
};