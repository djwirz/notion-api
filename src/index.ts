import { duplicateWorkoutEntries } from "./services/workoutService";
import { Env } from "./utils/types";

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const workoutId = url.searchParams.get("workout_id");

		if (!workoutId) {
			return new Response(JSON.stringify({ error: "Missing required 'workout_id' parameter." }), { status: 400 });
		}

		try {
			await duplicateWorkoutEntries(workoutId, env);
			return new Response(JSON.stringify({ message: "Workout entries duplicated successfully." }), { status: 200 });
		} catch (error: any) {
			console.error("❌ Error duplicating workout entries:", error);
			return new Response(JSON.stringify({ error: error.message }), { status: 500 });
		}
	},
};