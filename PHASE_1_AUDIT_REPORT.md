# PixelForge AI — Phase 1 Existing Project Audit

**Audit scope:** Existing repository inspection only. No application source code, database schema, migration, dependency, environment variable, or deployment setting was changed.

**Audit date:** 2026-11-17  
**Repository:** `C:\Users\Saim Faisal\OneDrive\Desktop\Image Genertor`  
**Git state:** Clean working tree at commit `1875404`.

## 1. Executive summary

PixelForge AI is a Next.js App Router frontend foundation with a small, working authentication and project-management backend. The UI is polished but intentionally demo-oriented. The current product is **not yet an AI image generator**: no image, video, chat, upload, storage, or external AI provider is connected.

The strongest reusable foundation is:

- Next.js App Router with JavaScript and React 19.
- Auth.js Credentials authentication with JWT sessions.
- Prisma 6 and PostgreSQL/Neon configuration.
- User/project/image/generation/credit/subscription domain models.
- Ownership checks on the project APIs.
- Reusable layout, navigation, card, form, and editor UI components.

The primary blockers before an All-in-One AI Assistant build are the absence of an AI service layer, conversation/message models, media storage, asynchronous job processing, upload validation, rate limiting, and production-grade observability. The existing `Image`, `Generation`, credits, and subscription models are useful placeholders but do not yet represent a complete production media system.

## 2. Verified versus unverified status

| Classification | Findings |
|---|---|
| Verified by source inspection | Next.js App Router, Prisma schema, Auth.js Credentials flow, bcrypt password hashing, project CRUD route structure, protected route matcher, demo UI components. |
| Verified by safe local checks | `npm run lint` completed successfully. Git working tree is clean. Only `.env.example` is tracked; `.env.local` is not tracked. |
| Identified in code but not end-to-end tested in this audit | Registration against PostgreSQL, login/session creation, project CRUD from a browser, ownership behavior under multiple users, deployed API behavior. |
| Missing | AI chat, streaming, orchestration, provider integration, real image generation/editing, uploads, video generation, media storage, conversation history, real dashboard data, password recovery, billing, usage enforcement, rate limiting, webhooks, background workers. |

## 3. Actual technology stack

| Area | Actual implementation | Evidence |
|---|---|---|
| Web framework | Next.js `15.5.29`, App Router | `package.json`, `app/` |
| UI | React `19.1.0`, JSX/JavaScript | `package.json`, `app/**/*.js`, `components/**/*.jsx` |
| Styling | Tailwind CSS 4 through PostCSS plus global CSS overrides | `postcss.config.mjs`, `app/globals.css` |
| Icons | `lucide-react` | UI components |
| Authentication | Auth.js/NextAuth `5.0.0-beta.32`, Credentials provider, JWT sessions | `auth.js`, `auth.config.js`, `middleware.js` |
| Password security | `bcryptjs`, cost factor 12 during registration | `app/api/auth/register/route.js` |
| Validation | Zod 4 | `lib/validations/auth.js`, `lib/validations/project.js` |
| ORM/database | Prisma `6.19.3`, PostgreSQL | `prisma/schema.prisma`, `lib/prisma.js` |
| Database hosting indicated by configuration | Neon PostgreSQL is configured outside source code | environment variable names and prior project setup; secret values intentionally omitted |
| Deployment | Vercel project exists and has been deployed | deployment was previously completed; deployment configuration is external to this repository |
| AI provider | None integrated | no provider SDK, AI API route, or server-side provider call exists |

## 4. Project structure overview

