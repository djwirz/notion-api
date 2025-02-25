export interface Env {
	NOTION_API_KEY: string;
	WORKOUT_ENTRY_TEMPLATES_DB_ID: string;
	WORKOUT_ENTRIES_DB_ID: string;
	DEBUG?: string;
}

export interface NotionResponse {
	results: Array<{
		id: string;
		properties: {
			[key: string]: {
				relation?: Array<{ id: string }>;
				number?: number;
				rich_text?: Array<{ plain_text: string }>;
			};
		};
	}>;
	next_cursor?: string | null;
	properties?: {
		[key: string]: {
			relation?: Array<{ id: string }>;
		};
	};
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

export type TemplateEntries = {
	[templateId: string]: WorkoutEntry[];
}