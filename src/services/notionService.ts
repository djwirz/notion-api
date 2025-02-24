import { NotionClient } from "../clients/notionClient";
import { normalizeId } from "../utils/utils";
import { Env, WorkoutEntry } from "../utils/types";

export async function fetchWorkoutTemplateEntries(env: Env): Promise<Record<string, WorkoutEntry[]>> {
	const notionClient = new NotionClient(env);
	const templateEntries = await notionClient.queryDatabase(env.WORKOUT_ENTRY_TEMPLATES_DB_ID);
	console.log("📌 Retrieved workout template entries:", templateEntries.results.length);
	const templateMap: Record<string, WorkoutEntry[]> = {};

	templateEntries.results.forEach((entry) => {
		const templateId = normalizeId(entry.properties["workout template"]?.relation?.[0]?.id);
		const exerciseId = normalizeId(entry.properties["Exercise"]?.relation?.[0]?.id);

		if (templateId && exerciseId) {
			if (!templateMap[templateId]) templateMap[templateId] = [];
			templateMap[templateId].push({
				id: entry.id,
				exerciseId,
				reps: entry.properties["Reps"]?.number ?? 0,
				weight: entry.properties["Weight"]?.number ?? 0,
				set: entry.properties["Set #"]?.rich_text?.[0]?.plain_text ?? "N/A",
			});
		}
	});

	return templateMap;
}

export async function fetchWorkoutTemplateId(workoutId: string, env: Env): Promise<string | undefined> {
	const notionClient = new NotionClient(env);
	const data = await notionClient.getPage(workoutId);
	const workoutTemplateId = data.properties["Workout Template"]?.relation?.[0]?.id ? normalizeId(data.properties["Workout Template"].relation[0].id) : undefined;
	console.log("📌 Retrieved workout template ID:", workoutTemplateId);
	return workoutTemplateId;
}