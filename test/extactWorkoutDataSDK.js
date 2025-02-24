import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import createWorkoutEntry from './createWorkoutEntrySDK.js';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const WORKOUT_ID = normalizeId(process.env.WORKOUT_ID);
const WORKOUTS_DB_ID = process.env.WORKOUTS_DB_ID;
const WORKOUT_ENTRY_TEMPLATES_DB_ID = process.env.WORKOUT_ENTRY_TEMPLATES_DB_ID;
const WORKOUT_ENTRIES_DB_ID = process.env.WORKOUT_ENTRIES_DB_ID;

if (!WORKOUT_ID) {
	console.error('❌ ERROR: WORKOUT_ID is required.');
	process.exit(1);
}

// Normalize Notion IDs (removes dashes)
function normalizeId(id) {
	return id?.replace(/-/g, '') || id;
}

/**
 * Fetch workout template entries and group them by workout template ID
 */
async function fetchWorkoutTemplateEntries() {
	console.log('🔍 Fetching all workout template entries...');
	let templateEntries = [];
	let cursor = undefined;

	do {
		const response = await notion.databases.query({
			database_id: WORKOUT_ENTRY_TEMPLATES_DB_ID,
			start_cursor: cursor,
		});

		templateEntries = [...templateEntries, ...response.results];
		cursor = response.next_cursor;
	} while (cursor);

	console.log(`✅ Retrieved ${templateEntries.length} workout template entries.`);
	return templateEntries;
}

/**
 * Build a structured map: Workout Template → Entries
 */
async function buildTemplateEntryStructure() {
	const templateEntries = await fetchWorkoutTemplateEntries();
	const templateMap = {};

	templateEntries.forEach((entry) => {
		const templateProp = entry.properties?.['workout template'];
		const exerciseProp = entry.properties?.['Exercise']; // Fetching exercise relation

		if (templateProp?.relation?.length > 0 && exerciseProp?.relation?.length > 0) {
			const templateId = normalizeId(templateProp.relation[0].id);
			const exerciseId = normalizeId(exerciseProp.relation[0].id); // Ensure exerciseId is captured

			if (!templateMap[templateId]) {
				templateMap[templateId] = [];
			}
			templateMap[templateId].push({
				id: entry.id,
				exerciseId, // Add exercise ID for duplication
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

/**
 * Fetch details of the newly created workout
 */
async function fetchNewWorkoutDetails(workoutId) {
	console.log(`🔍 Fetching details for WORKOUT_ID: ${workoutId}...`);
	try {
		const response = await notion.pages.retrieve({ page_id: workoutId });

		console.log('✅ Workout details retrieved.');
		const workoutTemplateProp = response.properties?.['Workout Template'];

		if (workoutTemplateProp?.relation?.length > 0) {
			const templateId = normalizeId(workoutTemplateProp.relation[0].id);
			console.log(`✅ Matched to workout template: ${templateId}`);
			return templateId;
		}

		console.log('⚠️ No linked template found for this workout.');
		return null;
	} catch (error) {
		console.error('❌ Error fetching workout details:', error);
		return null;
	}
}

/**
 * Duplicate entries from the workout template into the new workout
 */
async function duplicateWorkoutEntries() {
	const templateMap = await buildTemplateEntryStructure();

	console.log(`🔎 Determining template used for WORKOUT_ID: ${WORKOUT_ID}...`);
	let templateUsed = await fetchNewWorkoutDetails(WORKOUT_ID);

	if (!templateUsed) {
		console.log(`⚠️ No matching template found for WORKOUT_ID: ${WORKOUT_ID}`);
		return;
	}

	// Ensure ID consistency
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

		// Introduce a short delay to avoid Notion rate limits
		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	console.log('✅ All workout entries successfully duplicated.');
}

// Run duplication process
duplicateWorkoutEntries();
