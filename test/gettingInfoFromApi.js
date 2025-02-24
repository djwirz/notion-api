import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const WORKOUT_PAGE_ID = process.env.WORKOUT_PAGE_ID;
const NOTION_API_URL = 'https://api.notion.com/v1';
const HEADERS = {
	Authorization: `Bearer ${NOTION_API_KEY}`,
	'Notion-Version': '2022-06-28',
	'Content-Type': 'application/json',
};

const summarizePage = (page) => ({
	id: page.id,
	url: page.url,
	name: page.properties?.Name?.title?.[0]?.plain_text || 'Unnamed',
	reps: page.properties?.Reps?.number || 0,
	weight: page.properties?.Weight?.number || 0,
	set: page.properties?.['Set #']?.rich_text?.[0]?.plain_text || 'N/A',
});

const logTruncatedList = (list, label, limit = 5) => {
	console.log(`✅ Found ${list.length} ${label}:`);
	list.slice(0, limit).forEach((item, index) => {
		console.log(`  [${index + 1}] ${JSON.stringify(summarizePage(item))}`);
	});
	if (list.length > limit) console.log(`  ...and ${list.length - limit} more.`);
};

const fetchWorkoutDetails = async () => {
	console.log('🔹 Fetching workout details...');
	const response = await fetch(`${NOTION_API_URL}/pages/${WORKOUT_PAGE_ID}`, { headers: HEADERS });
	const workoutPage = await response.json();
	if (workoutPage.object === 'error') throw new Error(workoutPage.message);

	console.log('✅ Workout Details:', summarizePage(workoutPage));
	return workoutPage;
};

const fetchWorkoutTemplateExercises = async (templateId) => {
	console.log('🔹 Fetching exercises from Workout Template...');
	const response = await fetch(`${NOTION_API_URL}/databases/${templateId}/query`, {
		method: 'POST',
		headers: HEADERS,
		body: JSON.stringify({}),
	});
	const templateExercises = await response.json();
	if (templateExercises.object === 'error') throw new Error(templateExercises.message);

	logTruncatedList(templateExercises.results, 'template exercises');
	return templateExercises.results;
};

const main = async () => {
	try {
		const workoutPage = await fetchWorkoutDetails();
		const templateId = workoutPage.properties['Workout Template'].relation?.[0]?.id;
		if (!templateId) throw new Error('No related Workout Template found.');
		console.log(`✅ Found related Workout Template: ${templateId}`);

		const templateExercises = await fetchWorkoutTemplateExercises(templateId);

		templateExercises.forEach((exercise) => {
			try {
				const exerciseName = exercise.properties.Name?.title?.[0]?.plain_text || 'Unnamed Exercise';
				console.log(`✅ Processing: ${exerciseName}`);
			} catch (error) {
				console.error(`[ERROR] Failed processing exercise: ${JSON.stringify(summarizePage(exercise))}`);
				throw error;
			}
		});

		console.log('✅ Done!');
	} catch (error) {
		console.error('❌ Error:', error.message);
	}
};

main();
