import { fetchWorkoutTemplateEntries, fetchWorkoutTemplateId } from "./notionService";
import { NotionClient } from "../clients/notionClient";
import { Env, WorkoutEntry } from "../utils/types";

/**
 * Duplicates workout entries based on a template.
 */
export async function duplicateWorkoutEntries(workoutId: string, env: Env): Promise<void> {
	try {
		const debugMode = env.DEBUG === "true";
		const notionClient = new NotionClient(env);

		// Fetch all possible template entries first (ensuring proper structure)
		const templateMap = await fetchWorkoutTemplateEntries(env);
		const templateId = await fetchWorkoutTemplateId(workoutId, env);

		if (!templateId) {
			console.warn(`⚠️ No template found for WORKOUT_ID: ${workoutId}`);
			return;
		}

		const templateEntries = templateMap[templateId];

		if (!templateEntries || templateEntries.length === 0) {
			console.warn(`⚠️ No workout entries found for TEMPLATE_ID: ${templateId}`);
			return;
		}

		console.log(`✅ Duplicating ${templateEntries.length} workout entries...`);

		for (let i = 0; i < templateEntries.length; i++) {
			const entry = templateEntries[i];

			await notionClient.createPage(env.WORKOUT_ENTRIES_DB_ID, {
				Workout: { relation: [{ id: workoutId }] },
				Exercises: { relation: [{ id: entry.exerciseId }] },
				set: { rich_text: [{ text: { content: entry.set } }] },
				weight: { rich_text: [{ text: { content: entry.weight.toString() } }] },
				reps: { rich_text: [{ text: { content: entry.reps.toString() } }] },
			});

			// Log every 10 entries instead of each one
			if (i % 10 === 0 || i === templateEntries.length - 1) {
				console.log(`✅ Created ${i + 1}/${templateEntries.length} workout entries.`);
			}

			// Avoid rate limits
			await new Promise((resolve) => setTimeout(resolve, 500));
		}

		console.log("✅ All workout entries successfully duplicated.");
	} catch (error: unknown) {
		console.error("❌ Error duplicating workout entries:", error);
		throw error;
	}
}
