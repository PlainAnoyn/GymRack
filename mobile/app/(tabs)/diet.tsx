import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

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
          Meals
        </ThemedText>

        {meals.map((meal) => (
          <ThemedView key={meal.time} style={styles.mealCard}>
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    backgroundColor: '#11182720',
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
  mealCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#11182710',
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


