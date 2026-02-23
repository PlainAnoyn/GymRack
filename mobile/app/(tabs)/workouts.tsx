import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View, Pressable, ScrollView, Linking, Image } from 'react-native';
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

type Video = {
  url: string;
  angle: string;
  gender: string;
  og_image: string;
};

type Exercise = {
  id?: number;
  name: string;
  primary_muscles?: string[];
  secondary_muscles?: string[];
  category?: string;
  force?: string;
  mechanic?: string;
  difficulty?: string;
  steps?: string[];
  videos?: Video[];
  // Legacy fields
  type: string;
  muscle: string;
  equipment: string;
  instructions: string;
  thumbnailUrl?: string;
  youtubeSearchUrl?: string;
  videoId?: string;
};

const MUSCLE_AREAS = [
  { key: 'chest', label: 'Chest', muscleParam: 'chest' },
  { key: 'back', label: 'Back', muscleParam: 'back' },
  { key: 'shoulders', label: 'Shoulders', muscleParam: 'shoulders' },
  { key: 'biceps', label: 'Biceps', muscleParam: 'biceps' },
  { key: 'triceps', label: 'Triceps', muscleParam: 'triceps' },
  { key: 'quads', label: 'Quads', muscleParam: 'quads' },
  { key: 'hamstrings', label: 'Hamstrings', muscleParam: 'hamstrings' },
  { key: 'glutes', label: 'Glutes', muscleParam: 'glutes' },
  { key: 'calves', label: 'Calves', muscleParam: 'calves' },
  { key: 'abs', label: 'Abs', muscleParam: 'abs' },
];

