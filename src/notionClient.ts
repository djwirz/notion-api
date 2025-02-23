export async function getWorkoutTemplate(workoutId: string, env: any) {
  interface PageResponse {
    properties: {
      "Workout Template": {
        relation: Array<{ id: string }>;
      };
    };
  }
  
  try {
    const pageData = await fetchFromNotion(`pages/${workoutId}`, {}, env) as PageResponse;
    return pageData?.properties?.["Workout Template"]?.relation?.[0]?.id || null;
  } catch (error) {
    console.error(`[ERROR] Failed to fetch workout template for ${workoutId}:`, error);
    return null;
  }
}


export async function fetchFromNotion(endpoint: string, options: RequestInit = {}, env: any) {
  const notionApiUrl = `https://api.notion.com/v1/${endpoint}`;

  const response = await fetch(notionApiUrl, {
    headers: {
      Authorization: `Bearer ${env.NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[ERROR] Notion API failed (${response.status}): ${errorText}`);
    throw new Error(`Notion API error ${response.status}: ${errorText}`);
  }

  return response.json();
}
