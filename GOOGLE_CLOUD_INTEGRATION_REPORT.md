# PixelForge AI — Google Cloud AI Infrastructure

## Configured direction

PixelForge AI is now prepared for:

- Chat: Gemini through Vertex AI.
- Images: Gemini 3.1 Flash Image through Vertex AI.
- Video: Veo 3.1 Fast through Vertex AI long-running operations.
- Media storage: Google Cloud Storage with server-generated signed download URLs.

The implementation keeps provider calls server-side and does not expose Google credentials to React components or `NEXT_PUBLIC_*` variables.

## Implemented foundation

- `lib/google/config.js` reads Google Cloud configuration and exposes only non-secret readiness flags.
- `app/api/platform/config/route.js` returns authenticated configuration status without credential values.
- `lib/ai/providers/google.js` uses the official `@google/genai` Vertex AI client for Gemini image generation when configured.
- `lib/ai/chat/google.js` provides a server-only Gemini chat provider boundary with normal and streaming methods.
- `lib/ai/video/google.js` provides a server-only Veo long-running-operation boundary.
- `lib/storage/index.js` supports Google Cloud Storage output upload and one-hour signed read URLs when configured.
- `components/ai/ProviderStatus.jsx` displays a clear configuration state and never presents mock output as real Google output.
- `app/generate/page.js` identifies the workspace as Google Vertex AI and shows configuration status.
- `.env.example` documents Google Cloud variable names without values.

## Database preparation

The additive migration below was prepared but intentionally not applied:

```text
prisma/migrations/20261117204910_google_ai_platform_architecture
```

It adds Conversation, Message, and VideoGeneration models with ownership relations, statuses, provider job IDs, output references, and indexes. `npx prisma migrate status` confirms this migration is pending. No production database change was made for these new models.

## Required server environment variable names

- `AI_PROVIDER`
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_CLOUD_LOCATION`
- `GOOGLE_CHAT_MODEL`
- `GOOGLE_IMAGE_MODEL`
- `GOOGLE_VIDEO_MODEL`
- `GOOGLE_CLOUD_STORAGE_BUCKET`
- `GOOGLE_USE_ADC`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- `STORAGE_PROVIDER`

Use only one Google authentication mode: Application Default Credentials, a server-side credentials file, or server-side JSON credentials. Never put credential JSON in source control or a public environment variable.

## Current status

Google credentials and storage configuration are not present in the current local environment, so real Vertex AI and GCS calls are not claimed as tested. The image generation route now defaults to Google Vertex AI and returns a safe configuration error when Google is not configured; it does not silently use mock output.

## Verification

- `npm run lint`: passed with two existing Next.js warnings for plain `<img>` preview elements.
- `npm run build`: passed.
- `npx prisma validate`: passed.
- `npx prisma generate`: passed after stopping a local dev process that had locked the Windows Prisma engine.
- `npx prisma migrate status`: passed; the Google architecture migration is pending and was not applied.
- No deployment or billing resource configuration was performed.
