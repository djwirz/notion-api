import { logApiInteraction } from "./logger";
import { getWorkoutTemplate, getWorkoutEntryTemplates } from "./notionClient";

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    try {
      const url = new URL(request.url);
      const workoutId = url.searchParams.get("workout_id");

      if (!workoutId) {
        return new Response(JSON.stringify({ error: "Missing workout_id." }), { status: 400 });
      }

      console.log(`[INFO] Received request for workout_id: ${workoutId}`);

      // ✅ Log initial API request
      await logApiInteraction("/api/generateWorkoutEntries", { workoutId }, { message: "API hit logged" }, "Success", env);

      // ✅ Fetch Workout Template
      const workoutTemplateId = await getWorkoutTemplate(workoutId, env);

      if (!workoutTemplateId) {
        await logApiInteraction("/api/generateWorkoutEntries", { workoutId }, { error: "Workout Template not found" }, "Error", env);
        return new Response(JSON.stringify({ error: "Workout Template not found." }), { status: 404 });
      }

      console.log(`[INFO] Found workout template: ${workoutTemplateId}`);

      // ✅ Log that we successfully retrieved the template
      await logApiInteraction("/api/generateWorkoutEntries", { workoutId, workoutTemplateId }, { message: "Workout Template retrieved" }, "Success", env);

      // ✅ Fetch Workout Entry Templates
      const entryTemplates = await getWorkoutEntryTemplates(workoutTemplateId, env);

      // ✅ Log that we successfully retrieved the entry templates
      await logApiInteraction("/api/generateWorkoutEntries", 
        { workoutId, workoutTemplateId }, 
        { message: "Entry Templates retrieved", count: entryTemplates.length }, 
        "Success", 
        env
      );

      return new Response(JSON.stringify({ 
        message: "Workout data retrieved successfully.", 
        workoutTemplateId,
        entryTemplates 
      }), { status: 200 });

    } catch (error: any) {
      console.error("[ERROR] Worker crashed:", error);
      await logApiInteraction("/api/generateWorkoutEntries", {}, { error: error.message }, "Error", env);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
  },
};
