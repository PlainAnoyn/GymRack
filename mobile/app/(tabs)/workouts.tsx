import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View, Pressable, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/constants/api';

type Workout = {
  id: number;
  name: string;
  date: string;
};

type Exercise = {
  name: string;
  type: string;
  muscle: string;
  difficulty: string;
  instructions: string;
};

export default function WorkoutScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('chest');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'expert' | ''>('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

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

  const fetchExercises = async () => {
    try {
      setLoadingExercises(true);
      const params = new URLSearchParams();
      if (muscle) params.append('muscle', muscle);
      if (difficulty) params.append('difficulty', difficulty);

      const res = await axios.get<Exercise[]>(`${API_BASE_URL}/exercises`, {
        params,
      });
      setExercises(res.data);
    } catch (e) {
      console.log('Error fetching exercises', e);
    } finally {
      setLoadingExercises(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
    fetchExercises();
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
          placeholderTextColor="#6b7280"
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

      <ScrollView contentContainerStyle={styles.exercisesSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Explore Exercises
        </ThemedText>

        <View style={styles.filtersRow}>
          <TextInput
            style={styles.muscleInput}
            placeholder="Muscle (e.g. chest, biceps)"
            placeholderTextColor="#6b7280"
            value={muscle}
            onChangeText={setMuscle}
          />
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={difficulty}
              dropdownIconColor="#6b7280"
              style={styles.picker}
              onValueChange={(value) => setDifficulty(value as any)}
            >
              <Picker.Item label="Any difficulty" value="" color="#6b7280" />
              <Picker.Item label="Beginner" value="beginner" color="#e5e7eb" />
              <Picker.Item label="Intermediate" value="intermediate" color="#e5e7eb" />
              <Picker.Item label="Expert" value="expert" color="#e5e7eb" />
            </Picker>
          </View>
          <Pressable style={styles.filterButton} onPress={fetchExercises}>
            <ThemedText style={styles.filterButtonText}>
              {loadingExercises ? 'Loading...' : 'Search'}
            </ThemedText>
          </Pressable>
        </View>

        {exercises.map((ex) => (
          <React.Fragment key={ex.name}>
            <ThemedView style={styles.exerciseCard}>
              <ThemedText type="defaultSemiBold" style={styles.exerciseTitle}>
                {ex.name}
              </ThemedText>
              <ThemedText style={styles.exerciseMeta}>
                {ex.type} • {ex.muscle} • {ex.difficulty}
              </ThemedText>
              <ThemedText style={styles.exerciseInstructions}>{ex.instructions}</ThemedText>
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
    borderColor: '#1f2937',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#e5e7eb',
  },
  addButton: {
    borderRadius: 999,
    paddingHorizontal: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#38bdf8',
  },
  addButtonText: {
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
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
  exercisesSection: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  filtersRow: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
  },
  muscleInput: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#e5e7eb',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#020617',
  },
  picker: {
    color: '#e5e7eb',
  },
  filterButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 8,
    backgroundColor: '#38bdf8',
    marginTop: 2,
  },
  filterButtonText: {
    fontWeight: '600',
  },
  exerciseCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 10,
  },
  exerciseTitle: {
    marginBottom: 4,
  },
  exerciseMeta: {
    opacity: 0.8,
    marginBottom: 6,
  },
  exerciseInstructions: {
    opacity: 0.9,
  },
});