```text
app/
  page.js                         Landing page
  layout.js                       Root layout and SessionProvider
  dashboard/page.js               Dashboard UI
  generate/page.js                Prompt UI; generation is disabled/demo-only
  editor/page.js                  Advanced editor UI; processing is disabled/demo-only
  history/page.js                 Hard-coded sample history
  projects/page.js                Hard-coded sample projects
  settings/page.js                Visual-only settings panels
  login/page.js                   Credentials login client form
  register/page.js                Registration client form
  forgot-password/page.js         Informational placeholder
  api/auth/register/route.js      Registration API
  api/auth/[...nextauth]/route.js Auth.js handlers
  api/projects/route.js            Authenticated project list/create API
  api/projects/[id]/route.js       Authenticated project read/update/delete API
  api/user/me/route.js             Authenticated current-user API
components/
  auth/                            Auth shell and session provider
  dashboard/                       Dashboard widgets, mostly demo data
  editor/                         Editor UI and legacy placeholder
  landing/                         Marketing page sections
  layout/                          Sidebar, header, dashboard shell
  projects/                        Project card
  ui/                              Small reusable controls
lib/
  demo-data.js                     Hard-coded workspace data
  prisma.js                        Prisma singleton
  utils.js                         Shared utility module
  validations/                     Zod schemas
prisma/
  schema.prisma                    Current domain schema
  migrations/                      One initial migration
auth.js                             Server Auth.js configuration
auth.config.js                      Edge-compatible Auth.js configuration
middleware.js                       Protected route matcher
```

### Observations about structure

- There are two editor implementations: `components/editor/EditorPlaceholder.jsx` and `components/editor/AdvancedEditor.jsx`; only `AdvancedEditor` is currently used by `app/editor/page.js`.
- `components/ui/EmptyState.jsx`, `components/layout/MobileNavigation.jsx`, and the older editor placeholder appear unused by the current route imports and should be reviewed before future work.
- Several UI modules are compressed into single-line JSX functions, which makes future maintenance, review, and test coverage harder.
- There is no dedicated `services/`, `repositories/`, `workers/`, `storage/`, or `ai/` layer yet.

## 5. Existing features and status

| Feature | Current status | Evidence / limitation |
|---|---|---|
| Landing page and marketing sections | Present | `app/page.js`, `components/landing/*` |
| Registration | Backend implemented; browser flow identified in code | `app/api/auth/register/route.js`; no email verification or account provisioning transaction |
| Login | Implemented in UI and Auth.js Credentials provider | `app/login/page.js`, `auth.js`; browser/API end-to-end behavior was not re-tested in this audit |
| Logout | Implemented in header menu | `components/layout/Header.jsx` calls `signOut` |
| Protected pages | Implemented | `middleware.js` protects dashboard/editor/generate/projects/history/settings |
| Project CRUD API | Implemented | `app/api/projects/**`; UI does not use it |
| Project UI | Present but demo-only | `app/projects/page.js` reads `lib/demo-data.js` rather than the API |
| Dashboard | Present but demo-only | dashboard widgets import demo data and do not query user records |
| Image generation | Missing | `app/generate/page.js` explicitly says generation is coming soon |
| Image editing | UI placeholder only | `AdvancedEditor.jsx` has visual controls and notifications, not processing |
| Image upload | Missing | no `<input type="file">` upload handler or storage integration |
| History | Hard-coded sample data | `app/history/page.js` uses a local constant |
| Settings | Visual-only | no persistence; page says changes are for demo |
| Password recovery | Missing | `app/forgot-password/page.js` explicitly says email recovery is not enabled |
| Billing | Schema placeholder only | no Stripe/provider integration or billing endpoints |

## 6. Authentication audit

### Working foundation

- `app/api/auth/register/route.js` validates registration with Zod, normalizes email to lowercase, hashes passwords with bcrypt cost 12, and returns a limited user projection.
- `auth.js` looks up the normalized email and compares the submitted password using bcrypt.
- `auth.config.js` uses JWT sessions with a 30-day max age and adds user id and role to the token/session.
- `middleware.js` redirects unauthenticated users to `/login` and sends authenticated users away from `/login` and `/register`.
- Server APIs call `auth()` and require `session.user.id`.

### Gaps and risks

