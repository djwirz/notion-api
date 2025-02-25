import { duplicateWorkoutEntries } from "./services/workoutService";
import { processMarkdownToPdf } from "./services/markdownToPdfService";
import { processHomepageResumeCreation } from "./services/homepageResumeCreationService";
import { Env } from "./utils/types";

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const id = url.searchParams.get("id");
		const type = url.searchParams.get("type");

		if (!id || !type) {
			return new Response(JSON.stringify({ error: "Missing required parameters (id, type)." }), { status: 400 });
		}

		try {
			switch (type) {
				case "workout":
					await duplicateWorkoutEntries(id, env);
					break;
				case "pdf":
					await processMarkdownToPdf(id);
					break;
				case "resume":
					await processHomepageResumeCreation(id);
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