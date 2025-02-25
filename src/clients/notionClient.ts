import { Env } from "../utils/types";

export class NotionClient {
	private notionApiKey: string;
	private debugMode: boolean;

	constructor(env: Env) {
		this.notionApiKey = env.NOTION_API_KEY;
		this.debugMode = env.DEBUG === "true";
	}

	async createPage(databaseId: string, properties: any) {
		if (this.debugMode) {
			console.log(`📝 Creating page in database: ${databaseId}`);
		}

		const response = await fetch("https://api.notion.com/v1/pages", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.notionApiKey}`,
				"Content-Type": "application/json",
				"Notion-Version": "2022-06-28",
			},
			body: JSON.stringify({
				parent: { database_id: databaseId },
				properties,
			}),
		});

		const responseData = await response.json();

		if (!response.ok) {
			console.error(`❌ Notion API error: ${JSON.stringify(responseData)}`);
			throw new Error(`Notion API request failed`);
		}
		if (this.debugMode) {
			console.log(`✅ Page created: ${(responseData as { id: string }).id}`);
		}

		return responseData;
	}
}