- There is no email verification, account recovery, password change, session revocation UI, MFA, or suspicious-login protection. `app/forgot-password/page.js` confirms recovery is not implemented.
- The `role` is copied into the session but is not used for authorization. There is no admin route guard or permission policy.
- Registration checks for an existing email before insert, but concurrent requests can still hit the unique constraint and become a generic 500 instead of a stable conflict response. This needs a later error-mapping fix.
- Credentials authentication has no explicit rate limiting or brute-force protection.
- The Auth.js provider is declared in both `auth.config.js` and `auth.js`; the final `providers` array in `auth.js` overrides the config array, so it currently works but is unnecessarily duplicative and easy to misconfigure later.
- `auth.config.js` relies on environment configuration for `AUTH_SECRET`; deployment checks must ensure it is present in every required environment.
- Authorization is currently user-ID ownership based for projects, which is good, but there is no equivalent policy layer for future media, messages, or jobs yet.

## 7. Database audit

### Current schema

`prisma/schema.prisma` contains:

- `User`: identity, password hash, role, and relations.
- `Project`: user-owned project with optional description.
- `Image`: optional original/edited URLs, filename, MIME type, dimensions, user, and project relation.
- `Generation`: prompt, model, status enum, output URL, user, and optional project.
- `CreditTransaction`: immutable-style ledger rows with amount and transaction type.
- `Subscription`: one subscription per user with plan/status and billing period dates.
- Enums for role, generation status, credit transaction type, subscription plan, and subscription status.

The initial migration is `prisma/migrations/20261117112134_init/migration.sql`.

### Strengths

- Foreign keys and cascade behavior provide a useful starting ownership model.
- User, project, and status indexes exist.
- `Project.userId`, `Image.userId`, and `Generation.userId` allow direct user isolation queries.
- Separate credit transaction rows are preferable to a mutable balance-only field for auditing.

### Gaps for the target product

- There are no `Conversation` or `Message` tables, no assistant/tool-call representation, no token usage, and no message ordering/index strategy.
- `Generation` lacks media type, provider, provider job ID, input asset references, parameters, error details, progress, completed timestamps, idempotency key, and retry metadata.
- `Image` is too narrow for a general media library: it has no storage key, provider, checksum, visibility, size, moderation state, or variants/thumbnails.
- There is no `Video`/generic `MediaAsset` model. `outputUrl` on `Generation` cannot model multiple outputs or a durable media lifecycle.
- `CreditTransaction` has no request/job reference, idempotency key, currency/unit definition, or unique constraint to prevent duplicate charging.
- `Subscription` has no external customer/subscription IDs, product/price IDs, or webhook event records.
- There are no soft-delete fields, retention policy fields, or audit-log records.
- The schema uses `env("DIRECT_URL")`. `npx prisma validate` failed in the current PowerShell session because Prisma CLI could not find `DIRECT_URL`; the application’s `.env.local` is not tracked and Prisma CLI does not automatically use that file in this setup. This is a tooling/configuration verification issue, not evidence that the deployed database is broken. A future non-production configuration improvement should provide Prisma CLI variables through a documented `.env`/CI mechanism, with secrets kept out of Git.

## 8. Image generation audit

There is currently no image generation implementation to audit at the provider level.

### What exists

- `app/generate/page.js` captures a prompt and presents model, aspect-ratio, image-count, and quality selectors.
- The Generate button only sets a demo message; it does not call an API or persist a request.
- `components/editor/AdvancedEditor.jsx` includes prompt and tool controls, but its Generate button only displays a future-phase notification.
- `prisma.Generation` and `prisma.Image` provide an initial persistence concept but are unused by the UI/API.

### Missing provider pipeline

- No AI SDK or provider client is installed.
- No server-side API key variable is defined for an image provider.
- No prompt normalization, model capability validation, request budget, provider timeout, retry, or moderation layer exists.
- No generated bytes/URLs are stored, copied to durable storage, or linked to a user/project.
- No image editing or image-to-image request path exists.
- No generation history is connected to the database.

The future chat interface should call a server-side generation service, not a provider directly from the browser. The existing prompt UI can be reused as a component, but its state and submit action need to be connected to a job API.

## 9. Frontend and UI audit

### Strengths

