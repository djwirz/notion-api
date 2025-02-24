import { Env, NotionResponse, NotionCreateProperties } from "../utils/types";

export class NotionClient {
	private env: Env;

	constructor(env: Env) {
		this.env = env;
	}

	private getHeaders(): HeadersInit {
		return {
			Authorization: `Bearer ${this.env.NOTION_API_KEY}`,
			"Content-Type": "application/json",
			"Notion-Version": "2022-06-28",
		};
	}

	async queryDatabase(databaseId: string, body: object = {}): Promise<NotionResponse> {
		console.log("🔍 Querying Notion database:", databaseId);
		const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
			method: "POST",
			headers: this.getHeaders(),
			body: JSON.stringify(body),
		});
		const data = await response.json() as NotionResponse;
		console.log("✅ Retrieved database response:", data);
		return data;
	}

	async getPage(pageId: string): Promise<any> {
		console.log("🔍 Fetching Notion page:", pageId);
		const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
			method: "GET",
			headers: this.getHeaders(),
		});
		const data = await response.json();
		console.log("✅ Retrieved page response:", data);
		return data;
	}

	async createPage(properties: NotionCreateProperties): Promise<string> {
		console.log("📌 Creating Notion page with properties:", JSON.stringify(properties, null, 2));
		const response = await fetch("https://api.notion.com/v1/pages", {
			method: "POST",
			headers: this.getHeaders(),
			body: JSON.stringify({ parent: { database_id: this.env.WORKOUT_ENTRIES_DB_ID }, properties }),
		});
		const data = await response.json() as { id: string };
		if (!response.ok) throw new Error(`Failed to create workout entry: ${JSON.stringify(data)}`);
		console.log("✅ Successfully created Notion entry:", data.id);
		return data.id;
	}
}