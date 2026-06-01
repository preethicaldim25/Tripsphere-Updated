import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTrip } from '@/context/TripContext';
import { Ionicons } from '@expo/vector-icons';

const TN_COLORS = {
  primary: '#1F6F78',
  accent: '#C8A96A',
  background: '#F8F6F2',
  card: '#FFFFFF',
  text: '#2F2F2F',
  textLight: '#6B7280',
};

export default function CreateTripScreen() {
  const router = useRouter();
  const { createTrip, loading } = useTrip();

  const [title, setTitle] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [destinationImage, setDestinationImage] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'completed' | 'saved'>('upcoming');
  const [members, setMembers] = useState('');

  const handleSubmit = async () => {
    if (!title || !destinationName || !location || !startDate || !endDate || !totalBudget) {
      Alert.alert('Missing fields', 'Please fill all required fields.');
      return;
    }
    try {
      const tripData = {
        title,
        destination_name: destinationName,
        destination_image: destinationImage || 'https://images.pexels.com/photos/460376/pexels-photo-460376.jpeg',
        location,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        total_budget: parseFloat(totalBudget),
        used_budget: 0,
        status,
        members: members ? members.split(',').map(m => m.trim()).filter(Boolean) : [],
        itinerary: [],
      };
      console.log("Trip Payload:", tripData);
      await createTrip(tripData);
      Alert.alert('Success', 'Trip created successfully');
      router.replace('/(tabs)/trips');
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Failed to create trip';
      Alert.alert('Error', message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create New Trip</Text>

      <View style={styles.card}>
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Trip to Madurai" />
        <Input label="Destination Name" value={destinationName} onChangeText={setDestinationName} placeholder="Madurai Meenakshi Temple" />
        <Input label="Destination Image URL" value={destinationImage} onChangeText={setDestinationImage} placeholder="https://..." />
        <Input label="Location" value={location} onChangeText={setLocation} placeholder="Madurai, Tamil Nadu" />
        <Input label="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} placeholder="2026-03-10" />
        <Input label="End Date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} placeholder="2026-03-15" />
        <Input label="Total Budget (₹)" value={totalBudget} onChangeText={setTotalBudget} keyboardType="numeric" placeholder="50000" />
        <Input label="Members (comma separated)" value={members} onChangeText={setMembers} placeholder="Alice,Bob" />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.submitText}>Create Trip</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Input({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={TN_COLORS.textLight}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TN_COLORS.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: TN_COLORS.primary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: TN_COLORS.card,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: TN_COLORS.textLight,
    marginBottom: 6,
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: TN_COLORS.text,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: TN_COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 6,
  },
});
