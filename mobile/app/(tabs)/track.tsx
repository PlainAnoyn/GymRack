import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/constants/api';

type WorkoutLog = {
  id: number;
  exercise_name: string;
  muscle_group: string;
  weight: number;
  reps: number;
  date: string;
  is_pr: boolean;
  created_at: string;
};

const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'abs',
  'cardio',
];

export default function TrackScreen() {
  const [exerciseName, setExerciseName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('chest');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [isPR, setIsPR] = useState(false);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [prNotification, setPRNotification] = useState<{
    show: boolean;
    isNewPR: boolean;
    previousPR?: { weight: number; reps: number };
  }>({ show: false, isNewPR: false });
  const [exerciseSuggestions, setExerciseSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [nameCorrected, setNameCorrected] = useState<{
    original: string;
    corrected: string;
  } | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await axios.get<WorkoutLog[]>(`${API_BASE_URL}/workout-logs`);
      setLogs(res.data);
    } catch (e) {
      console.log('Error fetching logs', e);
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setExerciseSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const res = await axios.get<string[]>(`${API_BASE_URL}/exercise-suggestions`, {
        params: { query, user_id: 1 },
      });
      setExerciseSuggestions(res.data);
      setShowSuggestions(res.data.length > 0);
    } catch (e) {
      console.log('Error fetching suggestions', e);
    }
  };

  const handleExerciseNameChange = (text: string) => {
    setExerciseName(text);
    setNameCorrected(null);
    fetchSuggestions(text);
  };

  const selectSuggestion = (suggestion: string) => {
    setExerciseName(suggestion);
    setShowSuggestions(false);
    setExerciseSuggestions([]);
  };

  const addLog = async () => {
    if (!exerciseName.trim() || !weight || !reps) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post<
        WorkoutLog & {
          is_new_pr: boolean;
          previous_pr?: { weight: number; reps: number };
          corrected_name?: string;
          original_name?: string;
        }
      >(`${API_BASE_URL}/workout-logs`, {
        user_id: 1,
        exercise_name: exerciseName.trim(),
        muscle_group: muscleGroup,
        weight: parseFloat(weight),
        reps: parseInt(reps),
        date: new Date().toISOString().slice(0, 10),
        is_pr: isPR,
      });

      // Show spelling correction notification if name was corrected
      if (response.data.corrected_name && response.data.original_name) {
        setNameCorrected({
          original: response.data.original_name,
          corrected: response.data.corrected_name,
        });
        setTimeout(() => {
          setNameCorrected(null);
        }, 4000);
      }

      // Show PR notification
      if (response.data.is_new_pr) {
        setPRNotification({
          show: true,
          isNewPR: true,
          previousPR: response.data.previous_pr || undefined,
        });
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setPRNotification({ show: false, isNewPR: false });
        }, 5000);
      } else if (response.data.previous_pr) {
        setPRNotification({
          show: true,
          isNewPR: false,
          previousPR: response.data.previous_pr,
        });
        setTimeout(() => {
          setPRNotification({ show: false, isNewPR: false });
        }, 5000);
      }

      // Reset form
      setExerciseName('');
      setWeight('');
      setReps('');
      setIsPR(false);
      setMuscleGroup('chest');
      setExerciseSuggestions([]);
      setShowSuggestions(false);

      fetchLogs();
    } catch (e) {
      console.log('Error adding log', e);
      Alert.alert('Error', 'Failed to log workout');
    } finally {
      setLoading(false);
    }
  };

  const deleteLog = async (id: number) => {
    Alert.alert('Delete', 'Are you sure you want to delete this log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/workout-logs/${id}`);
            fetchLogs();
          } catch (e) {
            console.log('Error deleting log', e);
            Alert.alert('Error', 'Failed to delete log');
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>
        Track Workout
      </ThemedText>
      <ThemedText style={styles.subheader}>
        Record your exercises and track your progress.
      </ThemedText>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* PR Notification */}
        {prNotification.show && (
          <ThemedView
            style={[
              styles.prNotification,
              prNotification.isNewPR ? styles.prNotificationNew : styles.prNotificationMissed,
            ]}
          >
            {prNotification.isNewPR ? (
              <>
                <ThemedText style={styles.prNotificationTitle}>🎉 New Personal Record!</ThemedText>
                <ThemedText style={styles.prNotificationText}>
                  You've beaten your previous best!
                </ThemedText>
                {prNotification.previousPR && (
                  <ThemedText style={styles.prNotificationSubtext}>
                    Previous PR: {prNotification.previousPR.weight} kg × {prNotification.previousPR.reps} reps
                  </ThemedText>
                )}
              </>
            ) : (
              <>
                <ThemedText style={styles.prNotificationTitle}>📊 Not a PR</ThemedText>
                <ThemedText style={styles.prNotificationText}>
                  Keep pushing! Your PR is still:
                </ThemedText>
                {prNotification.previousPR && (
                  <ThemedText style={styles.prNotificationSubtext}>
                    {prNotification.previousPR.weight} kg × {prNotification.previousPR.reps} reps
                  </ThemedText>
                )}
              </>
            )}
            <Pressable
              style={styles.prNotificationClose}
              onPress={() => setPRNotification({ show: false, isNewPR: false })}
            >
              <ThemedText style={styles.prNotificationCloseText}>✕</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {/* Input Form */}
        <ThemedView style={styles.formCard}>
          <ThemedText type="subtitle" style={styles.formTitle}>
            Log Exercise
          </ThemedText>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Exercise name (e.g., Bench Press)"
              placeholderTextColor="#6b7280"
              value={exerciseName}
              onChangeText={handleExerciseNameChange}
              onFocus={() => {
                if (exerciseName.length >= 2) {
                  fetchSuggestions(exerciseName);
                }
              }}
              onBlur={() => {
                // Delay hiding suggestions to allow clicking on them
                setTimeout(() => setShowSuggestions(false), 200);
              }}
            />
            {showSuggestions && exerciseSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {exerciseSuggestions.map((suggestion, index) => (
                  <Pressable
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectSuggestion(suggestion)}
                  >
                    <ThemedText style={styles.suggestionText}>{suggestion}</ThemedText>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {nameCorrected && (
            <View style={styles.correctionBanner}>
              <ThemedText style={styles.correctionText}>
                ✏️ Corrected "{nameCorrected.original}" to "{nameCorrected.corrected}"
              </ThemedText>
            </View>
          )}

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={muscleGroup}
              dropdownIconColor="#6b7280"
              style={styles.picker}
              onValueChange={(value) => setMuscleGroup(value)}
            >
              {MUSCLE_GROUPS.map((group) => (
                <Picker.Item
                  key={group}
                  label={group.charAt(0).toUpperCase() + group.slice(1)}
                  value={group}
                  color="#e5e7eb"
                />
              ))}
            </Picker>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <TextInput
                style={styles.input}
                placeholder="Weight (kg)"
                placeholderTextColor="#6b7280"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfInput}>
              <TextInput
                style={styles.input}
                placeholder="Reps"
                placeholderTextColor="#6b7280"
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.prRow}>
            <ThemedText style={styles.prLabel}>Personal Record (PR)</ThemedText>
            <Switch
              value={isPR}
              onValueChange={setIsPR}
              trackColor={{ false: '#1f2937', true: '#38bdf8' }}
              thumbColor={isPR ? '#0ea5e9' : '#6b7280'}
            />
          </View>

          <Pressable
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={addLog}
            disabled={loading}
          >
            <ThemedText style={styles.submitButtonText}>
              {loading ? 'Logging...' : 'Log Workout'}
            </ThemedText>
          </Pressable>
        </ThemedView>

        {/* Workout History */}
        <View style={styles.historySection}>
          <ThemedText type="subtitle" style={styles.historyTitle}>
            Workout History
          </ThemedText>

          {logs.length === 0 ? (
            <ThemedView style={styles.emptyCard}>
              <ThemedText style={styles.emptyText}>
                No workouts logged yet.{'\n'}Start tracking your progress!
              </ThemedText>
            </ThemedView>
          ) : (
            logs.map((log) => (
              <ThemedView key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={styles.logHeaderLeft}>
                    <ThemedText type="defaultSemiBold" style={styles.logExerciseName}>
                      {log.exercise_name}
                    </ThemedText>
                    <ThemedText style={styles.logMuscleGroup}>
                      {log.muscle_group.charAt(0).toUpperCase() + log.muscle_group.slice(1)}
                    </ThemedText>
                  </View>
                  {log.is_pr && (
                    <View style={styles.prBadge}>
                      <ThemedText style={styles.prBadgeText}>PR</ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.logStats}>
                  <View style={styles.statBox}>
                    <ThemedText style={styles.statValue}>{log.weight} kg</ThemedText>
                    <ThemedText style={styles.statLabel}>Weight</ThemedText>
                  </View>
                  <View style={styles.statBox}>
                    <ThemedText style={styles.statValue}>{log.reps}</ThemedText>
                    <ThemedText style={styles.statLabel}>Reps</ThemedText>
                  </View>
                  <View style={styles.statBox}>
                    <ThemedText style={styles.statValue}>
                      {log.weight * log.reps} kg
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>Volume</ThemedText>
                  </View>
                </View>

                <View style={styles.logFooter}>
                  <ThemedText style={styles.logDate}>{formatDate(log.date)}</ThemedText>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => deleteLog(log.id)}
                  >
                    <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                  </Pressable>
                </View>
              </ThemedView>
            ))
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
    marginBottom: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  formCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 24,
  },
  formTitle: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#e5e7eb',
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: '#0f172a',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    marginBottom: 12,
  },
  picker: {
    color: '#e5e7eb',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  prLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  historySection: {
    marginTop: 8,
  },
  historyTitle: {
    marginBottom: 16,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 40,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.6,
    textAlign: 'center',
    fontSize: 15,
  },
  logCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 16,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  logHeaderLeft: {
    flex: 1,
  },
  logExerciseName: {
    fontSize: 18,
    marginBottom: 4,
  },
  logMuscleGroup: {
    opacity: 0.7,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  prBadge: {
    backgroundColor: '#fbbf24',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 12,
  },
  prBadgeText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 11,
  },
  logStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#38bdf8',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  logDate: {
    opacity: 0.6,
    fontSize: 13,
  },
  deleteButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  prNotification: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    position: 'relative',
  },
  prNotificationNew: {
    backgroundColor: '#1e3a5f',
    borderColor: '#38bdf8',
  },
  prNotificationMissed: {
    backgroundColor: '#3f1f1f',
    borderColor: '#6b7280',
  },
  prNotificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  prNotificationText: {
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 4,
  },
  prNotificationSubtext: {
    fontSize: 13,
    opacity: 0.8,
    fontWeight: '600',
    marginTop: 4,
  },
  prNotificationClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prNotificationCloseText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
});