- `DashboardLayout`, `Sidebar`, `Header`, `AuthShell`, `Card`, `Button`, `Input`, and `SectionHeading` are sensible reusable building blocks.
- The responsive layout uses mobile navigation state and responsive Tailwind classes.
- Forms have labels, basic HTML constraints, loading states, and `role="alert"` errors in the auth flows.
- The light theme is centralized in `app/globals.css` and preserves the violet accent system.

### Current limitations

- Dashboard, projects, history, and activity are sample content, not user data.
- The landing page Login button is a non-functional `<button>` rather than a link to `/login`.
- Project cards contain visual action buttons without implemented navigation or menu behavior.
- Header search and notifications are visual controls only.
- Settings save only changes local React state and do not call an API.
- The editor’s Choose image button is not wired to a file input.
- Generation and editing controls are intentionally disabled or display “coming soon”.
- Mobile experience is structurally supported but has not been tested against real upload, chat, video playback, long prompts, or keyboard behavior.
- The global stylesheet imports Google Fonts remotely, which is a runtime privacy/performance dependency and can be considered during deployment hardening.
- There are no frontend error boundaries, request cancellation, optimistic state strategy, or accessible progress components for long-running AI jobs.

## 10. Backend and API audit

### Existing endpoints

| Endpoint | Methods | Auth | Validation | Notes |
|---|---|---|---|---|
| `/api/auth/register` | POST | Public | Zod + bcrypt | Creates a user; no rate limit/email verification. |
| `/api/auth/[...nextauth]` | GET/POST | Auth.js | Auth.js | Credentials session handlers. |
| `/api/user/me` | GET | Required | Session check | Returns a limited user projection. |
| `/api/projects` | GET/POST | Required | Zod on POST | Lists/creates only the current user’s projects. |
| `/api/projects/[id]` | GET/PATCH/DELETE | Required | Zod on PATCH | Uses current-user ownership lookup before access or mutation. |

### Backend concerns

- There is no common API error envelope or shared request parsing utility.
- Project routes do not explicitly catch database/provider exceptions, so failure responses are not standardized.
- There is no rate limiting, request size limit, idempotency, audit logging, or request correlation ID.
- No API routes exist for chat, messages, uploads, media, generation jobs, webhooks, usage, or billing.
- No service/repository boundary exists; route handlers call Prisma directly. This is acceptable for the small foundation but will become difficult to maintain when multiple providers and job states are added.
- No runtime schema validates model names, aspect ratios, output counts, file types, or provider payloads because those features are not implemented yet.

## 11. Security audit

Severity reflects the risk for the intended production All-in-One Assistant, not merely the current demo.

| Severity | Finding | Evidence / impact | Recommended future control |
|---|---|---|---|
| **Critical** | No actual AI/media pipeline exists | Target functionality cannot be safely delivered yet; introducing provider calls ad hoc would risk key exposure and uncontrolled cost. | Add a server-only provider service, allowlisted models, quotas, timeouts, and usage ledger before enabling generation. |
| **High** | No file upload security boundary | No upload route, MIME sniffing, size limit, malware/moderation check, or private storage policy exists. | Use signed upload URLs, size/type limits, content sniffing, virus/moderation checks, private buckets, and ownership checks. |
| **High** | No rate limiting or abuse controls | Registration/login/project APIs can be automated; future AI APIs could create significant provider spend. | Add IP/user limits, login throttling, generation quotas, idempotency, and provider spend ceilings. |
| **High** | Future media authorization is undefined | Existing project ownership is good, but images/generations/media currently have no API authorization layer because their APIs do not exist. | Centralize `assertUserOwnsResource`/policy checks and apply them to every conversation, message, asset, and job. |
| **High** | Credits are not enforced | Schema contains transactions but no charging/refund logic. | Charge atomically around an idempotent job, record provider cost/units, and refund only through controlled transitions. |
| **Medium** | Role data is not authorization | `role` enters JWT/session but no admin policy uses it. | Add explicit authorization middleware/policy functions and avoid trusting client-provided role state. |
| **Medium** | Registration race/error handling | Pre-check plus unique constraint can produce a generic 500 for concurrent duplicate registrations. | Catch Prisma unique errors and return a stable 409 without revealing unnecessary account details. |
| **Medium** | Password recovery and verification absent | `app/forgot-password/page.js` is informational only. | Add single-use, expiring hashed reset tokens, email verification, and security notifications. |
| **Medium** | Error/observability baseline is minimal | Only registration logs a short message; other APIs have no structured logging or tracing. | Use structured redacted logs, request IDs, provider event logs, and alerting without secrets. |
| **Low** | Remote font dependency | `app/globals.css` imports Google Fonts at runtime. | Consider self-hosting/optimized font loading for privacy, reliability, and performance. |
| **Low** | CSRF/security headers are not explicitly documented | Auth.js handles its own flow, but the app has no visible security-header policy in `next.config.mjs`. | Add a reviewed CSP, frame, referrer, MIME, and permissions policy appropriate to uploads/media. |

