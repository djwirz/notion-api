import dotenv from 'dotenv';

dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const WORKOUT_ENTRIES_DB_ID = process.env.WORKOUT_ENTRIES_DB_ID;

const HEADERS = {
	Authorization: `Bearer ${NOTION_API_KEY}`,
	'Content-Type': 'application/json',
	'Notion-Version': '2022-06-28',
};

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
		workoutId: process.argv[2],
		exerciseId: process.argv[3],
		setNumber: process.argv[4] || 1,
		reps: process.argv[5] || 10,
		weight: process.argv[6] || 0,
	};

	createWorkoutEntry(workoutData);
}

export default createWorkoutEntry;
