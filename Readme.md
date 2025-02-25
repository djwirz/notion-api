# Notion Workout Automation

## Why?

Manually tracking workout routines in Notion can be tedious and prone to inconsistencies. This automation ensures that workout entries are consistently and efficiently duplicated from predefined templates, reducing manual input while maintaining accuracy.

## How It Works

1. **Trigger**: A request with `workout_id` is sent to the Cloudflare Worker.
2. **Template Fetching**: The worker retrieves the workout template linked to the given `workout_id`.
3. **Entry Duplication**: Exercises from the template are duplicated into the workout entry database.
4. **Batch Processing**: API calls are batched (3 per request) with adaptive delays to avoid rate limits.
5. **Logging**: Successes and failures are logged both in console and a Notion Inbox database (with rate-controlled logging).

## Key Components

- `workoutService.ts`: Handles fetching templates, processing entries, and batching Notion API calls.
- `notionService.ts`: Fetches Notion data and normalizes IDs.
- `notionClient.ts`: Wrapper for Notion API interactions with error handling and logging.
- `logger.ts`: Logs API interactions with truncation and controlled frequency.

## Schema

### Workout Entry Template

```
{
  "Workout Template": { "relation": [{ "id": "template_id" }] },
  "Exercises": { "relation": [{ "id": "exercise_id" }] },
  "Reps": { "number": 10 },
  "Weight": { "number": 50 },
  "Set #": { "rich_text": [{ "text": { "content": "Set 1" } }] }
}
```

### Duplicated Workout Entry

```
{
  "Workout": { "relation": [{ "id": "workout_id" }] },
  "Exercises": { "relation": [{ "id": "exercise_id" }] },
  "Reps": { "number": 10 },
  "Weight": { "number": 50 },
  "Set #": { "rich_text": [{ "text": { "content": "Set 1" } }] }
}
```

## Setup

1. Set environment variables:
   - `NOTION_API_KEY`: Your Notion integration token.
   - `WORKOUT_ENTRY_TEMPLATES_DB_ID`: Notion DB ID for workout templates.
   - `WORKOUT_ENTRIES_DB_ID`: Notion DB ID for duplicated entries.
   - `NOTION_INBOX_DB_ID`: Notion DB ID for logging interactions.
2. Deploy to Cloudflare Workers.

## Running Locally

Use `wrangler tail` to monitor logs:

```
wrangler tail --service notion-api
```

## Troubleshooting

- **Rate Limits?** Reduce batch size or increase delay.
- **Logging Errors?** Notion API has a 2000-char limit; messages auto-truncate.
- **Missing Entries?** Ensure templates are properly linked in Notion.

## Future Enhancements

- Use Cloudflare KV for caching templates.
- Optimize batch handling with exponential backoff.