No destructive security testing was performed.

## 12. Environment and deployment configuration

Only variable names and configuration status are reported; secret values are intentionally omitted.

| Variable | Purpose | Local source status |
|---|---|---|
| `DATABASE_URL` | Prisma pooled PostgreSQL connection | Present in local environment configuration; not tracked |
| `DIRECT_URL` | Prisma direct PostgreSQL connection for migrations/introspection | Present in local environment configuration; not tracked |
| `AUTH_SECRET` | Auth.js signing/encryption secret | Present in local environment configuration; not tracked |
| `AUTH_URL` | Auth.js application URL | Present in local environment configuration; not tracked |
| `AUTH_TRUST_HOST` | Allows Auth.js to trust deployment host headers | Present in local environment configuration; not tracked |
| `NEXT_PUBLIC_APP_URL` | Public application URL for browser-visible configuration | Present in local environment configuration; not tracked |

`.env.example` documents the names and local defaults without secret values. `.env.local` is ignored and is not in Git. No AI provider, storage, email, payment, queue, or webhook environment variable exists yet.

## 13. Missing target features

The following are not present in the current codebase:

1. Unified conversation UI and message persistence.
2. Streaming assistant responses.
3. Tool/function calling and intent routing.
4. Server-side OpenAI or other AI provider integration.
5. Real text-to-image and image-to-image generation.
6. Image upload, editing, and durable asset storage.
7. Text-to-video and image-to-video jobs.
8. Provider job polling/webhooks and retry handling.
9. Video playback/download and media library.
10. Real conversation/media history.
11. Usage quotas, credits, cost accounting, and billing.
12. Password recovery, verification, MFA, and account security controls.
13. Rate limiting, observability, moderation, and abuse prevention.

## 14. Reusable existing components

Prioritize reuse of:

- `components/layout/DashboardLayout.jsx`, `Sidebar.jsx`, `Header.jsx` for the authenticated shell.
- `components/auth/AuthShell.jsx`, `SessionProvider.jsx`, and existing Auth.js setup.
- `components/ui/Button.jsx`, `Card.jsx`, `Input.jsx`, `Select.jsx`, `SectionHeading.jsx`, and `EmptyState.jsx`.
- Prompt and settings patterns in `app/generate/page.js` and `components/editor/AdvancedEditor.jsx`.
- The existing project ownership query pattern in `app/api/projects/[id]/route.js`.
- `lib/prisma.js` as the Prisma singleton, with a future service layer around it.
- `lib/validations/*` as the starting point for strict request schemas.
- Existing `GenerationStatus` enum and generation/project relations as an initial migration path, subject to schema review in a later approved phase.

## 15. Recommended future architecture

### Frontend

Keep the App Router and existing shell. Add a route such as `/chat` or make the dashboard’s primary workspace a chat-first screen with:

- Conversation list/sidebar.
- Message timeline with assistant/user/tool message types.
- Composer supporting text, image attachments, model/action selection, and cancellation.
- Streaming text rendering.
- Generation cards with queued/processing/completed/failed states.
- Media gallery and download controls.
- Accessible progress, retry, and error states.

