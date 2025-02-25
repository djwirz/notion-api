import 'dotenv/config';

// 🔧 Load environment variables
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const RESUMES_DB_ID = process.env.RESUMES_DB_ID;

if (!NOTION_API_KEY || !RESUMES_DB_ID) {
	console.error('❌ Missing required environment variables. Check .env file.');
	process.exit(1);
}

// 📌 Headers for Notion API Requests
const HEADERS = {
	Authorization: `Bearer ${NOTION_API_KEY}`,
	'Content-Type': 'application/json',
	'Notion-Version': '2022-06-28',
};

// 🛠 Fetch Notion Database Schema
async function fetchDatabaseSchema(databaseId) {
	try {
		const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
			method: 'GET',
			headers: HEADERS,
		});

		const data = await response.json();
		if (!response.ok) throw new Error(data.message || 'Failed to fetch database schema');

		console.log(`🔍 Schema for ${databaseId}:`, JSON.stringify(data, null, 2));
	} catch (error) {
		console.error(`❌ Error fetching schema: ${error.message}`);
	}
}

// 🛠 Fetch Sample Notion Entry
async function fetchSampleEntry(databaseId) {
	try {
		const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
			method: 'POST',
			headers: HEADERS,
			body: JSON.stringify({ page_size: 1 }),
		});

		const data = await response.json();
		if (!response.ok) throw new Error(data.message || 'Failed to fetch sample entry');

		if (data.results && data.results.length > 0) {
			console.log(`📄 Sample entry from ${databaseId}:`, JSON.stringify(data.results[0], null, 2));
		} else {
			console.log(`❌ No entries found in ${databaseId}`);
		}
	} catch (error) {
		console.error(`❌ Error fetching sample entry: ${error.message}`);
	}
}

// 🚀 Run the script
(async () => {
	console.log(`📡 Fetching schema & sample data for Resumes Database (${RESUMES_DB_ID})...`);
	await fetchDatabaseSchema(RESUMES_DB_ID);
	await fetchSampleEntry(RESUMES_DB_ID);
})();
