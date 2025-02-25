import { duplicateWorkoutEntries } from "./services/workoutService";
import { processMarkdownToPdf } from "./services/markdownToPdfService";
import { processHomepageResumeCreation } from "./services/homepageResumeCreationService";
import { Env } from "./utils/types";

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Preserve `workout_id` without remapping
		const workoutId = url.searchParams.get("workout_id");
		const markdownId = url.searchParams.get("id");
		const resumeId = url.searchParams.get("id");
		const type = url.searchParams.get("type");

		// Explicit validation per service type
		if (type === "workout" && !workoutId) {
			return new Response(JSON.stringify({ error: "Missing required parameter: workout_id" }), { status: 400 });
		}
		if ((type === "pdf" || type === "resume") && !markdownId && !resumeId) {
			return new Response(JSON.stringify({ error: "Missing required parameter: id" }), { status: 400 });
		}

		try {
			switch (type) {
				case "workout":
					await duplicateWorkoutEntries(workoutId!, env);
					break;
				case "pdf":
					await processMarkdownToPdf(markdownId!);
					break;
				case "resume":
					await processHomepageResumeCreation(resumeId!);
					break;
				default:
					return new Response(JSON.stringify({ error: `Invalid type: ${type}` }), { status: 400 });
			}

			return new Response(JSON.stringify({ message: `Successfully processed ${type} request.` }), { status: 200 });
		} catch (error: any) {
			console.error(`❌ Error processing request: ${error.message}`);
			return new Response(JSON.stringify({ error: error.message }), { status: 500 });
		}
	},
};