Use a client data layer for server state and polling/stream subscriptions; keep authorization and provider calls server-side.

### Backend layers

```text
Route handlers / server actions
        ↓
Request schemas + auth/policy checks + rate limits
        ↓
Conversation service / orchestration service / media job service
        ↓
Provider adapters (text, image, video)
        ↓
Prisma repositories + object storage + queue/webhook handlers
```

Provider adapters should expose a stable internal contract so models can be changed without rewriting chat or UI code. Route handlers should not contain provider-specific request logic.

### AI orchestrator

The orchestrator should:

1. Load a bounded conversation context.
2. Classify or allow the model to select a validated tool.
3. Check user permissions, quotas, and available credits.
4. Create a durable assistant/tool-call message and, for media, a job record before calling an external provider.
5. Execute a provider adapter with timeout, retry, idempotency, and redacted logging.
6. Persist the result or failure and stream/poll status to the client.

Never allow the browser to choose arbitrary provider URLs, models, storage keys, or user IDs.

### Storage and media

Use private object storage (S3-compatible, Vercel Blob, or another reviewed provider) with:

- Short-lived signed upload/download URLs.
- Database metadata and ownership checks.
- Original and derived asset records.
- Thumbnail/preview variants.
- MIME, byte size, dimensions, duration, checksum, and moderation status.

Do not use provider URLs as the sole durable record; copy or manage outputs in controlled storage when licensing and provider terms allow.

### Video processing

Video generation should be asynchronous. Create a job first, then enqueue provider work. Track provider job ID, status, progress, attempts, error category, and output asset. Prefer provider webhooks with authenticated signatures; use bounded polling as a fallback. A job worker is preferable to a request that waits for a long provider response.

## 16. Proposed future database changes

These are recommendations only; no schema was changed in this phase.

### Conversation/message domain

- `Conversation`: owner, title, model/default settings, archived/deleted timestamps, created/updated timestamps.
- `Message`: conversation, role, content parts JSON, sequence/created timestamp, status, token usage, model, parent/tool-call relation.
- `ToolCall`: message, tool name, validated arguments, result reference, status, error, timestamps.

### General media domain

- Replace or extend `Image` with a general `MediaAsset` or introduce `Video` while preserving a compatibility path.
- Store media kind, storage key, preview key, MIME, byte size, dimensions, duration, checksum, provider, visibility, moderation status, and owner.
- Add a join/reference model for message inputs and outputs so one generation can have multiple assets.

### Generation/job domain

- `GenerationJob`: user, conversation/message, kind, provider, model, provider job ID, status, progress, idempotency key, parameters JSON, attempts, error code/message, started/completed timestamps.
- `GenerationOutput`: job, asset, ordinal, metadata.
- Add indexes for `(userId, createdAt)`, `(status, updatedAt)`, provider job ID, and idempotency key.

### Usage/billing domain

- Add usage event/request IDs, units, provider cost metadata, and uniqueness constraints to credit transactions.
- Add external billing customer/subscription/price IDs and webhook event records.
- Add monthly usage/quota snapshots only if query volume justifies them; retain the ledger as the source of truth.

## 17. Proposed API endpoints

All endpoints should use a shared response/error format and ownership policy.

```text
GET    /api/conversations
POST   /api/conversations
GET    /api/conversations/:id
PATCH  /api/conversations/:id
DELETE /api/conversations/:id

GET    /api/conversations/:id/messages
POST   /api/conversations/:id/messages
POST   /api/conversations/:id/stream       # or an SSE/streaming response route

POST   /api/uploads/presign
POST   /api/media/complete
GET    /api/media
GET    /api/media/:id
DELETE /api/media/:id

POST   /api/generations
GET    /api/generations/:id
POST   /api/generations/:id/cancel
POST   /api/generations/:id/retry

POST   /api/webhooks/:provider
GET    /api/usage
GET    /api/credits
POST   /api/billing/checkout
POST   /api/billing/portal
```

The existing project endpoints can remain, but their shared ownership and error handling should be reused by the new services.

