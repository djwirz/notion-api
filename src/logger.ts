import { fetchFromNotion } from "./notionClient";

export async function logApiInteraction(endpoint: string, requestData: any, responseData: any, status: string, env: any) {
  const body = {
    parent: { database_id: env.NOTION_INBOX_DB_ID },
    properties: {
      Name: { title: [{ text: { content: `Interaction: ${endpoint}` } }] },
      Timestamp: { date: { start: new Date().toISOString() } },
      Status: { select: { name: status } },
      Request: { rich_text: [{ text: { content: JSON.stringify(requestData, null, 2) } }] },
      Response: { rich_text: [{ text: { content: JSON.stringify(responseData, null, 2) } }] },
    },
  };

  try {
    await fetchFromNotion("pages", { method: "POST", body: JSON.stringify(body) }, env);
  } catch (error) {
    console.error(`[ERROR] Failed to log API interaction: ${error}`);
  }
}
