require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Pool } = require('pg');

// Database connection
const fallbackConnectionString =
  process.env.DATABASE_URL || 'postgres://postgres:1234567890@localhost:5432/gymrack';

const pool = new Pool({
  connectionString: fallbackConnectionString,
});

// Create exercises table if it doesn't exist
async function createExercisesTable() {
  try {
    // Create table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        muscle VARCHAR(100),
        equipment VARCHAR(100),
        difficulty VARCHAR(50),
        instructions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name)
      )
    `);

    // Add video_url column if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE exercises ADD COLUMN IF NOT EXISTS video_url VARCHAR(500)
      `);
    } catch (err) {
      // Column might already exist, ignore
    }

    // Add thumbnail_url column if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE exercises ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500)
      `);
    } catch (err) {
      // Column might already exist, ignore
    }

    console.log('✅ Exercises table created/verified');
  } catch (err) {
    console.error('Error creating exercises table:', err);
    throw err;
  }
}

// Remove HTML tags from text
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

// Import CSV data - handles normalized format
async function importCSV(csvFilePath) {
  const exerciseMap = new Map(); // id -> exercise object

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(csvFilePath)) {
      reject(new Error(`CSV file not found: ${csvFilePath}`));
      return;
    }

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const id = row.id;
        const attributeName = row.attribute_name;
        const attributeValue = row.attribute_value;

        // Initialize exercise if not exists
        if (!exerciseMap.has(id)) {
          exerciseMap.set(id, {
            id: id,
            name: row.name_en || row.name || '',
            description: row.description_en || row.description || '',
            videoUrl: row.full_video_url || '',
            thumbnailUrl: row.full_video_image_url || '',
            types: [],
            primaryMuscles: [],
            secondaryMuscles: [],
            equipment: [],
            mechanicsType: '',
          });
        }

        const exercise = exerciseMap.get(id);

        // Process attributes based on attribute_name
        switch (attributeName) {
          case 'TYPE':
            if (attributeValue && !exercise.types.includes(attributeValue)) {
              exercise.types.push(attributeValue);
            }
            break;
          case 'PRIMARY_MUSCLE':
            if (attributeValue && !exercise.primaryMuscles.includes(attributeValue)) {
              exercise.primaryMuscles.push(attributeValue);
            }
            break;
          case 'SECONDARY_MUSCLE':
            if (attributeValue && !exercise.secondaryMuscles.includes(attributeValue)) {
              exercise.secondaryMuscles.push(attributeValue);
            }
            break;
          case 'EQUIPMENT':
            if (attributeValue && !exercise.equipment.includes(attributeValue)) {
              exercise.equipment.push(attributeValue);
            }
            break;
          case 'MECHANICS_TYPE':
            exercise.mechanicsType = attributeValue || '';
            break;
        }
      })
      .on('end', () => {
        // Convert map to array and format exercises
        const exercises = Array.from(exerciseMap.values()).map((ex) => {
          // Combine primary and secondary muscles
          const allMuscles = [...ex.primaryMuscles, ...ex.secondaryMuscles];
          const muscle = allMuscles.length > 0 ? allMuscles.join(', ') : '';

          // Get first type as main type
          const type = ex.types.length > 0 ? ex.types[0] : '';

          // Combine equipment
          const equipment = ex.equipment.length > 0 ? ex.equipment.join(', ') : '';

          // Determine difficulty based on mechanics type or type
          let difficulty = '';
          if (ex.mechanicsType === 'COMPOUND') {
            difficulty = 'intermediate';
          } else if (ex.mechanicsType === 'ISOLATION') {
            difficulty = 'beginner';
          } else if (ex.types.includes('PLYOMETRICS') || ex.types.includes('CROSSFIT')) {
            difficulty = 'expert';
          } else {
            difficulty = 'intermediate';
          }

          // Clean instructions from HTML
          const instructions = stripHtml(ex.description);

          return {
            name: ex.name.trim(),
            type: type,
            muscle: muscle.toLowerCase(),
            equipment: equipment,
            difficulty: difficulty,
            instructions: instructions,
            videoUrl: ex.videoUrl,
            thumbnailUrl: ex.thumbnailUrl,
          };
        });

        console.log(`📊 Parsed ${exercises.length} unique exercises from CSV`);
        resolve(exercises);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

// Insert exercises into database
async function insertExercises(exercises) {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const exercise of exercises) {
    // Skip if name is missing
    if (!exercise.name || !exercise.name.trim()) {
      skipped++;
      continue;
    }

    try {
      const result = await pool.query(
        `INSERT INTO exercises (name, type, muscle, equipment, difficulty, instructions, video_url, thumbnail_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (name) DO UPDATE SET
           type = EXCLUDED.type,
           muscle = EXCLUDED.muscle,
           equipment = EXCLUDED.equipment,
           difficulty = EXCLUDED.difficulty,
           instructions = EXCLUDED.instructions,
           video_url = EXCLUDED.video_url,
           thumbnail_url = EXCLUDED.thumbnail_url
         RETURNING *`,
        [
          exercise.name.trim(),
          exercise.type || null,
          exercise.muscle || null,
          exercise.equipment || null,
          exercise.difficulty || null,
          exercise.instructions || null,
          exercise.videoUrl || null,
          exercise.thumbnailUrl || null,
        ]
      );

      if (result.rows[0]) {
        // Check if it was an insert or update
        const wasUpdate = result.rows[0].created_at !== result.rows[0].updated_at;
        if (wasUpdate) {
          updated++;
        } else {
          inserted++;
        }
      }
    } catch (err) {
      console.error(`Error inserting exercise "${exercise.name}":`, err.message);
      skipped++;
    }
  }

  console.log(`✅ Inserted ${inserted} new exercises`);
  if (updated > 0) {
    console.log(`🔄 Updated ${updated} existing exercises`);
  }
  if (skipped > 0) {
    console.log(`⚠️  Skipped ${skipped} exercises (errors)`);
  }
}

// Main function
async function main() {
  const csvFilePath = process.argv[2] || path.join(__dirname, 'CSV', 'sample-exercises.csv');

  console.log('🚀 Starting exercise import...');
  console.log(`📁 CSV file: ${csvFilePath}`);

  try {
    // Create table
    await createExercisesTable();

    // Import CSV
    const exercises = await importCSV(csvFilePath);

    // Insert into database
    await insertExercises(exercises);

    console.log('✨ Import completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Import failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
