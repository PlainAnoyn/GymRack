import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View, Pressable, ScrollView, Linking } from 'react-native';
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
  thumbnailUrl?: string;
  youtubeSearchUrl?: string;
  videoId?: string;
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

  const deleteWorkout = async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/workouts/${id}`);
      fetchWorkouts();
    } catch (e) {
      console.log('Error deleting workout', e);
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

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.workoutsSection}>
          {workouts.map((item) => (
            <ThemedView key={item.id.toString()} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
                  <ThemedText style={styles.cardDate}>{item.date}</ThemedText>
                </View>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => deleteWorkout(item.id)}
                >
                  <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                </Pressable>
              </View>
              <ThemedText style={styles.cardTag}>Strength • Custom routine</ThemedText>
            </ThemedView>
          ))}
        </View>

        <View style={styles.exercisesSection}>
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
              <View style={styles.exerciseHeader}>
                <ThemedText style={styles.exerciseMeta}>
                  {ex.type} • {ex.muscle} • {ex.difficulty}
                </ThemedText>
                
                {ex.youtubeSearchUrl && (
                  <Pressable
                    style={styles.watchVideoButton}
                    onPress={() => Linking.openURL(ex.youtubeSearchUrl!)}
                  >
                    <ThemedText style={styles.watchVideoButtonText}>▶ Watch Video</ThemedText>
                  </Pressable>
                )}
              </View>
              
              <ThemedText style={styles.exerciseInstructions}>{ex.instructions}</ThemedText>
            </ThemedView>
          </React.Fragment>
        ))}
        </View>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  workoutsSection: {
    marginBottom: 24,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 16,
    gap: 16,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: '600',
  },
  cardDate: {
    opacity: 0.7,
    marginTop: 2,
  },
  deleteButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ef4444',
    marginLeft: 12,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardTag: {
    opacity: 0.8,
  },
  exercisesSection: {
    paddingTop: 24,
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
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  exerciseMeta: {
    opacity: 0.8,
    flex: 1,
  },
  exerciseInstructions: {
    opacity: 0.9,
  },
  watchVideoButton: {
    backgroundColor: '#ff0000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  watchVideoButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
});