## 18. External API and service requirements

Before implementation, select providers based on model quality, pricing, latency, regional availability, output licensing, retention policy, and webhook support.

- Text/chat provider with streaming and tool/function calling.
- Image provider supporting text-to-image and image editing/image-to-image.
- Video provider supporting asynchronous text-to-video and image-to-video jobs.
- Private object storage and CDN/download strategy.
- Queue/worker or job platform for video and long image jobs.
- Email provider for verification and password recovery.
- Payment provider if plans and credits are monetized.
- Error monitoring, structured logs, metrics, and alerting.

No specific video provider is assumed to be available in the existing project, and no external provider API was called during this audit.

## 19. Risks and technical challenges

- Provider costs can grow quickly without idempotency, quotas, and per-user limits.
- Video jobs have long and variable latency; synchronous request handling will be unreliable.
- Provider outputs may expire or have different licensing/retention terms.
- Image/video uploads require secure content handling and potentially moderation.
- Conversation context can become expensive; summarization and context windows will be required.
- Streaming and asynchronous job updates require careful client reconnection and retry behavior.
- Credits and billing require transactional accounting and webhook reconciliation.
- A single chat interface can become confusing unless tool status and generated assets are clearly represented.
- Existing demo data must be replaced incrementally without breaking the working auth/project foundation.

## 20. Recommended roadmap for Phases 2–10

### Phase 2 — Production foundation and shared backend services

Add shared API errors, request IDs, auth/policy helpers, rate-limit strategy, structured logging, and a service/repository boundary. Resolve Prisma CLI environment documentation without exposing secrets. Do not yet expose expensive AI generation publicly.

### Phase 3 — Conversation and chat persistence

Add conversation/message/tool-call schema and APIs. Build the chat workspace, context window rules, message loading, and streaming abstraction with a mocked provider first.

### Phase 4 — Text AI integration

Add one approved text provider behind a server-only adapter. Implement streaming, moderation, quotas, provider timeout/retry, usage recording, and safe tool-call validation.

### Phase 5 — Image generation integration

Extend the generation/media schema and connect one image provider. Add text-to-image jobs, result persistence, gallery cards, downloads, history, and failure/retry handling.

### Phase 6 — Secure uploads and image editing

Add signed uploads, content validation, private storage, image-to-image/editing jobs, asset ownership, thumbnails, and editor integration.

### Phase 7 — Video jobs

Add asynchronous text-to-video and image-to-video provider adapters, queue/worker execution, webhooks/polling, progress states, playback, and durable output storage.

### Phase 8 — Usage, credits, and billing

Implement atomic usage charging/refunds, quotas, subscription provider integration, webhook reconciliation, account usage screens, and admin audit tools.

### Phase 9 — Security and reliability hardening

Add email verification, password recovery, optional MFA, abuse controls, CSP/security headers, moderation, backup/retention policies, load testing, observability, and incident runbooks.

### Phase 10 — Product polish and scale

Replace remaining demo data, improve mobile/accessibility, add provider fallback policies, optimize context/media delivery, test failure scenarios, and prepare a staged production rollout.

## 21. Critical problems before Phase 2

1. The target AI functionality is entirely absent, so the next phase must first establish the provider/service architecture rather than wiring provider calls into UI components.
2. There is no upload/storage security design; file features must not be enabled until signed uploads, validation, ownership, and private access are designed.
3. There is no rate limiting or cost-control layer; expensive provider calls must not ship before quotas, idempotency, and usage accounting.
4. Prisma CLI validation currently depends on `DIRECT_URL` being available to the CLI environment. Document a safe local/CI loading method before making schema changes.
5. Current dashboard, history, projects, and settings are demo-only; product decisions are needed on the migration from sample data to persisted user data.

## 22. Recommended next step

Approve a Phase 2 implementation plan focused on **shared backend foundations plus conversation/message schema design**, with no AI provider spend until authentication policy, rate limiting, usage accounting, and a server-side orchestration boundary are in place.

No code changes should be made until that Phase 2 scope is approved.
