import dotenv from "dotenv";

dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const WORKOUT_ENTRIES_DB_ID = process.env.WORKOUT_ENTRIES_DB_ID;
const WORKOUT_TEMPLATES_DB_ID = process.env.WORKOUT_TEMPLATES_DB_ID;
const WORKOUT_ENTRY_TEMPLATES_DB_ID = process.env.WORKOUT_ENTRY_TEMPLATES_DB_ID;
const WORKOUT_ID = process.env.WORKOUT_ID;

const fetchFromNotion = async (endpoint: string, options = {}) => {
  const url = `https://api.notion.com/v1/${endpoint}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    ...options,
  });

  const json = await response.json();
  console.log(`🔍 API Response for ${endpoint}:`, JSON.stringify(json, null, 2));
  return json;
};

interface NotionProperty {
  type: string;
  relation?: Array<{ id: string }>;
}

interface NotionPage {
  properties: Record<string, NotionProperty>;
}

interface NotionResponse {
  results: Array<any>;
}

// ✅ Step 1: Fetch the Workout Page to find its related Workout Template
const getWorkoutTemplate = async () => {
  console.log("\n🔹 Fetching workout details...");
  const workoutData = await fetchFromNotion(`pages/${WORKOUT_ID}`) as NotionPage;

  console.log("\n🔹 Checking properties for Workout Template relation...");
  console.log(JSON.stringify(workoutData.properties, null, 2));

  let workoutTemplateId = null;
  // Try "Workout Template" first
  const workoutTemplate = workoutData.properties?.["Workout Template"] as { relation?: { id: string }[] };
  if (workoutTemplate?.relation?.length) {
    workoutTemplateId = workoutTemplate.relation[0].id;
    console.log(`✅ Found related Workout Template: ${workoutTemplateId}`);
  }

  // Check if the template is stored under another property
  if (!workoutTemplateId) {
    for (const key in workoutData.properties) {
      if (workoutData.properties[key].type === "relation" && workoutData.properties[key].relation?.length) {
        workoutTemplateId = workoutData.properties[key].relation[0].id;
        console.log(`🔍 Found possible template under property '${key}': ${workoutTemplateId}`);
        break;
      }
    }
  }

  if (!workoutTemplateId) {
    console.error("❌ No Workout Template found for this workout.");
  }

  return workoutTemplateId;
};

// ✅ Step 2: Fetch all workout entries linked to this template (direct approach)
const getWorkoutEntriesByTemplate = async (workoutTemplateId: string) => {
  if (!workoutTemplateId) return;

  console.log("\n🔹 Fetching workout entries linked to template...");
  const response = await fetchFromNotion(`databases/${WORKOUT_ENTRIES_DB_ID}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        property: "Workout", // Assumes "Workout" stores the relation
        relation: { contains: workoutTemplateId },
      },
    }),
  }) as NotionResponse;

  console.log(`✅ Found ${response.results.length} entries by template.`);
  return response.results;
};

// ✅ Step 3: Fetch all workout entries linked to the new workout itself
const getWorkoutEntriesByWorkout = async () => {
  console.log("\n🔹 Fetching workout entries linked to the new workout...");
  const response = await fetchFromNotion(`databases/${WORKOUT_ENTRIES_DB_ID}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        property: "Workout",
        relation: { contains: WORKOUT_ID },
      },
    }),
  }) as NotionResponse;

  console.log(`✅ Found ${response.results.length} entries by new workout.`);
  return response.results;
};

// ✅ Step 4: Check if workouts exist in the Workout Templates DB instead
const getWorkoutTemplateEntries = async (workoutTemplateId: string) => {
  if (!workoutTemplateId) return;

  console.log("\n🔹 Checking if exercises are stored in the Workout Templates database...");
  const response = await fetchFromNotion(`databases/${WORKOUT_TEMPLATES_DB_ID}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        property: "Workouts",
        relation: { contains: workoutTemplateId },
      },
    }),
  }) as NotionResponse;

  console.log(`✅ Found ${response.results.length} entries in the Workout Templates database.`);
  return response.results;
};

// ✅ Step 5: Check if exercises exist in Workout Entry Templates (NEW)
const getWorkoutEntryTemplates = async (workoutTemplateId: string) => {
  if (!workoutTemplateId) return;

  console.log("\n🔹 Checking if exercises exist in Workout Entry Templates...");
  const response = await fetchFromNotion(`databases/${WORKOUT_ENTRY_TEMPLATES_DB_ID}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        property: "Workout Template",
        relation: { contains: workoutTemplateId },
      },
    }),
  }) as NotionResponse;

  console.log(`✅ Found ${response.results.length} entries in the Workout Entry Templates database.`);
  return response.results;
};

// ✅ Run all tests
const main = async () => {
  const workoutTemplateId = await getWorkoutTemplate();
  if (workoutTemplateId) {
    await getWorkoutEntriesByTemplate(workoutTemplateId);
    await getWorkoutTemplateEntries(workoutTemplateId);
    await getWorkoutEntryTemplates(workoutTemplateId);
  }
  await getWorkoutEntriesByWorkout();
};

main();
