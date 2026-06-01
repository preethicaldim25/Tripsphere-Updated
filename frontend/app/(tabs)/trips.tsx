import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import { SmartImage } from '../../components/ui/SmartImage';
import { useTrip } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/themecontext';

const { width, height } = Dimensions.get('window');

type TripTab = 'upcoming' | 'draft' | 'completed';

export default function TripsScreen() {
  const { trips, loading, error, refreshTrips, updateTrip, deleteTrip, duplicateTrip } = useTrip();
  const { isAuthenticated, logout } = useAuth();
  const { colors, theme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<TripTab>('upcoming');
  const [selectedTripForMenu, setSelectedTripForMenu] = useState<any | null>(null);
  const [editingTrip, setEditingTrip] = useState<any | null>(null);
  const [confirmDeleteTrip, setConfirmDeleteTrip] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editTravelers, setEditTravelers] = useState(1);
  const [editAccommodation, setEditAccommodation] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editTransport, setEditTransport] = useState('Driving');
  const [editStatus, setEditStatus] = useState<'draft' | 'upcoming' | 'completed'>('upcoming');

  const styles = getStyles(colors, theme);

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        refreshTrips();
      }
    }, [isAuthenticated])
  );

  const handleRetry = () => {
    refreshTrips();
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const performLogoutAction = async () => {
    try {
      await logout();
    } catch (e) {
      if (Platform.OS === 'web') {
        window.alert('Failed to logout');
      } else {
        Alert.alert('Error', 'Failed to logout');
      }
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        await performLogoutAction();
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
            onPress: performLogoutAction
          }
        ]
      );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Grouping trips
  const filteredTrips = trips.filter(t => {
    const status = t.status || 'upcoming';
    if (activeTab === 'upcoming') return status === 'upcoming';
    if (activeTab === 'draft') return status === 'draft';
    if (activeTab === 'completed') return status === 'completed';
    return false;
  });

  const countUpcoming = trips.filter(t => (t.status || 'upcoming') === 'upcoming').length;
  const countDraft = trips.filter(t => t.status === 'draft').length;
  const countCompleted = trips.filter(t => t.status === 'completed').length;

  const handleOpenEdit = (trip: any) => {
    setEditingTrip(trip);
    setEditName(trip.title || trip.name || '');
    setEditStartDate(trip.start_date || '');
    setEditEndDate(trip.end_date || '');
    setEditBudget(trip.total_budget ? String(trip.total_budget) : (trip.budget ? String(trip.budget) : '0'));
    setEditTravelers(trip.travelers || 1);
    setEditAccommodation(trip.accommodation || '');
    setEditNotes(trip.notes || '');
    setEditTransport(trip.transport_preferences || 'Driving');
    setEditStatus(trip.status || 'upcoming');
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      alertMessage('Error', 'Please provide a trip title.');
      return;
    }
    setIsSubmitting(true);
    try {
      const updatedFields = {
        title: editName,
        start_date: editStartDate,
        end_date: editEndDate,
        total_budget: parseFloat(editBudget) || 0,
        travelers: editTravelers,
        accommodation: editAccommodation,
        notes: editNotes,
        status: editStatus,
        transport_preferences: editTransport,
        is_draft: editStatus === 'draft',
        is_confirmed: editStatus !== 'draft',
      };
      await updateTrip(editingTrip.id || editingTrip._id, updatedFields as any);
      setEditingTrip(null);
      alertMessage('Success', 'Trip updated successfully!');
      refreshTrips();
    } catch (err: any) {
      alertMessage('Error', err.message || 'Failed to update trip.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (trip: any) => {
    setIsSubmitting(true);
    try {
      await duplicateTrip(trip.id || trip._id);
      alertMessage('Success', 'Trip duplicated successfully as a draft!');
    } catch (err: any) {
      alertMessage('Error', err.message || 'Failed to duplicate trip.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = (trip: any) => {
    setConfirmDeleteTrip(trip);
  };

  const handleDelete = async () => {
    if (!confirmDeleteTrip) return;
    setIsSubmitting(true);
    try {
      await deleteTrip(confirmDeleteTrip.id || confirmDeleteTrip._id);
      setConfirmDeleteTrip(null);
      alertMessage('Deleted', 'Trip permanently removed.');
    } catch (err: any) {
      alertMessage('Error', err.message || 'Failed to delete trip.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const alertMessage = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>My Journeys</Text>
        <Text style={styles.headerSubtitle}>Manage your planned adventures</Text>
      </View>
      {isAuthenticated && (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSegmentedTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'upcoming' && styles.activeTabButton]}
        onPress={() => setActiveTab('upcoming')}
      >
        <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
          Upcoming
        </Text>
        <View style={[styles.badge, activeTab === 'upcoming' ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.badgeText, activeTab === 'upcoming' && styles.activeBadgeText]}>{countUpcoming}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'draft' && styles.activeTabButton]}
        onPress={() => setActiveTab('draft')}
      >
        <Text style={[styles.tabText, activeTab === 'draft' && styles.activeTabText]}>
          Drafts
        </Text>
        <View style={[styles.badge, activeTab === 'draft' ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.badgeText, activeTab === 'draft' && styles.activeBadgeText]}>{countDraft}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'completed' && styles.activeTabButton]}
        onPress={() => setActiveTab('completed')}
      >
        <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
          Completed
        </Text>
        <View style={[styles.badge, activeTab === 'completed' ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.badgeText, activeTab === 'completed' && styles.activeBadgeText]}>{countCompleted}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const wrapScreen = (content: React.ReactNode) => (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {content}
      </View>
    </SafeAreaView>
  );

  if (!isAuthenticated) {
    return wrapScreen(
      <>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="person-outline" size={48} color="#6366F1" />
          </View>
          <Text style={styles.emptyText}>Sign in to view your trips</Text>
          <Text style={styles.emptySubText}>Securely plan, budget, and organize your Tamil Nadu travels across all devices.</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
          >
            <Text style={styles.loginButtonText}>Sign In Now</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  if (loading && trips.length === 0) {
    return wrapScreen(
      <>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Unlocking your travel archives...</Text>
        </View>
      </>
    );
  }

  return wrapScreen(
    <>
      {renderHeader()}
      {renderSegmentedTabs()}

      {error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : filteredTrips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons 
              name={activeTab === 'upcoming' ? "airplane-outline" : activeTab === 'draft' ? "document-text-outline" : "archive-outline"} 
              size={48} 
              color="#6366F1" 
            />
          </View>
          <Text style={styles.emptyText}>
            {activeTab === 'upcoming' 
              ? 'No upcoming journeys planned' 
              : activeTab === 'draft' 
                ? 'No trip drafts' 
                : 'No archived trips'}
          </Text>
          <Text style={styles.emptySubText}>
            {activeTab === 'upcoming' 
              ? 'Start custom AI intelligence itineraries to explore Tamil Nadu.' 
              : activeTab === 'draft' 
                ? 'Partially completed plans will organize here.' 
                : 'Completed trips will automatically archive here based on end date.'}
          </Text>
          {activeTab !== 'completed' && (
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/plan-trip')}
            >
              <Text style={styles.createButtonText}>Create New Itinerary</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isCompleted = activeTab === 'completed';
            const isDraft = activeTab === 'draft';

            return (
              <View style={[styles.card, isCompleted && styles.compactCard]}>
                {/* Visual Image Banner */}
                {!isCompleted && (
                  <TouchableOpacity 
                    style={styles.imageContainer}
                    activeOpacity={0.95}
                    onPress={() => router.push(`/trip/${item._id || item.id}`)}
                  >
                    <SmartImage 
                      category={item.destination_details?.category || 'default'}
                      style={styles.cardImage} 
                    />
                    
                    {/* Status Pill Indicator */}
                    <View style={styles.cardBadgeContainer}>
                      <View style={[styles.statusBadge, isDraft ? styles.draftBadge : styles.upcomingBadge]}>
                        <Text style={styles.statusBadgeText}>
                          {isDraft ? 'DRAFT' : 'CONFIRMED'}
                        </Text>
                      </View>
                    </View>

                    {/* Quick Cost Tag */}
                    <View style={styles.budgetBadge}>
                      <Ionicons name="wallet-outline" size={12} color="#FBBF24" />
                      <Text style={styles.budgetText}>₹{item.total_budget || item.budget || 0}</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Card Content details */}
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <TouchableOpacity 
                      style={styles.nameTouchable}
                      onPress={() => router.push(`/trip/${item._id || item.id}`)}
                    >
                      <Text style={[styles.cardName, isCompleted && styles.compactCardName]}>
                        {item.title || item.name}
                      </Text>
                      <Text style={styles.cardLocation}>
                        {item.destination_details?.name || 'Explore Journey'} • {item.destination_details?.district || 'Tamil Nadu'}
                      </Text>
                    </TouchableOpacity>

                    {/* Overflow menu options (⋮) */}
                    <TouchableOpacity 
                      style={styles.overflowButton}
                      onPress={() => setSelectedTripForMenu(item)}
                    >
                      <Ionicons name="ellipsis-vertical" size={20} color={colors.textLight || '#A1A1AA'} />
                    </TouchableOpacity>
                  </View>

                  {!isCompleted && (
                    <View style={styles.divider} />
                  )}

                  {/* Metadata Row */}
                  <View style={[styles.metaRow, isCompleted && styles.compactMetaRow]}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={14} color="#6366F1" />
                      <Text style={styles.metaText}>
                        {formatDate(item.start_date)}
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Ionicons name="people-outline" size={14} color="#10B981" />
                      <Text style={styles.metaText}>
                        {item.travelers} {item.travelers === 1 ? 'Traveler' : 'Travelers'}
                      </Text>
                    </View>

                    {isCompleted && (
                      <View style={styles.metaItem}>
                        <Ionicons name="checkmark-done-circle" size={15} color="#10B981" />
                        <Text style={[styles.metaText, { color: '#10B981', fontWeight: 'bold' }]}>
                          ARCHIVED
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Accommodation & Notes highlights for detailed draft / upcoming trips */}
                  {!isCompleted && (item.accommodation || item.notes) && (
                    <View style={styles.detailRow}>
                      {item.accommodation ? (
                        <View style={styles.detailItem}>
                          <Ionicons name="bed-outline" size={12} color={colors.textSecondary || '#71717A'} />
                          <Text style={styles.detailText} numberOfLines={1}>
                            {item.accommodation}
                          </Text>
                        </View>
                      ) : null}
                      {item.notes ? (
                        <View style={styles.detailItem}>
                          <Ionicons name="document-text-outline" size={12} color={colors.textSecondary || '#71717A'} />
                          <Text style={styles.detailText} numberOfLines={1}>
                            {item.notes}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* BOTTOM SHEET ACTION MENU */}
      {selectedTripForMenu && (
        <Modal 
          transparent 
          visible={true} 
          animationType="fade" 
          onRequestClose={() => setSelectedTripForMenu(null)}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setSelectedTripForMenu(null)}
          >
            <View style={styles.bottomSheetContainer}>
              <View style={styles.bottomSheetDragHandle} />
              
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>{selectedTripForMenu.name}</Text>
                <Text style={styles.bottomSheetSubtitle}>
                  {selectedTripForMenu.destination_details?.name || 'Explore Journey'} • ₹{selectedTripForMenu.budget}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.bottomSheetItem} 
                onPress={() => {
                  const trip = selectedTripForMenu;
                  setSelectedTripForMenu(null);
                  handleOpenEdit(trip);
                }}
              >
                <View style={[styles.bottomSheetIconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                  <Ionicons name="create" size={18} color="#6366F1" />
                </View>
                <Text style={styles.bottomSheetText}>Edit Details</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.bottomSheetItem} 
                onPress={() => {
                  const trip = selectedTripForMenu;
                  setSelectedTripForMenu(null);
                  handleDuplicate(trip);
                }}
              >
                <View style={[styles.bottomSheetIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Ionicons name="copy" size={18} color="#10B981" />
                </View>
                <Text style={styles.bottomSheetText}>Duplicate Plan</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.bottomSheetItem, styles.deleteItem]} 
                onPress={() => {
                  const trip = selectedTripForMenu;
                  setSelectedTripForMenu(null);
                  handleConfirmDelete(trip);
                }}
              >
                <View style={[styles.bottomSheetIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <Ionicons name="trash" size={18} color="#EF4444" />
                </View>
                <Text style={[styles.bottomSheetText, styles.deleteText]}>Delete Trip Permanently</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.bottomSheetCancel} 
                onPress={() => setSelectedTripForMenu(null)}
              >
                <Text style={styles.bottomSheetCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* RICH EDIT TRIP MODAL */}
      {editingTrip && (
        <Modal 
          visible={true} 
          animationType="slide" 
          transparent
          onRequestClose={() => setEditingTrip(null)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.editModalContainer}
          >
            <View style={styles.editModalContent}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Edit Trip Details</Text>
                <TouchableOpacity onPress={() => setEditingTrip(null)}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.editModalScroll}
              >
                {/* Title */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Trip Name</Text>
                  <TextInput 
                    style={styles.formInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter trip name"
                    placeholderTextColor="#555"
                  />
                </View>

                {/* Status Toggle */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Trip Category Status</Text>
                  <View style={styles.toggleRow}>
                    {(['draft', 'upcoming', 'completed'] as const).map((st) => (
                      <TouchableOpacity 
                        key={st}
                        style={[
                          styles.toggleButton, 
                          editStatus === st && styles.activeToggleButton,
                          editStatus === st && st === 'draft' && { borderColor: '#EAB308' },
                          editStatus === st && st === 'completed' && { borderColor: '#10B981' }
                        ]}
                        onPress={() => setEditStatus(st)}
                      >
                        <Text style={[
                          styles.toggleButtonText, 
                          editStatus === st && styles.activeToggleButtonText,
                          editStatus === st && st === 'draft' && { color: '#EAB308' },
                          editStatus === st && st === 'completed' && { color: '#10B981' }
                        ]}>
                          {st.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Dates Row */}
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Start Date (YYYY-MM-DD)</Text>
                    <TextInput 
                      style={styles.formInput}
                      value={editStartDate}
                      onChangeText={setEditStartDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#555"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                    <Text style={styles.formLabel}>End Date (YYYY-MM-DD)</Text>
                    <TextInput 
                      style={styles.formInput}
                      value={editEndDate}
                      onChangeText={setEditEndDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#555"
                    />
                  </View>
                </View>

                {/* Travelers Stepper */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Travelers Count</Text>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity 
                      style={styles.stepperButton}
                      onPress={() => setEditTravelers(Math.max(1, editTravelers - 1))}
                    >
                      <Ionicons name="remove" size={20} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{editTravelers}</Text>
                    <TouchableOpacity 
                      style={styles.stepperButton}
                      onPress={() => setEditTravelers(editTravelers + 1)}
                    >
                      <Ionicons name="add" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Budget */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Total Budget (₹)</Text>
                  <TextInput 
                    style={styles.formInput}
                    value={editBudget}
                    onChangeText={setEditBudget}
                    keyboardType="numeric"
                    placeholder="Enter total budget amount"
                    placeholderTextColor="#555"
                  />
                </View>

                {/* Accommodations */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Preferred Accommodation</Text>
                  <TextInput 
                    style={styles.formInput}
                    value={editAccommodation}
                    onChangeText={setEditAccommodation}
                    placeholder="Resorts, hotels, homestays..."
                    placeholderTextColor="#555"
                  />
                </View>

                {/* Transport Preferences */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Transport Preference</Text>
                  <View style={styles.toggleRow}>
                    {['Driving', 'Train', 'Flight', 'Biking'].map((t) => (
                      <TouchableOpacity 
                        key={t}
                        style={[styles.toggleButton, editTransport === t && styles.activeToggleButton]}
                        onPress={() => setEditTransport(t)}
                      >
                        <Text style={[styles.toggleButtonText, editTransport === t && styles.activeToggleButtonText]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Itinerary Notes</Text>
                  <TextInput 
                    style={[styles.formInput, styles.formTextarea]}
                    value={editNotes}
                    onChangeText={setEditNotes}
                    multiline
                    numberOfLines={4}
                    placeholder="Add dynamic guidelines, packing lists, temple timings, food preferences..."
                    placeholderTextColor="#555"
                  />
                </View>
              </ScrollView>

              <View style={styles.editModalFooter}>
                <TouchableOpacity 
                  style={styles.cancelFormButton}
                  onPress={() => setEditingTrip(null)}
                >
                  <Text style={styles.cancelFormButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveFormButton, isSubmitting && { opacity: 0.7 }]}
                  onPress={handleSaveEdit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.saveFormButtonText}>Save Updates</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* CONFIRM DELETE DIALOG MODAL */}
      {confirmDeleteTrip && (
        <Modal 
          transparent 
          visible={true} 
          animationType="fade"
          onRequestClose={() => setConfirmDeleteTrip(null)}
        >
          <View style={styles.deleteConfirmOverlay}>
            <View style={styles.deleteConfirmBox}>
              <View style={styles.deleteConfirmIcon}>
                <Ionicons name="trash-outline" size={32} color="#EF4444" />
              </View>
              
              <Text style={styles.deleteConfirmTitle}>Delete this trip permanently?</Text>
              <Text style={styles.deleteConfirmText}>
                Are you sure you want to delete <Text style={{ fontWeight: 'bold', color: '#FFF' }}>{confirmDeleteTrip.name}</Text>? This action is irreversible and will delete all itineraries, expenses, and maps.
              </Text>

              <View style={styles.deleteConfirmButtons}>
                <TouchableOpacity 
                  style={styles.deleteConfirmCancel}
                  onPress={() => setConfirmDeleteTrip(null)}
                >
                  <Text style={styles.deleteConfirmCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteConfirmDelete}
                  onPress={handleDelete}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.deleteConfirmDeleteText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const getStyles = (colors: any, theme: string) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080810',
  },
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#080810',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E9F',
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E9F',
  },
  activeTabText: {
    color: '#818CF8',
    fontWeight: '700',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  activeBadge: {
    backgroundColor: '#6366F1',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E9F',
  },
  activeBadgeText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E9F',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#111124',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  compactCard: {
    borderRadius: 18,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  imageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardBadgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  upcomingBadge: {
    backgroundColor: '#6366F1',
  },
  draftBadge: {
    backgroundColor: '#EAB308',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  budgetBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  budgetText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameTouchable: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  compactCardName: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardLocation: {
    fontSize: 13,
    color: '#8E8E9F',
    marginTop: 4,
  },
  overflowButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  compactMetaRow: {
    marginTop: 8,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: '#8E8E9F',
    maxWidth: 130,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    color: '#8E8E9F',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  retryButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: '#111124',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  bottomSheetDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  bottomSheetHeader: {
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bottomSheetSubtitle: {
    fontSize: 13,
    color: '#8E8E9F',
    marginTop: 4,
  },
  bottomSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  bottomSheetIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bottomSheetText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteItem: {
    borderBottomWidth: 0,
  },
  deleteText: {
    color: '#EF4444',
  },
  bottomSheetCancel: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
  },
  bottomSheetCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E9F',
  },
  editModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    height: height * 0.85,
    backgroundColor: '#0C0C1E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  editModalScroll: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E9F',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 14,
  },
  formTextarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  activeToggleButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: '#6366F1',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E9F',
  },
  activeToggleButtonText: {
    color: '#818CF8',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    gap: 16,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    minWidth: 20,
    textAlign: 'center',
  },
  editModalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  cancelFormButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
  },
  cancelFormButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E9F',
  },
  saveFormButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveFormButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  deleteConfirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  deleteConfirmBox: {
    width: '100%',
    backgroundColor: '#111124',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  deleteConfirmIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  deleteConfirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteConfirmText: {
    fontSize: 13,
    color: '#8E8E9F',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteConfirmCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
  },
  deleteConfirmCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E9F',
  },
  deleteConfirmDelete: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmDeleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});