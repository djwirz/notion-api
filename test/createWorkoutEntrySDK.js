import dotenv from 'dotenv';

dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const WORKOUT_ENTRIES_DB_ID = process.env.WORKOUT_ENTRIES_DB_ID;

const HEADERS = {
	Authorization: `Bearer ${NOTION_API_KEY}`,
	'Content-Type': 'application/json',
	'Notion-Version': '2022-06-28',
};

/**
 * Creates a new workout entry in Notion.
 * @param {Object} workoutData - The structured data including workoutId, exerciseId, setNumber, reps, weight.
 */
async function createWorkoutEntry(workoutData) {
	const { workoutId, exerciseId, setNumber, reps, weight } = workoutData;

	if (!workoutId || !exerciseId) {
		console.error('❌ Missing required workout or exercise ID.');
		return;
	}

	const newEntry = {
		parent: { database_id: WORKOUT_ENTRIES_DB_ID },
		properties: {
			Workout: { relation: [{ id: workoutId }] },
			Exercises: { relation: [{ id: exerciseId }] },
			set: { rich_text: [{ text: { content: setNumber.toString() } }] },
			weight: { rich_text: [{ text: { content: weight.toString() } }] },
			reps: { rich_text: [{ text: { content: reps.toString() } }] },
		},
	};

	console.log('📌 Creating Workout Entry with:', JSON.stringify(newEntry, null, 2));

	const response = await fetch('https://api.notion.com/v1/pages', {
		method: 'POST',
		headers: HEADERS,
		body: JSON.stringify(newEntry),
	});

	if (!response.ok) {
		console.error('❌ Error creating workout entry:', await response.text());
		return;
	}

	const data = await response.json();
	console.log(`✅ Successfully created workout entry: ${data.id}`);
}

// Run only if called directly
if (process.argv.length > 2) {
	const workoutData = {
		workoutId: process.argv[2], // Pass workout ID as first argument
		exerciseId: process.argv[3], // Pass exercise ID as second argument
		setNumber: process.argv[4] || 1, // Default to 1 if not provided
		reps: process.argv[5] || 10, // Default to 10 if not provided
		weight: process.argv[6] || 0, // Default to 0 if not provided
	};

	createWorkoutEntry(workoutData);
}

export default createWorkoutEntry;
