import { fetchWorkoutTemplateEntries, fetchWorkoutTemplateId } from "./notionService";
import { NotionClient } from "../clients/notionClient";
import { Env } from "../utils/types";

export async function duplicateWorkoutEntries(workoutId: string, env: Env): Promise<void> {
	const notionClient = new NotionClient(env);
	const templateMap = await fetchWorkoutTemplateEntries(env);
	const templateId = await fetchWorkoutTemplateId(workoutId, env);

	if (!templateId || !templateMap[templateId]) return;

	for (const entry of templateMap[templateId]) {
		await notionClient.createPage({
			Workout: { relation: [{ id: workoutId }] },
			Exercises: { relation: [{ id: entry.exerciseId }] },
			set: { rich_text: [{ text: { content: entry.set } }] },
			weight: { rich_text: [{ text: { content: entry.weight.toString() } }] },
			reps: { rich_text: [{ text: { content: entry.reps.toString() } }] },
		});
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
}