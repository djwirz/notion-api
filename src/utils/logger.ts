import { Client } from "@notionhq/client";

// ✅ Initialize Notion Client
function getNotionClient(env: any) {
	return new Client({ auth: env.NOTION_API_KEY });
}

/**
 * Logs API interactions in Notion.
 */
export async function logApiInteraction(
	endpoint: string,
	requestData: any,
	responseData: any,
	status: string,
	env: any
) {
	const notion = getNotionClient(env);

	// Avoid exceeding Notion's character limit (2000 chars per rich_text)
	const truncateText = (text: string) => (text.length > 2000 ? text.substring(0, 2000) + "..." : text);

	const body = {
		parent: { database_id: env.NOTION_INBOX_DB_ID },
		properties: {
			Name: { title: [{ text: { content: `API Call: ${endpoint}` } }] },
			Timestamp: { date: { start: new Date().toISOString() } },
			Status: { select: { name: status } },
			Request: { rich_text: [{ text: { content: truncateText(JSON.stringify(requestData, null, 2)) } }] },
			Response: { rich_text: [{ text: { content: truncateText(JSON.stringify(responseData, null, 2)) } }] },
		},
	};

	try {
		await notion.pages.create(body);
	} catch (error) {
		console.error(`[ERROR] Failed to log API interaction: ${error}`);
	}
}
