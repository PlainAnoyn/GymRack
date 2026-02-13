require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Local dev: fall back to a known-good connection string if env vars are misconfigured.
const fallbackConnectionString =
  process.env.DATABASE_URL || 'postgres://postgres:1234567890@localhost:5432/gymrack';

const pool = new Pool({
  connectionString: fallbackConnectionString,
});

const API_NINJAS_KEY = process.env.API_NINJAS_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Fuzzy string matching using Levenshtein distance
function levenshteinDistance(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const matrix = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

function calculateSimilarity(str1, str2) {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  return 1 - distance / maxLength;
}

async function findSimilarExerciseName(pool, exerciseName, userId = 1) {
  try {
    // Get all unique exercise names for this user
    const result = await pool.query(
      'SELECT DISTINCT exercise_name FROM workout_logs WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) return null;

    const exerciseNames = result.rows.map((row) => row.exercise_name);
    let bestMatch = null;
    let bestSimilarity = 0;
    const threshold = 0.7; // 70% similarity threshold

    for (const name of exerciseNames) {
      const similarity = calculateSimilarity(exerciseName, name);
      if (similarity > bestSimilarity && similarity >= threshold) {
        bestSimilarity = similarity;
        bestMatch = name;
      }
    }

    return bestMatch && bestSimilarity >= threshold ? bestMatch : null;
  } catch (err) {
    console.error('Error finding similar exercise:', err);
    return null;
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/workouts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workouts ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

app.post('/workouts', async (req, res) => {
  const { user_id, name, date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO workouts (user_id, name, date) VALUES ($1, $2, $3) RETURNING *',
      [user_id, name, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

app.delete('/workouts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM workouts WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'workout_not_found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

app.get('/exercises', async (req, res) => {
  try {
    if (!API_NINJAS_KEY) {
      return res.status(500).json({ error: 'missing_api_key' });
    }

    const { muscle, type, difficulty } = req.query;
    const params = new URLSearchParams();
    if (muscle) params.append('muscle', muscle.toString());
    if (type) params.append('type', type.toString());
    if (difficulty) params.append('difficulty', difficulty.toString());

    const url = `https://api.api-ninjas.com/v1/exercises${params.toString() ? `?${params}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'X-Api-Key': API_NINJAS_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Ninjas error', response.status, errorText);
      return res.status(502).json({ error: 'upstream_error', message: errorText });
    }

    const data = await response.json();
    
    // Enrich exercises with YouTube video thumbnails and URLs
    const enrichedData = await Promise.all(
      data.map(async (exercise) => {
        // Create YouTube search URL for exercise tutorials
        const searchQuery = encodeURIComponent(`${exercise.name} ${exercise.muscle} exercise tutorial`);
        const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
        
        let thumbnailUrl = null;
        let videoId = null;
        
        // Try to get YouTube video thumbnail using YouTube Data API
        if (YOUTUBE_API_KEY) {
          try {
            const youtubeSearchUrl_api = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(`${exercise.name} ${exercise.muscle} exercise`)}&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`;
            const youtubeResponse = await fetch(youtubeSearchUrl_api);
            
            if (youtubeResponse.ok) {
              const youtubeData = await youtubeResponse.json();
              if (youtubeData.items && youtubeData.items.length > 0) {
                videoId = youtubeData.items[0].id.videoId;
                thumbnailUrl = youtubeData.items[0].snippet.thumbnails.high?.url || 
                              youtubeData.items[0].snippet.thumbnails.medium?.url ||
                              youtubeData.items[0].snippet.thumbnails.default?.url;
              }
            }
          } catch (err) {
            console.error('YouTube API error:', err);
          }
        }
        
        // Fallback to placeholder if no thumbnail found
        if (!thumbnailUrl) {
          thumbnailUrl = `https://via.placeholder.com/400x300/1f2937/38bdf8?text=${encodeURIComponent(exercise.name)}`;
        }
        
        return {
          ...exercise,
          youtubeSearchUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : youtubeSearchUrl,
          thumbnailUrl,
          videoId,
        };
      })
    );

    res.json(enrichedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

app.post('/health/metrics', (req, res) => {
  try {
    const { heightCm, weightKg, age, gender } = req.body || {};

    if (!heightCm || !weightKg || !age || !gender) {
      return res.status(400).json({ error: 'missing_parameters' });
    }

    const h = Number(heightCm);
    const w = Number(weightKg);
    const a = Number(age);
    const g = String(gender).toLowerCase();

    const heightM = h / 100;
    const bmi = w / (heightM * heightM);

    let bmr;
    if (g === 'male' || g === 'm') {
      bmr = 10 * w + 6.25 * h - 5 * a + 5;
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a - 161;
    }

    res.json({
      bmi: Number(bmi.toFixed(1)),
      bmr: Math.round(bmr),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

app.get('/steps-today', (req, res) => {
  try {
    // TODO: Integrate with Google Fit / another real step source.
    // For now, return a stable placeholder so the app can call a real API.
    const steps = 5423;
    res.json({ steps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// Workout Logs endpoints
app.get('/workout-logs', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM workout_logs ORDER BY date DESC, created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// Endpoint to get exercise name suggestions
app.get('/exercise-suggestions', async (req, res) => {
  try {
    const { query, user_id } = req.query;
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const result = await pool.query(
      'SELECT DISTINCT exercise_name FROM workout_logs WHERE user_id = $1',
      [user_id || 1]
    );

    const exerciseNames = result.rows.map((row) => row.exercise_name);
    const suggestions = exerciseNames
      .map((name) => ({
        name,
        similarity: calculateSimilarity(query, name),
      }))
      .filter((item) => item.similarity >= 0.5) // 50% similarity threshold for suggestions
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5) // Top 5 suggestions
      .map((item) => item.name);

    res.json(suggestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

app.post('/workout-logs', async (req, res) => {
  const { user_id, exercise_name, muscle_group, weight, reps, date, is_pr } = req.body;
  try {
    // Check for similar exercise name (spelling correction)
    const correctedName = await findSimilarExerciseName(pool, exercise_name, user_id || 1);
    const finalExerciseName = correctedName || exercise_name;

    // Check for previous PR for this exercise (using corrected name)
    const previousPR = await pool.query(
      `SELECT weight, reps FROM workout_logs 
       WHERE user_id = $1 AND exercise_name = $2 AND is_pr = true 
       ORDER BY weight DESC, reps DESC, date DESC LIMIT 1`,
      [user_id || 1, finalExerciseName]
    );

    let isNewPR = false;
    let previousPRData = null;

    if (previousPR.rows.length > 0) {
      const prev = previousPR.rows[0];
      previousPRData = { weight: prev.weight, reps: prev.reps };
      
      // Check if new workout is better (higher weight OR same weight with more reps)
      const newVolume = parseFloat(weight) * parseInt(reps);
      const prevVolume = parseFloat(prev.weight) * parseInt(prev.reps);
      
      if (parseFloat(weight) > parseFloat(prev.weight) || 
          (parseFloat(weight) === parseFloat(prev.weight) && parseInt(reps) > parseInt(prev.reps)) ||
          newVolume > prevVolume) {
        isNewPR = true;
        // Unmark previous PR
        await pool.query(
          'UPDATE workout_logs SET is_pr = false WHERE user_id = $1 AND exercise_name = $2 AND is_pr = true',
          [user_id || 1, finalExerciseName]
        );
      }
    } else {
      // First time doing this exercise, mark as PR
      isNewPR = true;
    }

    // Insert new log with PR flag (using corrected name)
    const result = await pool.query(
      `INSERT INTO workout_logs (user_id, exercise_name, muscle_group, weight, reps, date, is_pr) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user_id || 1, finalExerciseName, muscle_group, weight, reps, date || new Date().toISOString().slice(0, 10), isNewPR || is_pr]
    );

    res.status(201).json({
      ...result.rows[0],
      is_new_pr: isNewPR,
      previous_pr: previousPRData,
      corrected_name: correctedName ? finalExerciseName : null,
      original_name: correctedName ? exercise_name : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
});

app.delete('/workout-logs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM workout_logs WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'log_not_found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// Ensure workout_logs table exists
async function ensureWorkoutLogsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workout_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL DEFAULT 1,
        exercise_name VARCHAR(255) NOT NULL,
        muscle_group VARCHAR(100) NOT NULL,
        weight DECIMAL(10, 2),
        reps INTEGER,
        date DATE NOT NULL,
        is_pr BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Workout logs table ensured');
  } catch (err) {
    console.error('Error ensuring workout_logs table:', err);
  }
}

ensureWorkoutLogsTable();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
