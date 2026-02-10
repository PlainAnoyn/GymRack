import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TextInput, Pressable } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/constants/api';

const meals = [
  {
    time: 'Breakfast',
    title: 'Oats & Berries',
    calories: 380,
    protein: 20,
    carbs: 50,
    fats: 8,
  },
  {
    time: 'Lunch',
    title: 'Grilled Chicken Bowl',
    calories: 620,
    protein: 45,
    carbs: 60,
    fats: 18,
  },
  {
    time: 'Snack',
    title: 'Greek Yogurt & Nuts',
    calories: 250,
    protein: 18,
    carbs: 15,
    fats: 12,
  },
  {
    time: 'Dinner',
    title: 'Salmon & Quinoa',
    calories: 540,
    protein: 40,
    carbs: 35,
    fats: 20,
  },
];

export default function DietScreen() {
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmr, setBmr] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateMetrics = async () => {
    if (!heightCm || !weightKg || !age || !gender) return;
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/health/metrics`, {
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        age: Number(age),
        gender,
      });
      setBmi(res.data.bmi);
      setBmr(res.data.bmr);
    } catch (e) {
      console.log('Error calculating metrics', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.heading}>
          Today&apos;s Diet
        </ThemedText>

        <ThemedView style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Calories</ThemedText>
              <ThemedText type="title">1,790</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Protein</ThemedText>
              <ThemedText type="title">123g</ThemedText>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Carbs</ThemedText>
              <ThemedText type="title">160g</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Fats</ThemedText>
              <ThemedText type="title">58g</ThemedText>
            </View>
          </View>
        </ThemedView>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          BMI / BMR
        </ThemedText>

        <ThemedView style={styles.calculatorCard}>
          <View style={styles.calculatorRow}>
            <TextInput
              style={styles.input}
              placeholder="Height (cm)"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              value={heightCm}
              onChangeText={setHeightCm}
            />
            <TextInput
              style={styles.input}
              placeholder="Weight (kg)"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              value={weightKg}
              onChangeText={setWeightKg}
            />
          </View>
          <View style={styles.calculatorRow}>
            <TextInput
              style={styles.input}
              placeholder="Age"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={gender}
                dropdownIconColor="#6b7280"
                style={styles.picker}
                onValueChange={(value) => setGender(value as any)}
              >
                <Picker.Item label="Gender" value="" color="#6b7280" />
                <Picker.Item label="Male" value="male" color="#e5e7eb" />
                <Picker.Item label="Female" value="female" color="#e5e7eb" />
              </Picker>
            </View>
          </View>
          <Pressable style={styles.calcButton} onPress={calculateMetrics}>
            <ThemedText style={styles.calcButtonText}>
              {loading ? 'Calculating...' : 'Calculate'}
            </ThemedText>
          </Pressable>

          {(bmi !== null || bmr !== null) && (
            <View style={styles.resultsRow}>
              {bmi !== null && (
                <View style={styles.resultItem}>
                  <ThemedText style={styles.summaryLabel}>BMI</ThemedText>
                  <ThemedText type="title">{bmi}</ThemedText>
                </View>
              )}
              {bmr !== null && (
                <View style={styles.resultItem}>
                  <ThemedText style={styles.summaryLabel}>BMR</ThemedText>
                  <ThemedText type="title">{bmr} kcal</ThemedText>
                </View>
              )}
            </View>
          )}
        </ThemedView>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Meals
        </ThemedText>

        {meals.map((meal) => (
          <React.Fragment key={meal.time}>
            <ThemedView style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <ThemedText style={styles.mealTime}>{meal.time}</ThemedText>
                <ThemedText style={styles.mealCalories}>{meal.calories} kcal</ThemedText>
              </View>
              <ThemedText type="defaultSemiBold" style={styles.mealTitle}>
                {meal.title}
              </ThemedText>
              <ThemedText style={styles.mealMacros}>
                {meal.protein}g P • {meal.carbs}g C • {meal.fats}g F
              </ThemedText>
            </ThemedView>
          </React.Fragment>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  heading: {
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  calculatorCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  calculatorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#020617',
  },
  picker: {
    color: '#e5e7eb',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#e5e7eb',
  },
  calcButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#38bdf8',
    marginTop: 4,
  },
  calcButtonText: {
    fontWeight: '600',
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  resultItem: {
    flex: 1,
  },
  mealCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mealTime: {
    opacity: 0.7,
  },
  mealCalories: {
    fontWeight: '600',
  },
  mealTitle: {
    marginBottom: 2,
  },
  mealMacros: {
    opacity: 0.8,
  },
});


