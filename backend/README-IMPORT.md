# Exercise Data Import Guide

This guide explains how to import exercise data from a CSV file (e.g., from workoutcool.lol) into your GymRack database.

## Step 1: Get Your CSV File

1. Download the CSV file from workoutcool.lol or any other source
2. Place it in the `backend` directory
3. Name it `exercises.csv` (or use any name you prefer)

## Step 2: Check CSV Format

The import script supports flexible column names. It will look for:
- **Name**: `name`, `Name`, `Exercise`, `exercise`
- **Type**: `type`, `Type`, `category`, `Category`
- **Muscle**: `muscle`, `Muscle`, `target`, `Target`
- **Equipment**: `equipment`, `Equipment`, `tools`, `Tools`
- **Difficulty**: `difficulty`, `Difficulty`, `level`, `Level`
- **Instructions**: `instructions`, `Instructions`, `description`, `Description`

## Step 3: Run the Import

```bash
cd backend

# If your CSV is named exercises.csv (default)
npm run import-exercises

# Or specify a custom path
node import-exercises.js path/to/your/file.csv
```

## Step 4: Verify Import

The script will:
- ✅ Create the `exercises` table if it doesn't exist
- ✅ Parse your CSV file
- ✅ Insert exercises into the database
- ✅ Skip duplicates (based on exercise name)
- ✅ Show you how many exercises were imported

## How It Works

1. **Database First**: The `/exercises` endpoint now checks the database first
2. **API Fallback**: If no exercises are found in the database, it falls back to API Ninjas
3. **Smart Filtering**: You can still filter by muscle, type, and difficulty
4. **YouTube Integration**: Exercises are automatically enriched with YouTube video links

## Example CSV Format

```csv
name,type,muscle,equipment,difficulty,instructions
Bench Press,strength,chest,barbell,intermediate,"Lie on bench, lower bar to chest, press up"
Squat,strength,legs,barbell,beginner,"Stand with feet shoulder-width, lower down, stand up"
```

## Troubleshooting

- **"CSV file not found"**: Make sure the file path is correct
- **"Error creating exercises table"**: Check your database connection in `.env`
- **No exercises imported**: Check your CSV format and column names

## Notes

- Duplicate exercises (same name) will be updated, not duplicated
- The import is idempotent - you can run it multiple times safely
- Exercises are limited to 100 results per query for performance


