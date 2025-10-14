# Serverless Strike Report Options

This folder contains example implementations for sending the strike report without running a long-lived Express server.

## 1. Supabase Edge Function + pg_cron

Folder: `serverless/supabase-edge/strike-report/`
File: `index.ts`

Deployment:
1. Install supabase CLI locally.
2. Run `supabase functions deploy strike-report`.
3. Note the deployed function URL.
4. Add env vars in Supabase Dashboard (Project Settings -> Functions):
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - TELEGRAM_BOT_TOKEN
   - TELEGRAM_CHAT_ID
   - REPORT_TIMEZONE (optional)

Scheduling with `pg_cron` (enable extension in your database):
```sql
-- Enable extension (once)
create extension if not exists pg_cron;
create extension if not exists http;
-- Run daily at 21:00 UTC calling the edge function via http_post (from http extension if available)
select cron.schedule('strike-report-daily', '0 21 * * *', $$
  select http_post(
    'https://YOUR-PROJECT.supabase.co/functions/v1/strike-report',
    '{}',
    'application/json'
  );
$$);
```
If `http_post` isn't available, alternatively schedule from external cron (GitHub Actions, Cloudflare Workers) hitting the function URL.

Pros:
- Zero warm server cost.
- Native Supabase auth/secrets.

Cons:
- Requires pg_cron + http extension (or external scheduler).

## 2. AWS Lambda + EventBridge

Folder: `serverless/aws-lambda/strikeReport.js`
Handler: `handler`

Packaging:
- Create `package.json` with `@supabase/supabase-js` and `node-fetch`.
- Zip contents and upload or use SAM/CDK to deploy.

EventBridge Rule (daily 14:00 UTC):
```json
{
  "ScheduleExpression": "cron(0 14 * * ? *)",
  "Target": "arn:aws:lambda:REGION:ACCOUNT:function:StrikeReport"
}
```
Set env vars in Lambda configuration:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (store encrypted with KMS)
- TELEGRAM_BOT_TOKEN (Encrypted)
- TELEGRAM_CHAT_ID
- REPORT_TIMEZONE

Pros:
- Scales automatically, retry + DLQ support.
- Integrated logging (CloudWatch).

Cons:
- More infra management.

## 3. Cloudflare Workers Cron

- Deploy a Worker that runs strike logic (port code from Edge function).
- Add `crons = ["0 14 * * *"]` in worker config.
- Store secrets via `wrangler secret put`.

Pros: Fast cold start, simple scheduling.
Cons: Need to adapt Supabase client (use Web fetch; works fine).

## 4. Vercel / Netlify Scheduled Functions

- Vercel: Use `cron.json` or Vercel Scheduler (Beta) to invoke an API route.
- Netlify: Scheduled Functions define a `schedule` config in `netlify.toml`.

Pros: Simple if site already hosted there.
Cons: Beta features (Vercel); execution time limits.

## Choosing
If all data already in Supabase and you prefer unified hosting, Supabase Edge + pg_cron is simplest. For broader infra / advanced observability or multi-region, AWS Lambda + EventBridge gives flexibility.

## Migration Path From Express
1. Extract logic (already done in examples) into shared utility (optional).
2. Pick target platform; set secrets.
3. Deploy function; test manual invoke.
4. Add scheduler (pg_cron / EventBridge rule / Worker cron).
5. Disable old Express cron once new path stable.
6. Add logging table `strike_report_runs` for auditing.

## Enhancements Across Serverless
- Add retry around Telegram with exponential backoff.
- Persist result & message_id to Supabase.
- Add idempotency guard (e.g. check if run for date already stored).
- Structured JSON log with run duration.

## Security Notes
- Never expose service role key in client code; keep in serverless env.
- Restrict Edge function if needed (JWT verification or custom header token).
- Rotate Telegram bot token periodically.

## Testing Locally (Supabase Edge)
Use CLI invoke:
```
supabase functions serve strike-report --env-file ./edge.env
curl -i http://localhost:54321/functions/v1/strike-report
```

## Testing Locally (Lambda)
Using AWS SAM:
```
SAM build
SAM local invoke StrikeReportFunction --env-vars env.json
```

## Timezone Handling
`REPORT_TIMEZONE` uses IANA zone name; ensure platform supports `toLocaleString` with `timeZone`.
Fallback is UTC if not provided.

---
Feel free to request additional platform examples (GCP Cloud Scheduler + Cloud Function, Azure Function Timer Trigger).
