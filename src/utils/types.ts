export interface Env {
	NOTION_API_KEY: string;
	WORKOUT_ENTRY_TEMPLATES_DB_ID: string;
	WORKOUT_ENTRIES_DB_ID: string;
}

export interface NotionResponse {
	results: any[];
	next_cursor?: string | null;
}

export interface NotionCreateProperties {
	Workout: { relation: Array<{ id: string }> };
	Exercises: { relation: Array<{ id: string }> };
	set: { rich_text: Array<{ text: { content: string } }> };
	weight: { rich_text: Array<{ text: { content: string } }> };
	reps: { rich_text: Array<{ text: { content: string } }> };
}

export interface WorkoutEntry {
	id: string;
	exerciseId: string;
	reps: number;
	weight: number;
	set: string;
}