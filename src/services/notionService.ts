import { Env, NotionResponse, WorkoutEntry } from "../utils/types";
import { normalizeId } from "../utils/utils";

function getHeaders(env: Env): HeadersInit {
	return {
		Authorization: `Bearer ${env.NOTION_API_KEY}`,
		"Content-Type": "application/json",
		"Notion-Version": "2022-06-28",
	};
}

/**
 * Fetches workout template entries and returns them as a structured map.
 */
export async function fetchWorkoutTemplateEntries(env: Env): Promise<Record<string, WorkoutEntry[]>> {
	console.log("🔍 Fetching all workout template entries...");

	let templateEntries: Record<string, WorkoutEntry[]> = {};
	let cursor: string | undefined = undefined;
	let totalEntries = 0;

	do {
		const response = await fetch(
			`https://api.notion.com/v1/databases/${env.WORKOUT_ENTRY_TEMPLATES_DB_ID}/query`,
			{
				method: "POST",
				headers: getHeaders(env),
				body: JSON.stringify(cursor ? { start_cursor: cursor } : {}),
			}
		);

		const data: NotionResponse = await response.json();

		if (!response.ok) {
			console.error(`❌ API error: ${JSON.stringify(data)}`);
			throw new Error(`Failed to fetch workout template entries`);
		}

		data.results.forEach((entry) => {
			const properties = entry.properties;

			// Match POC logic by ensuring exact and fallback lookups for property names
			const templateProp = properties["Workout Template"] || properties["workout template"];
			const exerciseProp = properties["Exercises"] || properties["Exercise"];

			const templateId = templateProp?.relation?.[0]?.id ? normalizeId(templateProp.relation[0].id) : null;
			const exerciseId = exerciseProp?.relation?.[0]?.id ? normalizeId(exerciseProp.relation[0].id) : null;

			if (!templateId || !exerciseId) return;

			if (!templateEntries[templateId]) {
				templateEntries[templateId] = [];
			}

			templateEntries[templateId].push({
				id: entry.id,
				exerciseId,
				reps: properties["Reps"]?.number ?? 0,
				weight: properties["Weight"]?.number ?? 0,
				set: properties["Set #"]?.rich_text?.[0]?.plain_text ?? "N/A",
			});
			totalEntries++;
		});

		cursor = data.next_cursor ?? undefined;
	} while (cursor);

	console.log(`✅ Retrieved ${totalEntries} workout template entries.`);
	console.log(`📌 Processed ${Object.keys(templateEntries).length} templates.`);
	return templateEntries;
}

/**
 * Fetches the workout template ID associated with a given workout.
 */
export async function fetchWorkoutTemplateId(workoutId: string, env: Env): Promise<string | undefined> {
	console.log(`🔍 Fetching details for WORKOUT_ID: ${workoutId}...`);

	const response = await fetch(`https://api.notion.com/v1/pages/${workoutId}`, {
		method: "GET",
		headers: getHeaders(env),
	});

	const data = await response.json();

	if (!response.ok) {
		console.error(`❌ Notion API error: ${JSON.stringify(data)}`);
		throw new Error(`Error fetching workout details`);
	}
	// Match POC logic for "Workout Template" property
	const workoutTemplateProp = (data as any).properties?.["Workout Template"] || (data as any).properties?.["workout template"];
	const templateId = workoutTemplateProp?.relation?.[0]?.id ? normalizeId(workoutTemplateProp.relation[0].id) : undefined;

	console.log(`✅ Matched TEMPLATE_ID: ${templateId ?? "None"}`);
	return templateId;
}
