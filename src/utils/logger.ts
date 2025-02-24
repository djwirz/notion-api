import { Client } from "@notionhq/client";

// ✅ Initialize Notion Client
function getNotionClient(env: any) {
  return new Client({ auth: env.NOTION_API_KEY });
}

// ✅ Log API interactions in Notion Inbox DB
export async function logApiInteraction(
  endpoint: string,
  requestData: any,
  responseData: any,
  status: string,
  env: any
) {
  const notion = getNotionClient(env);

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
    await notion.pages.create(body);
  } catch (error) {
    console.error(`[ERROR] Failed to log API interaction: ${error}`);
  }
}
