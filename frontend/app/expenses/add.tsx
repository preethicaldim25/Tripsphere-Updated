import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { expensesAPI } from '../../services/api';

const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Accommodation',
  'Shopping',
  'Activities',
  'Other',
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await expensesAPI.create({
        trip_id: tripId as string,
        description: formData.description,
        amount: Number(formData.amount),
        category: formData.category,
        date: formData.date,
      });
      
      Alert.alert('Success', 'Expense added successfully');
      router.back();
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Add Expense',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        ),
      }} />
      
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Lunch at restaurant"
              value={formData.description}
              onChangeText={(text: string) => setFormData({ ...formData, description: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="500"
              value={formData.amount}
              onChangeText={(text: string) => setFormData({ ...formData, amount: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(value: string) => setFormData({ ...formData, category: value })}
                style={styles.picker}
              >
                {EXPENSE_CATEGORIES.map((cat: string) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Add Expense</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
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
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0D9FF',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0D9FF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: '#6B4EFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});