require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const API_NINJAS_KEY = process.env.API_NINJAS_KEY;

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
      console.error('API Ninjas error', response.status, await response.text());
      return res.status(502).json({ error: 'upstream_error' });
    }

    const data = await response.json();
    res.json(data);
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});


