import { fetchWorkoutTemplateEntries, fetchWorkoutTemplateId } from "./notionService";
import { NotionClient } from "../clients/notionClient";
import { logApiInteraction } from "../utils/logger";
import { Env, WorkoutEntry } from "../utils/types";

/**
 * Duplicates workout entries based on a template.
 */
export async function duplicateWorkoutEntries(workoutId: string, env: Env): Promise<void> {
	try {
		const debugMode = env.DEBUG === "true";
		const notionClient = new NotionClient(env);

		// Fetch all possible template entries first
		const templateMap = await fetchWorkoutTemplateEntries(env);
		const templateId = await fetchWorkoutTemplateId(workoutId, env);

		if (!templateId) {
			console.warn(`⚠️ No template found for WORKOUT_ID: ${workoutId}`);
			await logApiInteraction("/fetchWorkoutTemplateId", { workoutId }, { error: "No template found" }, "Failed", env);
			return;
		}

		const templateEntries = templateMap[templateId];

		if (!templateEntries || templateEntries.length === 0) {
			console.warn(`⚠️ No workout entries found for TEMPLATE_ID: ${templateId}`);
			await logApiInteraction("/fetchWorkoutTemplateEntries", { templateId }, { error: "No entries found" }, "Failed", env);
			return;
		}

		console.log(`✅ Duplicating ${templateEntries.length} workout entries...`);

		// Batch API calls (max 3 concurrent requests)
		const BATCH_SIZE = 3;
		for (let i = 0; i < templateEntries.length; i += BATCH_SIZE) {
			const batch = templateEntries.slice(i, i + BATCH_SIZE);

			const results = await Promise.allSettled(
				batch.map((entry) =>
					notionClient.createPage(
						env.WORKOUT_ENTRIES_DB_ID, // ✅ Fix: Ensure correct database ID
						{
							Workout: { relation: [{ id: workoutId }] },
							Exercises: { relation: [{ id: entry.exerciseId }] },
							set: { rich_text: [{ text: { content: entry.set } }] },
							weight: { rich_text: [{ text: { content: entry.weight.toString() } }] },
							reps: { rich_text: [{ text: { content: entry.reps.toString() } }] },
						},
						env // ✅ Fix: Ensure env is passed
					)
				)
			);

			// Log API interactions in Notion
			await logApiInteraction("/createWorkoutEntry", batch, results, "Completed", env);

			// Error handling for failed requests
			const failedRequests = results.filter((res) => res.status === "rejected");
			if (failedRequests.length > 0) {
				console.error(`❌ ${failedRequests.length} entries failed.`);
				await logApiInteraction("/createWorkoutEntry", batch, failedRequests, "Failed", env);
			}

			// Log every batch instead of each request
			console.log(`✅ Created ${Math.min(i + BATCH_SIZE, templateEntries.length)}/${templateEntries.length} workout entries.`);

			// Avoid rate limits
			await new Promise((resolve) => setTimeout(resolve, 500));
		}

		console.log("✅ All workout entries successfully duplicated.");
		await logApiInteraction("/duplicateWorkoutEntries", { workoutId, templateId }, { status: "Success" }, "Completed", env);
	} catch (error: unknown) {
		console.error("❌ Error duplicating workout entries:", error);
		await logApiInteraction("/duplicateWorkoutEntries", { workoutId }, { error }, "Failed", env);
		throw error;
	}
}
