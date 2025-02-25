import { Client } from "@notionhq/client";

// ✅ Initialize Notion Client
function getNotionClient(env: any) {
	return new Client({ auth: env.NOTION_API_KEY });
}

/**
 * Truncate text to Notion's 2000 character limit, stripping unnecessary whitespace.
 */
function truncateText(text: string, limit = 2000) {
	const compactText = JSON.stringify(text).replace(/\s+/g, " ").substring(0, limit);
	return compactText.length >= limit ? compactText + "..." : compactText;
}

/**
 * Logs API interactions in Notion with controlled logging frequency.
 */
export async function logApiInteraction(
	endpoint: string,
	requestData: any,
	responseData: any,
	status: string,
	env: any,
	forceLog = false // Ensure errors always get logged
) {
	const notion = getNotionClient(env);

	// ✅ Log every 5th request, but always log failures
	const shouldLog = forceLog || Math.random() < 0.2;
	if (!shouldLog) {
		console.log(`[LOG] Skipping Notion log to reduce subrequest load: ${endpoint}`);
		return;
	}

	const body = {
		parent: { database_id: env.NOTION_INBOX_DB_ID },
		properties: {
			Name: { title: [{ text: { content: `API Call: ${endpoint}` } }] },
			Timestamp: { date: { start: new Date().toISOString() } },
			Status: { select: { name: status } },
			Request: { rich_text: [{ text: { content: truncateText(requestData) } }] },
			Response: { rich_text: [{ text: { content: truncateText(responseData) } }] },
		},
	};

	try {
		await notion.pages.create(body);
	} catch (error) {
		console.error(`[ERROR] Failed to log API interaction: ${error}`);
	}
}
