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

interface Env {
	NOTION_API_KEY: string;
	WORKOUT_ENTRY_TEMPLATES_DB_ID: string;
	WORKOUT_ENTRIES_DB_ID: string;
}

interface NotionRelation {
	relation: Array<{ id: string }>;
	type: "relation";
}

interface NotionNumber {
	number: number;
	type: "number";
}

interface NotionRichText {
	rich_text: Array<{ plain_text: string; text: { content: string } }>;
	type: "rich_text";
}

interface NotionProperties {
	"workout template"?: NotionRelation;
	"Exercise"?: NotionRelation;
	"Workout Template"?: {
		relation: Array<{ id: string }>;
		type: "relation";
	};
	"Exercises"?: NotionRelation;
	"Reps"?: NotionNumber;
	"Weight"?: NotionNumber;
	"Set #"?: NotionRichText;
}

interface NotionPage {
	id: string;
	properties: NotionProperties;
}

interface NotionResponse {
	results: NotionPage[];
	next_cursor: string | null;
}

interface WorkoutEntry {
	id: string;
	exerciseId: string;
	reps: number;
	weight: number;
	set: string;
	workoutId?: string;
}

function normalizeId(id?: string): string {
	return id ? id.replace(/-/g, "") : "";
}

function getHeaders(env: Env): HeadersInit {
	return {
		Authorization: `Bearer ${env.NOTION_API_KEY}`,
		"Content-Type": "application/json",
		"Notion-Version": "2022-06-28",
	};
}

async function fetchWorkoutTemplateEntries(env: Env): Promise<NotionPage[]> {
	console.log("🔍 Fetching all workout template entries...");
	let templateEntries: NotionPage[] = [];
	let cursor: string | undefined = undefined;

	do {
		const response = await fetch(`https://api.notion.com/v1/databases/${env.WORKOUT_ENTRY_TEMPLATES_DB_ID}/query`, {
			method: "POST",
			headers: getHeaders(env),
			body: JSON.stringify(cursor ? { start_cursor: cursor } : {}),
		});
		const data: NotionResponse = await response.json();

		if (!response.ok) {
			throw new Error(`Failed to fetch workout template entries: ${JSON.stringify(data)}`);
		}

		templateEntries = [...templateEntries, ...data.results];
		cursor = data.next_cursor ?? undefined;
	} while (cursor);

	console.log(`✅ Retrieved ${templateEntries.length} workout template entries.`);
	return templateEntries;
}

async function fetchNewWorkoutDetails(workoutId: string, env: Env): Promise<string | undefined> {
	console.log(`🔍 Fetching details for WORKOUT_ID: ${workoutId}...`);

	const response = await fetch(`https://api.notion.com/v1/pages/${workoutId}`, {
		method: "GET",
		headers: getHeaders(env),
	});
	
	const data = await response.json() as {
		properties: {
			"Workout Template"?: {
				relation: Array<{ id: string }>;
			};
		};
	};

	if (!response.ok) {
		throw new Error(`Error fetching workout details: ${JSON.stringify(data)}`);
	}

	console.log("✅ Workout details retrieved.");
	const workoutTemplateProp = data.properties["Workout Template"];
	return workoutTemplateProp?.relation?.[0]?.id 
		? normalizeId(workoutTemplateProp.relation[0].id) 
		: undefined;
}

