import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View, Pressable } from 'react-native';
import axios from 'axios';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const API_BASE_URL = 'http://10.0.2.2:4000';

type Workout = {
  id: number;
  name: string;
  date: string;
};

export default function WorkoutScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [name, setName] = useState('');

  const fetchWorkouts = async () => {
    try {
      const res = await axios.get<Workout[]>(`${API_BASE_URL}/workouts`);
      setWorkouts(res.data);
    } catch (e) {
      console.log('Error fetching workouts', e);
    }
  };

  const addWorkout = async () => {
    if (!name.trim()) return;

    try {
      await axios.post(`${API_BASE_URL}/workouts`, {
        user_id: 1,
        name,
        date: new Date().toISOString().slice(0, 10),
      });
      setName('');
      fetchWorkouts();
    } catch (e) {
      console.log('Error adding workout', e);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>
        Workout Routine
      </ThemedText>
      <ThemedText style={styles.subheader}>Track and plan your strength sessions.</ThemedText>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Workout name (Push, Legs, Pull...)"
          value={name}
          onChangeText={setName}
        />
        <Pressable style={styles.addButton} onPress={addWorkout}>
          <ThemedText style={styles.addButtonText}>Add</ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ThemedView style={styles.card}>
            <View style={styles.cardHeader}>
              <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
              <ThemedText style={styles.cardDate}>{item.date}</ThemedText>
            </View>
            <ThemedText style={styles.cardTag}>Strength • Custom routine</ThemedText>
          </ThemedView>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 4,
  },
  subheader: {
    opacity: 0.8,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addButton: {
    borderRadius: 999,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#22c55e',
  },
  addButtonText: {
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 16,
  },
  card: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#11182710',
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontWeight: '600',
  },
  cardDate: {
    opacity: 0.7,
  },
  cardTag: {
    opacity: 0.8,
  },
});


