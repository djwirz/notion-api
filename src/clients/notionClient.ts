import { Env } from "../utils/types";
import { logApiInteraction } from "../utils/logger";

export class NotionClient {
	private notionApiKey: string;
	private debugMode: boolean;

	constructor(env: Env) {
		this.notionApiKey = env.NOTION_API_KEY;
		this.debugMode = env.DEBUG === "true";
	}

	/**
	 * Creates a new page in Notion.
	 */
	async createPage(databaseId: string, properties: any, env: Env) {
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
				properties, // ✅ Fix: Ensure this matches expected Notion API structure
			}),
		});

		const responseData = await response.json();

		if (!response.ok) {
			console.error(`❌ Notion API error: ${JSON.stringify(responseData)}`);
			await logApiInteraction("/createPage", { databaseId, properties }, responseData, "Failed", env);
			throw new Error(`Notion API request failed`);
		}

		await logApiInteraction("/createPage", { databaseId, properties }, responseData, "Success", env);
		return responseData;
	}
}
