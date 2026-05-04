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
import { tripsAPI } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/themecontext';

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [tripCount, setTripCount] = useState(0);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editImage, setEditImage] = useState('');
  const [selectedLang, setSelectedLang] = useState('English');

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
    }
  }, [user]);

  const handleSaveProfile = () => {
    Alert.alert('Success', 'Profile updated successfully!');
    setActiveModal(null);
  };

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchUserData();
      }
    }, [isAuthenticated])
  );

  const fetchUserData = async () => {
    try {
      setLoadingTrips(true);
      const trips = await tripsAPI.getAll();
      setTripCount(trips.length);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      setLoading(true);
      try {
        await logout();
        console.log('Logged out successfully');
        setTripCount(0);
        router.replace('/auth/login');
      } catch (error) {
        console.error('Logout error:', error);
        Alert.alert('Error', 'Failed to logout');
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to logout?');
      if (confirmLogout) {
        performLogout();
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
            onPress: performLogout
          }
        ]
      );
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const formatMemberSince = (dateString?: string) => {
    if (!dateString) return 'New';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return 'New';
    }
  };

  const styles = getStyles(colors);

  // If not authenticated, show login prompt
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.notLoggedInContainer}>
            <Ionicons name="person-circle-outline" size={80} color={colors.textLight} />
            <Text style={[styles.notLoggedInText, { color: colors.textSecondary }]}>
              You're not logged in
            </Text>
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.loginButtonText}>Login to Your Account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={{ color: colors.primary }}>Don't have an account? Sign up</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.versionText, { color: colors.textLight }]}>Tripsphere v1.0.0</Text>
          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Profile Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={{ marginBottom: 15 }}>
            <Ionicons name="person-circle" size={80} color={colors.primary} />
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.lightPurple }]}>
            <Text style={[styles.roleText, { color: colors.primary }]}>{user.role || 'user'}</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
          <View style={styles.statCard}>
            <Ionicons name="airplane-outline" size={24} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{loadingTrips ? '...' : tripCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Trips</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star-outline" size={24} color={colors.warning} />
            <Text style={[styles.statNumber, { color: colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Reviews</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={24} color={colors.success} />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {formatMemberSince((user as any).created_at)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Member Since</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={[styles.menuSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.menuTitle, { color: colors.textSecondary }]}>Account Settings</Text>

          {/* Theme Toggle */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={handleThemeToggle}
            activeOpacity={0.7}
          >
            <Ionicons name={theme === 'light' ? 'moon-outline' : 'sunny-outline'} size={22} color={colors.primary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={handleThemeToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </TouchableOpacity>

          {/* Edit Profile */}
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => setActiveModal('edit')}>
            <Ionicons name="person-outline" size={22} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          {/* My Trips */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/(tabs)/trips')}
          >
            <Ionicons name="map-outline" size={22} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>My Trips</Text>
            {tripCount > 0 && (
              <Text style={[styles.menuItemBadge, { backgroundColor: colors.primary }]}>{tripCount}</Text>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          {/* Saved Places */}
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => router.push('/saved')}>
            <Ionicons name="bookmark-outline" size={22} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Saved Places</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => setActiveModal('settings')}>
            <Ionicons name="settings-outline" size={22} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          {/* Help & Support */}
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => setActiveModal('support')}>
            <Ionicons name="help-circle-outline" size={22} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
            disabled={loading}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={[styles.menuItemText, { color: colors.error }]}>
              {loading ? 'Logging out...' : 'Logout'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <Text style={[styles.versionText, { color: colors.textLight }]}>Tripsphere v1.0.0</Text>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={activeModal === 'edit'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Name</Text>
            <TextInput style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]} value={editName} onChangeText={setEditName} />
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Email</Text>
            <TextInput style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]} value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" />
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Profile Image URL</Text>
            <TextInput style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]} value={editImage} onChangeText={setEditImage} placeholder="https://..." placeholderTextColor={colors.textLight} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.border }]} onPress={() => setActiveModal(null)}><Text style={{color: colors.text}}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleSaveProfile}><Text style={{color: '#fff'}}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={activeModal === 'settings'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Settings</Text>
            <View style={styles.settingRow}>
              <Text style={{ color: colors.text, fontSize: 16 }}>Dark Mode</Text>
              <Switch value={theme === 'dark'} onValueChange={handleThemeToggle} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
            </View>
            <View style={styles.settingRow}>
              <Text style={{ color: colors.text, fontSize: 16 }}>Language</Text>
              <TouchableOpacity style={[styles.langBtn, { borderColor: colors.border }]} onPress={() => setSelectedLang(selectedLang === 'English' ? 'Tamil' : 'English')}>
                <Text style={{ color: colors.primary }}>{selectedLang}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.modalBtn, styles.modalCloseBtn, { backgroundColor: colors.primary }]} onPress={() => setActiveModal(null)}>
              <Text style={{color: '#fff'}}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Support Modal */}
      <Modal visible={activeModal === 'support'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Help & Support</Text>
            <Text style={[styles.faqTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
            <Text style={[styles.faqQ, { color: colors.text }]}>Q: How to reset my password?</Text>
            <Text style={[styles.faqA, { color: colors.textSecondary }]}>A: Go to the login screen and click "Forgot Password".</Text>
            <Text style={[styles.faqQ, { color: colors.text }]}>Q: How to plan a new trip?</Text>
            <Text style={[styles.faqA, { color: colors.textSecondary }]}>A: Navigate to the Home page and tap on "Plan Trip".</Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary, marginTop: 25 }]} onPress={() => Alert.alert('Contact Support', 'Email redirected to support@tripsphere.com')}>
              <Text style={{color: '#fff'}}>Contact Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, styles.modalCloseBtn, { backgroundColor: 'transparent' }]} onPress={() => setActiveModal(null)}>
              <Text style={{color: colors.primary, fontWeight: '600'}}>Close Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
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
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 400,
  },
  notLoggedInText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    paddingHorizontal: 30,
    width: '100%',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 10,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    marginTop: 1,
    marginBottom: 10,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
  },
  menuSection: {
    paddingHorizontal: 15,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 20,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
  },
  menuItemBadge: {
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    marginRight: 10,
    overflow: 'hidden',
  },
  logoutItem: {
    borderBottomWidth: 0,
    marginTop: 20,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 30,
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  modalCloseBtn: {
    marginTop: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 5,
  },
  langBtn: {
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  faqTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  faqQ: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },
  faqA: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
});