async function buildTemplateEntryStructure(env: Env): Promise<Record<string, WorkoutEntry[]>> {
	const templateEntries = await fetchWorkoutTemplateEntries(env);
	const templateMap: Record<string, WorkoutEntry[]> = {};

	templateEntries.forEach((entry) => {
		const templateProp = entry.properties["workout template"];
		const exerciseProp = entry.properties["Exercise"];

		if (templateProp?.relation?.[0]?.id && exerciseProp?.relation?.[0]?.id) {
			const templateId = normalizeId(templateProp.relation[0].id);
			const exerciseId = normalizeId(exerciseProp.relation[0].id);

			if (!templateMap[templateId]) {
				templateMap[templateId] = [];
			}
			templateMap[templateId].push({
				id: entry.id,
				exerciseId,
				reps: entry.properties["Reps"]?.number ?? 0,
				weight: entry.properties["Weight"]?.number ?? 0,
				set: entry.properties["Set #"]?.rich_text?.[0]?.plain_text ?? "N/A",
			});
		}
	});

	console.log("✅ Built structured template map.");
	console.table(
		Object.entries(templateMap).map(([templateId, entries]) => ({
			templateId,
			entryCount: entries.length,
		}))
	);

	return templateMap;
}

interface NotionPropertyValue {
	relation: Array<{ id: string }>;
}

interface NotionRichTextValue {
	rich_text: Array<{ text: { content: string } }>;
}

interface NotionCreateProperties {
	Workout: NotionPropertyValue;
	Exercises: NotionPropertyValue;
	set: NotionRichTextValue;
	weight: NotionRichTextValue;
	reps: NotionRichTextValue;
}

interface NotionCreatePage {
	parent: { database_id: string };
	properties: NotionCreateProperties;
}

async function createWorkoutEntry(workoutData: WorkoutEntry, env: Env): Promise<void> {
	const { workoutId, exerciseId, set, reps, weight } = workoutData;

	if (!workoutId || !exerciseId) {
		console.error("❌ Missing required workout or exercise ID.");
		return;
	}

	const newEntry: NotionCreatePage = {
		parent: { database_id: env.WORKOUT_ENTRIES_DB_ID },
		properties: {
			Workout: { relation: [{ id: workoutId }] },
			Exercises: { relation: [{ id: exerciseId }] },
			set: { rich_text: [{ text: { content: set } }] },
			weight: { rich_text: [{ text: { content: weight.toString() } }] },
			reps: { rich_text: [{ text: { content: reps.toString() } }] },
		},
	};

	console.log("📌 Creating Workout Entry with:", JSON.stringify(newEntry, null, 2));

	const response = await fetch("https://api.notion.com/v1/pages", {
		method: "POST",
		headers: getHeaders(env),
		body: JSON.stringify(newEntry),
	});

	const data = (await response.json()) as { id: string };

	if (!response.ok) {
		throw new Error(`Failed to create workout entry: ${JSON.stringify(data)}`);
	}

	console.log(`✅ Successfully created workout entry: ${data.id}`);
}

async function duplicateWorkoutEntries(workoutId: string, env: Env): Promise<void> {
	try {
		const templateMap = await buildTemplateEntryStructure(env);
		const normalizedWorkoutId = normalizeId(workoutId);

		console.log(`🔎 Determining template used for WORKOUT_ID: ${normalizedWorkoutId}...`);
		const templateUsed = await fetchNewWorkoutDetails(normalizedWorkoutId, env);

		if (templateUsed === undefined) {
			console.log(`⚠️ No matching template found for WORKOUT_ID: ${normalizedWorkoutId}`);
			return;
		}

		const normalizedTemplateId = normalizeId(templateUsed);

		if (!templateMap[normalizedTemplateId]) {
			console.log(`⚠️ No template entries found for matched template ID: ${normalizedTemplateId}`);
			return;
		}

		console.log(`✅ Duplicating ${templateMap[normalizedTemplateId].length} workout entries...`);

		for (const entry of templateMap[normalizedTemplateId]) {
			const workoutData: WorkoutEntry = {
				...entry,
				workoutId: normalizedWorkoutId,
			};

			await createWorkoutEntry(workoutData, env);
			await new Promise((resolve) => setTimeout(resolve, 500));
		}

		console.log("✅ All workout entries successfully duplicated.");
	} catch (error: unknown) {
		if (error instanceof Error) {
			throw error;
		}
		const errorMessage = error && typeof error === 'object' ? JSON.stringify(error) : 'An unknown error occurred';
		throw new Error(errorMessage);
	}
}
