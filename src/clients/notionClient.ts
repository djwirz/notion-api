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
		const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
			method: "POST",
			headers: this.getHeaders(),
			body: JSON.stringify(body),
		});
		return await response.json();
	}

	async getPage(pageId: string): Promise<any> {
		const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
			method: "GET",
			headers: this.getHeaders(),
		});
		return await response.json();
	}

	async createPage(properties: NotionCreateProperties): Promise<string> {
		const response = await fetch("https://api.notion.com/v1/pages", {
			method: "POST",
			headers: this.getHeaders(),
			body: JSON.stringify({ parent: { database_id: this.env.WORKOUT_ENTRIES_DB_ID }, properties }),
		});
		const data = await response.json() as { id: string, object: string };
		if (!response.ok) throw new Error(`Failed to create workout entry: ${JSON.stringify(data)}`);
		return data.id;
	}
}