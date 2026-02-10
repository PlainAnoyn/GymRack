import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.heading}>
          GymRack Overview
        </ThemedText>
        <ThemedText style={styles.subheading}>
          Your daily snapshot: workouts, nutrition, and progress in one place.
        </ThemedText>

        <View style={styles.row}>
          <ThemedView style={styles.primaryCard}>
            <ThemedText style={styles.cardLabel}>Today&apos;s Workout</ThemedText>
            <ThemedText type="title" style={styles.cardMain}>
              Push Day
            </ThemedText>
            <ThemedText style={styles.cardCaption}>3 exercises • Est. 45 min</ThemedText>
          </ThemedView>
        </View>

        <View style={styles.row}>
          <ThemedView style={styles.card}>
            <ThemedText style={styles.cardLabel}>Calories</ThemedText>
            <ThemedText type="title" style={styles.cardMain}>
              1,240
            </ThemedText>
            <ThemedText style={styles.cardCaption}>of 2,300 goal</ThemedText>
          </ThemedView>
          <ThemedView style={styles.card}>
            <ThemedText style={styles.cardLabel}>Protein</ThemedText>
            <ThemedText type="title" style={styles.cardMain}>
              78g
            </ThemedText>
            <ThemedText style={styles.cardCaption}>of 150g target</ThemedText>
          </ThemedView>
        </View>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          This week
        </ThemedText>

        <ThemedView style={styles.weekRow}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <ThemedView
              key={d + i}
              style={[styles.dayChip, i === 2 && styles.dayChipActive]}
            >
              <ThemedText style={i === 2 ? styles.dayChipTextActive : styles.dayChipText}>
                {d}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>

        <ThemedView style={styles.progressCard}>
          <ThemedText style={styles.cardLabel}>Sessions completed</ThemedText>
          <ThemedText type="title" style={styles.cardMain}>
            3 / 5
          </ThemedText>
          <ThemedText style={styles.cardCaption}>Stay consistent to hit your goal.</ThemedText>
        </ThemedView>
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
    marginBottom: 4,
  },
  subheading: {
    opacity: 0.8,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  primaryCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#22c55e30',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#11182710',
  },
  cardLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  cardMain: {
    marginBottom: 2,
  },
  cardCaption: {
    opacity: 0.8,
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 8,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#11182708',
  },
  dayChipActive: {
    backgroundColor: '#22c55e',
  },
  dayChipText: {
    opacity: 0.8,
  },
  dayChipTextActive: {
    fontWeight: '600',
  },
  progressCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#11182710',
  },
});

