import dotenv from 'dotenv';
import fetch from 'node:fetch';

dotenv.config(); // Load .env variables

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const WORKOUT_ENTRIES_DB_ID = process.env.WORKOUT_ENTRIES_DB_ID;
const WORKOUT_TEMPLATES_DB_ID = process.env.WORKOUT_TEMPLATES_DB_ID;
const WORKOUT_TEMPLATE_ENTRIES_DB_ID = process.env.WORKOUT_TEMPLATE_ENTRIES_DB_ID;
const WORKOUT_ID = process.env.WORKOUT_ID;

const fetchFromNotion = async (endpoint, options = {}) => {
	const url = `https://api.notion.com/v1/${endpoint}`;
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${NOTION_API_KEY}`,
			'Notion-Version': '2022-06-28',
			'Content-Type': 'application/json',
		},
		...options,
	});

	const json = await response.json();
	console.log(`🔍 API Response for ${endpoint}:`, JSON.stringify(json, null, 2));
	return json;
};

// ✅ Step 1: Fetch the `Workout Template` linked to the Workout
const getWorkoutTemplate = async () => {
	console.log('\n🔹 Fetching workout details...');
	const workoutData = await fetchFromNotion(`pages/${WORKOUT_ID}`);

	const templateRelation = workoutData.properties?.['Workout Template']?.relation;
	if (!templateRelation || templateRelation.length === 0) {
		console.error('❌ No Workout Template found for this workout.');
		return null;
	}

	const workoutTemplateId = templateRelation[0].id;
	console.log(`✅ Found related Workout Template: ${workoutTemplateId}`);
	return workoutTemplateId;
};

// ✅ Step 2: Search for Exercises in `Workout Template Entries`
const getWorkoutTemplateExercises = async (workoutTemplateId) => {
	if (!workoutTemplateId) return [];

	console.log('\n🔹 Fetching exercises from Workout Template Entries...');
	const response = await fetchFromNotion(`databases/${WORKOUT_TEMPLATE_ENTRIES_DB_ID}/query`, {
		method: 'POST',
		body: JSON.stringify({
			filter: {
				property: 'workout template',
				relation: { contains: workoutTemplateId },
			},
		}),
	});

	console.log(`✅ Found ${response.results.length} template exercises.`);
	return response.results;
};

// ✅ Step 3: Insert Workout Entries based on Template Exercises
const createWorkoutEntries = async (workoutId, templateExercises) => {
	if (!workoutId || templateExercises.length === 0) return [];

	const newEntries = [];
	for (const exercise of templateExercises) {
		const newEntry = {
			parent: { database_id: WORKOUT_ENTRIES_DB_ID },
			properties: {
				Name: { title: [{ text: { content: exercise.properties.Name.title[0].plain_text } }] },
				'Set #': { rich_text: [{ text: { content: exercise.properties['Set #'].rich_text[0].plain_text } }] },
				Reps: { number: exercise.properties.Reps.number },
				Weight: { number: exercise.properties.Weight.number },
				'Rest Time': { number: exercise.properties['Rest Time'].number },
				Workout: { relation: [{ id: workoutId }] },
			},
		};

		try {
			const response = await fetchFromNotion('pages', { method: 'POST', body: JSON.stringify(newEntry) });
			newEntries.push(response);
		} catch (error) {
			console.error(`[ERROR] Failed to create workout entry:`, error);
		}
	}

	console.log(`✅ Created ${newEntries.length} workout entries.`);
	return newEntries;
};

// ✅ Full Execution
const main = async () => {
	const workoutTemplateId = await getWorkoutTemplate();
	if (!workoutTemplateId) return;

	const templateExercises = await getWorkoutTemplateExercises(workoutTemplateId);
	if (templateExercises.length === 0) {
		console.error('❌ No exercises found in the template.');
		return;
	}

	await createWorkoutEntries(WORKOUT_ID, templateExercises);
};

main();
