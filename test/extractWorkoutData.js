import dotenv from 'dotenv';
import createWorkoutEntry from './createWorkoutEntry.js';

dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const WORKOUT_ID = normalizeId(process.env.WORKOUT_ID);
const WORKOUT_ENTRY_TEMPLATES_DB_ID = process.env.WORKOUT_ENTRY_TEMPLATES_DB_ID;

if (!WORKOUT_ID) {
	console.error('❌ ERROR: WORKOUT_ID is required.');
	process.exit(1);
}

function normalizeId(id) {
	return id ? id.replace(/-/g, '') : '';
}

const HEADERS = {
	Authorization: `Bearer ${NOTION_API_KEY}`,
	'Content-Type': 'application/json',
	'Notion-Version': '2022-06-28',
};

async function fetchWorkoutTemplateEntries() {
	console.log('🔍 Fetching all workout template entries...');
	let templateEntries = [];
	let cursor = undefined;

	do {
		const response = await fetch(`https://api.notion.com/v1/databases/${WORKOUT_ENTRY_TEMPLATES_DB_ID}/query`, {
			method: 'POST',
			headers: HEADERS,
			body: JSON.stringify(cursor ? { start_cursor: cursor } : {}),
		});
		const data = await response.json();

		if (!response.ok) {
			console.error('❌ Failed to fetch workout template entries:', data);
			process.exit(1);
		}

		templateEntries = [...templateEntries, ...data.results];
		cursor = data.next_cursor;
	} while (cursor);

	console.log(`✅ Retrieved ${templateEntries.length} workout template entries.`);
	return templateEntries;
}

async function fetchNewWorkoutDetails(workoutId) {
	console.log(`🔍 Fetching details for WORKOUT_ID: ${workoutId}...`);

	const response = await fetch(`https://api.notion.com/v1/pages/${workoutId}`, {
		method: 'GET',
		headers: HEADERS,
	});
	const data = await response.json();

	if (!response.ok) {
		console.error('❌ Error fetching workout details:', data);
		return null;
	}

	console.log('✅ Workout details retrieved.');
	const workoutTemplateProp = data.properties?.['Workout Template'];

	if (workoutTemplateProp?.relation?.length > 0) {
		const templateId = normalizeId(workoutTemplateProp.relation[0].id);
		console.log(`✅ Matched to workout template: ${templateId}`);
		return templateId;
	}

	console.log('⚠️ No linked template found for this workout.');
	return null;
}

async function buildTemplateEntryStructure() {
	const templateEntries = await fetchWorkoutTemplateEntries();
	const templateMap = {};

	templateEntries.forEach((entry) => {
		const templateProp = entry.properties?.['workout template'];
		const exerciseProp = entry.properties?.['Exercise'];

		if (templateProp?.relation?.length > 0 && exerciseProp?.relation?.length > 0) {
			const templateId = normalizeId(templateProp.relation[0].id);
			const exerciseId = normalizeId(exerciseProp.relation[0].id);

			if (!templateMap[templateId]) {
				templateMap[templateId] = [];
			}
			templateMap[templateId].push({
				id: entry.id,
				exerciseId,
				reps: entry.properties?.['Reps']?.number || 0,
				weight: entry.properties?.['Weight']?.number || 0,
				set: entry.properties?.['Set #']?.rich_text?.[0]?.plain_text || 'N/A',
			});
		}
	});

	console.log('✅ Built structured template map.');
	console.table(
		Object.entries(templateMap).map(([templateId, entries]) => ({
			templateId,
			entryCount: entries.length,
		}))
	);

	return templateMap;
}

async function duplicateWorkoutEntries() {
	const templateMap = await buildTemplateEntryStructure();

	console.log(`🔎 Determining template used for WORKOUT_ID: ${WORKOUT_ID}...`);
	let templateUsed = await fetchNewWorkoutDetails(WORKOUT_ID);

	if (!templateUsed) {
		console.log(`⚠️ No matching template found for WORKOUT_ID: ${WORKOUT_ID}`);
		return;
	}

	templateUsed = normalizeId(templateUsed);

	if (!templateMap[templateUsed]) {
		console.log(`⚠️ No template entries found for matched template ID: ${templateUsed}`);
		return;
	}

	console.log(`✅ Duplicating ${templateMap[templateUsed].length} workout entries...`);

	for (const entry of templateMap[templateUsed]) {
		const workoutData = {
			workoutId: WORKOUT_ID,
			exerciseId: entry.exerciseId,
			setNumber: entry.set,
			reps: entry.reps,
			weight: entry.weight,
		};

		await createWorkoutEntry(workoutData);
		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	console.log('✅ All workout entries successfully duplicated.');
}

duplicateWorkoutEntries();