export default function WorkoutScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('chest');
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
      const res = await axios.get<Exercise[]>(`${API_BASE_URL}/exercises`, {
        params: {
          muscle: muscle || undefined,
        },
      });
      setExercises(res.data);
    } catch (e) {
      console.log('Error fetching exercises', e);
      setExercises([]);
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

          <ThemedView style={styles.bodyMapCard}>
            <ThemedText style={styles.bodyMapTitle}>Pick a muscle group</ThemedText>
            <ThemedText style={styles.bodyMapSubtitle}>
              Tap a button to load targeted exercises for that area.
            </ThemedText>
            <View style={styles.bodyMapGrid}>
              {MUSCLE_AREAS.map((area) => {
                const isActive = muscle === area.muscleParam;
                return (
                  <Pressable
                    key={area.key}
                    style={[styles.muscleChip, isActive && styles.muscleChipActive]}
                    onPress={() => {
                      setMuscle(area.muscleParam);
                      fetchExercises();
                    }}
                  >
                    <ThemedText
                      style={[styles.muscleChipText, isActive && styles.muscleChipTextActive]}
                    >
                      {area.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </ThemedView>

          {loadingExercises ? (
            <ThemedView style={styles.loadingCard}>
              <ThemedText style={styles.loadingText}>Loading exercises...</ThemedText>
            </ThemedView>
          ) : exercises.length === 0 ? (
            <ThemedView style={styles.emptyCard}>
              <ThemedText style={styles.emptyText}>No exercises found for this muscle group.</ThemedText>
            </ThemedView>
          ) : (
            exercises.map((ex) => {
              const videos = ex.videos || [];
              const steps = ex.steps || [];
              const primaryMuscles = ex.primary_muscles || [];
              const allMuscles = [...primaryMuscles, ...(ex.secondary_muscles || [])];

              // Get up to 4 videos for grid (prioritize different angles/genders)
              const displayVideos = videos.slice(0, 4);

              return (
                <ThemedView key={ex.id || ex.name} style={styles.exerciseCard}>
                  {/* Header with title and category tag */}
                  <View style={styles.exerciseHeaderRow}>
                    <View style={styles.exerciseTitleContainer}>
                      <ThemedText type="defaultSemiBold" style={styles.exerciseTitle}>
                        {ex.name}
                      </ThemedText>
                      <View style={styles.exerciseMetaRow}>
                        {ex.difficulty && (
                          <View style={styles.metaBadge}>
                            <ThemedText style={styles.metaBadgeText}>⚡ {ex.difficulty}</ThemedText>
                          </View>
                        )}
                        {ex.mechanic && (
                          <View style={styles.metaBadge}>
                            <ThemedText style={styles.metaBadgeText}>📚 {ex.mechanic}</ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                    {ex.category && (
                      <View style={styles.categoryTag}>
                        <ThemedText style={styles.categoryTagText}>{ex.category}</ThemedText>
                      </View>
                    )}
                  </View>

                  {/* Video thumbnails grid */}
                  {displayVideos.length > 0 && (
                    <View style={styles.videoSection}>
                      <View style={styles.videoSectionHeader}>
                        <ThemedText style={styles.videoSectionTitle}>📹 DEMONSTRATIONS</ThemedText>
                        <ThemedText style={styles.videoCountText}>
                          {videos.length} angle{videos.length !== 1 ? 's' : ''} available
                        </ThemedText>
                      </View>
                      <View style={styles.videoGrid}>
                        {displayVideos.map((video, idx) => (
                          <Pressable
                            key={idx}
                            style={styles.videoThumbnail}
                            onPress={() => Linking.openURL(video.url)}
                          >
                            <Image
                              source={{ uri: video.og_image }}
                              style={styles.videoImage}
                              resizeMode="cover"
                            />
                            <View style={styles.videoOverlay}>
                              <View style={styles.videoLabel}>
                                <ThemedText style={styles.videoLabelText}>
                                  {video.angle.toUpperCase()}
                                </ThemedText>
                              </View>
                              <View style={styles.playButton}>
                                <ThemedText style={styles.playButtonText}>▶</ThemedText>
                              </View>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Exercise Details */}
                  <View style={styles.detailsSection}>
                    <ThemedText style={styles.detailsTitle}>ℹ️ EXERCISE DETAILS</ThemedText>
                    
                    {allMuscles.length > 0 && (
                      <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>💪 PRIMARY MUSCLES</ThemedText>
                        <ThemedText style={styles.detailValue}>{allMuscles.join(' ')}</ThemedText>
                      </View>
                    )}

                    {ex.force && (
                      <View style={styles.detailRow}>
                        <ThemedText style={styles.detailLabel}>📊 FORCE TYPE</ThemedText>
                        <ThemedText style={styles.detailValue}>{ex.force}</ThemedText>
                      </View>
                    )}
                  </View>

                  {/* Instructions */}
                  {steps.length > 0 && (
                    <View style={styles.instructionsSection}>
                      <ThemedText style={styles.instructionsTitle}>INSTRUCTIONS</ThemedText>
                      {steps.map((step, idx) => (
                        <View key={idx} style={styles.stepRow}>
                          <View style={styles.stepNumber}>
                            <ThemedText style={styles.stepNumberText}>{idx + 1}</ThemedText>
                          </View>
                          <ThemedText style={styles.stepText}>{step}</ThemedText>
                        </View>
                      ))}
                    </View>
                  )}
                </ThemedView>
              );
            })
          )}
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
  bodyMapCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 12,
  },
  bodyMapTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  bodyMapSubtitle: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 12,
  },
  bodyMapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  muscleChip: {
    minWidth: '30%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  muscleChipActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#0f172a',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  muscleChipText: {
    fontSize: 13,
    color: '#e5e7eb',
  },
  muscleChipTextActive: {
    color: '#38bdf8',
    fontWeight: '600',
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
    backgroundColor: '#0f172a',
  },
  picker: {
    color: '#38bdf8',
    backgroundColor: '#0f172a',
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
    padding: 20,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 20,
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  exerciseTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  exerciseMetaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  metaBadgeText: {
    fontSize: 12,
    color: '#e5e7eb',
  },
  categoryTag: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryTagText: {
    color: '#020617',
    fontWeight: '600',
    fontSize: 12,
  },
  videoSection: {
    marginBottom: 20,
  },
  videoSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  videoCountText: {
    fontSize: 12,
    opacity: 0.7,
    color: '#9ca3af',
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  videoThumbnail: {
    width: '48%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1f2937',
    position: 'relative',
  },
  videoImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    padding: 8,
  },
  videoLabel: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  videoLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  playButton: {
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 16,
    color: '#020617',
    marginLeft: 2,
  },
  detailsSection: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 12,
  },
  detailRow: {
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    opacity: 0.7,
    color: '#9ca3af',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  instructionsSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#020617',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#e5e7eb',
    lineHeight: 20,
  },
  loadingCard: {
    borderRadius: 20,
    padding: 40,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    opacity: 0.7,
    fontSize: 15,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 40,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    marginTop: 20,
  },
  emptyText: {
    opacity: 0.6,
    fontSize: 15,
    textAlign: 'center',
  },
});


