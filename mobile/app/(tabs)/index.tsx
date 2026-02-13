import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import axios from 'axios';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useGoogleFitSteps } from '@/hooks/use-google-fit-steps';
import { API_BASE_URL } from '@/constants/api';

type WorkoutSummary = {
  date: string;
};

export default function HomeScreen() {
  const { stepsToday } = useGoogleFitSteps();
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0);
  const [targetSessions] = useState(5);
  const [daysWithWorkout, setDaysWithWorkout] = useState<boolean[]>([false, false, false, false, false, false, false]);

  useEffect(() => {
    const fetchWeeklyWorkouts = async () => {
      try {
        const res = await axios.get<WorkoutSummary[]>(`${API_BASE_URL}/workouts`);

        const now = new Date();
        const day = now.getDay(); // 0 (Sun) - 6 (Sat)
        const mondayOffset = day === 0 ? -6 : 1 - day;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const days = [false, false, false, false, false, false, false];
        const uniqueDates = new Set<string>();

        res.data.forEach((w) => {
          if (!w.date) return;
          const d = new Date(w.date);
          if (d >= monday && d <= sunday) {
            const jsDay = d.getDay();
            const idx = jsDay === 0 ? 6 : jsDay - 1; // Monday=0 ... Sunday=6
            days[idx] = true;
            uniqueDates.add(w.date);
          }
        });

        setDaysWithWorkout(days);
        setSessionsThisWeek(uniqueDates.size);
      } catch (e) {
        console.log('Error fetching weekly workouts', e);
      }
    };

    fetchWeeklyWorkouts();
  }, []);

  const currentDayIndex = (() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  })();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroRow}>
          <View style={styles.heroText}>
            <ThemedText type="title" style={styles.heading}>
              GymRack
            </ThemedText>
            <ThemedText style={styles.subheading}>
              Track your steps, workouts, and diet in one place.
            </ThemedText>
          </View>
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={styles.heroImage}
            contentFit="cover"
          />
        </View>

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
            <ThemedText style={styles.cardLabel}>Steps today</ThemedText>
            <ThemedText type="title" style={styles.cardMain}>
              {stepsToday ?? '—'}
            </ThemedText>
            <ThemedText style={styles.cardCaption}>Synced from activity data</ThemedText>
          </ThemedView>
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
            <React.Fragment key={d + i}>
              <ThemedView
                style={[
                  styles.dayChip,
                  i === currentDayIndex && styles.dayChipActive,
                  daysWithWorkout[i] && styles.dayChipHasWorkout,
                ]}
              >
                <ThemedText
                  style={
                    i === currentDayIndex ? styles.dayChipTextActive : styles.dayChipText
                  }
                >
                  {d}
                </ThemedText>
              </ThemedView>
            </React.Fragment>
          ))}
        </ThemedView>

        <ThemedView style={styles.progressCard}>
          <ThemedText style={styles.cardLabel}>Sessions completed</ThemedText>
          <ThemedText type="title" style={styles.cardMain}>
            {sessionsThisWeek} / {targetSessions}
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
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroText: {
    flex: 1,
    marginRight: 12,
  },
  heroImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  heading: {
    marginBottom: 4,
    fontSize: 22,
  },
  subheading: {
    opacity: 0.8,
    marginBottom: 12,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  primaryCard: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1d4ed8',
  },
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
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
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  dayChipActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  dayChipHasWorkout: {
    borderColor: '#38bdf8',
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

