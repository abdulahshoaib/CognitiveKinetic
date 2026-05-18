# CognitiveKinetic Backend Service Architecture

This document defines the backend service requirements for CognitiveKinetic, the agentic workflow that should power the product, and the Firebase/Google Cloud architecture that best fits the current Expo mobile app.

The app identity remains CognitiveKinetic. The backend should support the existing product direction: saved profile -> new content/news -> relevance check -> extracted signals -> insight -> impact analysis -> recommended action -> simulated execution -> updated report.

## Current App Baseline

The repository already contains a React Native app built with Expo SDK 54:

- App runtime: `expo ~54.0.34`, React Native `0.81.5`, React `19.1.0`.
- Firebase client SDK: `firebase ^12.13.0`.
- Existing Firebase client entry point: `src/services/firebase.js`.
- Existing profile persistence: `src/services/profileService.js`, using Firestore with AsyncStorage fallback.
- Existing local agent modules: `src/services/agent/orchestrator.js`, `src/services/agent/planner.js`, `src/services/agent/tracer.js`.
- Existing Firestore rules: `users/{uid}/profile/{profileId}` and `users/{uid}/analysisRuns/{runId}` are scoped to the authenticated owner.

Expo's Firebase guide supports the Firebase JS SDK path for Authentication, Firestore, Realtime Database, and Storage in Expo apps, and the project is already using that approach. Expo SDK 54 also requires Firebase JS SDK `12.0.0` or newer, which this project satisfies.

## Backend Goals

The backend exists to make CognitiveKinetic a reliable content-to-action system, not a chatbot and not a summary-only tool.

It must:

- Persist the user's business, organization, project, or operating profile after one-time onboarding.
- Reuse the saved profile automatically for every new analysis.
- Accept only new content during new analysis.
- Run a structured agent pipeline for each analysis.
- Store progress, outputs, recommendations, simulation results, and execution logs.
- Support live dashboard updates in the mobile app.
- Keep API keys, model credentials, source-fetching credentials, and trusted execution logic off the mobile client.
- Provide a realistic path from MVP to production without replacing the current Expo/Firebase foundation.

## Recommended Architecture

Use a Firebase-first architecture with Cloud Run for the heavier agent worker.

```text
Expo mobile app
  |
  | Firebase Auth session
  | Firebase JS SDK
  v
Firebase callable functions
  |
  | validate auth, profile, input, quotas
  | create analysis run
  v
Cloud Firestore
  |
  | durable run state, report data, logs
  | real-time app updates
  v
Cloud Tasks queue
  |
  | async, retryable background processing
  v
Cloud Run agent worker
  |
  | loads profile and content
  | runs agent pipeline
  | calls Vertex AI / Gemini when needed
  | writes structured results
  v
Cloud Firestore + Cloud Storage
  |
  v
Expo dashboard, report, actions, simulation, logs
```

Why this fits the app:

- Firebase Auth and Firestore already exist in the app.
- Callable Functions are app-friendly because Firebase Auth tokens and App Check tokens can be included by the Firebase client SDK.
- Firestore gives the mobile app simple live updates for dashboard state, analysis progress, reports, actions, and logs.
- Cloud Tasks keeps long-running or retryable analysis work out of the request-response path.
- Cloud Run is better suited for the agent worker because it can run a normal Node.js or Python service, use larger dependencies, control scaling, and call Vertex AI or other APIs securely.
- Cloud Storage is the right place for uploaded reports, PDFs, source snapshots, and exported artifacts.
- Secret Manager keeps model keys, API credentials, webhook secrets, and provider tokens out of `EXPO_PUBLIC_*` variables.

## MVP Architecture

For the first backend milestone, the simplest working version can use only Firebase Auth, Firestore, Storage, and Cloud Functions.

```text
Expo app -> callable function -> Firestore -> app listens to Firestore
```

Use this if the analysis runs are short, the content is small, and the workflow can complete within the callable function timeout. Even in the MVP, the client should not run the real model prompt, store model secrets, or decide final actions by itself.

MVP backend services:

- `profileService`: create, fetch, and update the saved profile.
- `contentService`: create pasted content records and file metadata.
- `analysisService`: create analysis runs and execute the pipeline.
- `agentService`: perform extraction, relevance, insight, impact, and action planning.
- `simulationService`: mutate simulation state and produce before/after output.
- `logService`: write user-visible execution logs.
- `feedService`: provide cached, fetched multi-source news and content items.
- `sourceFetchService`: fetch configured outlets, deduplicate articles, and refresh the feed on schedule or user request.

Production should move the analysis executor into Cloud Run and keep callable functions as the app-facing gateway.

## Production Architecture

Production should separate app APIs from backend execution:

- Firebase Callable Functions: public app API surface.
- Cloud Run `agent-worker`: private processing service invoked by Cloud Tasks or Pub/Sub.
- Cloud Tasks: one task per requested analysis or simulation.
- Pub/Sub: source feed ingestion, scheduled fetch fan-out, and non-user-facing event distribution.
- Cloud Scheduler: periodic source fetch jobs every 6 hours.
- Vertex AI Gemini: structured extraction, reasoning, and action planning.
- Firestore: application state, saved profiles, runs, reports, actions, logs, and simulation state.
- Cloud Storage: uploaded documents, raw source files, generated report exports.
- Secret Manager: provider credentials, model configuration, webhook secrets.
- Cloud Logging and Monitoring: backend logs, latency, error rates, retries, model cost signals.
- BigQuery, optional: analytics warehouse for aggregate product metrics and evaluation data.

## Backend Responsibilities

### Authentication And User Ownership

Use Firebase Auth as the source of user identity.

Backend requirements:

- Every callable function must require `request.auth`.
- Every Firestore document path containing user data must include `uid`.
- Server code must verify that `uid` in the request path matches the authenticated user.
- The app should never pass a profile as trusted analysis context. The backend must load the saved profile from Firestore.
- Admin-only endpoints, if added later, must use IAM or custom claims, not client flags.

### Saved Profile Storage

The saved profile is the anchor for the whole product.

Recommended path:

```text
users/{uid}/profile/main
```

Recommended fields:

```json
{
  "businessName": "Apex Delivery",
  "domain": "delivery business",
  "operatingLocations": ["Lahore", "Karachi", "Islamabad"],
  "keyConcerns": ["fuel costs", "delivery margins", "customer churn"],
  "riskSensitivity": "high",
  "goals": ["protect margins", "reduce churn"],
  "constraints": ["avoid broad fee increases"],
  "createdAt": "server timestamp",
  "updatedAt": "server timestamp",
  "profileVersion": 1
}
```

Rules:

- First-time users create this once during onboarding.
- Returning users land on the dashboard if this document exists.
- New analysis never asks for business context again.
- Profile changes happen only from Profile Settings.
- Analysis runs store a profile snapshot so old reports remain explainable after profile edits.

### Content Ingestion

The backend should support:

- Pasted news.
- Pasted reports or dashboard text.
- Policy updates.
- Market updates.
- Uploaded files.
- Selected items from a multi-source feed.
- Fetched URL or API content where supported.

Recommended paths:

```text
users/{uid}/contentItems/{contentId}
users/{uid}/uploads/{uploadId}
```

Recommended `contentItems` fields:

```json
{
  "sourceType": "pasted_text | upload | feed_item | url | api",
  "title": "Fuel price update",
  "rawText": "Fuel prices increased by 12% effective immediately.",
  "storagePath": "users/{uid}/uploads/{uploadId}/report.pdf",
  "sourceUrl": "https://example.com/article",
  "sourceName": "Manual paste",
  "dedupeHash": "sha256 normalized content",
  "createdAt": "server timestamp",
  "createdBy": "{uid}",
  "status": "ready | parsing | failed"
}
```

Large files should go to Cloud Storage. Firestore should store metadata, extracted text snippets, source references, and processing state.

### News Feed Fetching

The feed should be backend-owned. The mobile app should never call third-party news APIs directly, hold provider API keys, or ship hardcoded sample feed records.

Requirements:

- Fetch news from configured outlets and providers stored in backend-managed `sourceConfigs`.
- Refresh global feed cache every 6 hours through Cloud Scheduler.
- Refresh on user request when the user pulls to refresh or taps refresh in the feed screen.
- Reuse cached feed items when a source has not changed.
- Deduplicate by canonical URL, provider article ID, and normalized title/body hash.
- Store normalized source metadata and previews in Firestore.
- Store raw provider payloads or large source snapshots in Cloud Storage only when needed for audit/debugging.
- Keep source credentials in Secret Manager, not Firestore and not Expo environment variables.
- Do not analyze every fetched article for every user automatically. Analysis starts when a user selects a feed item or configured relevance prefilter explicitly queues it.

Recommended refresh cadence:

```text
Cloud Scheduler every 6 hours
  -> Pub/Sub topic feed-refresh
  -> Cloud Run /tasks/fetch-source for each enabled source
  -> feedItems upserted in Firestore
  -> sourceFetchRuns records success/failure
  -> Expo feed screen reads cached feedItems

User refresh
  -> callable refreshContentFeed
  -> validates auth and per-user throttle
  -> enqueues same fetch-source jobs or returns recent cached feed
  -> feed screen updates from Firestore
```

Source fetchers should normalize all providers into one `feedItems` contract. Provider-specific logic belongs in backend adapters, not in mobile screens.

### Analysis Run State

Each analysis request should create a durable run document before any expensive work starts.

Recommended path:

```text
users/{uid}/analysisRuns/{runId}
```

Recommended fields:

```json
{
  "status": "queued | running | needs_simulation | simulated | failed",
  "currentStage": "load_profile",
  "profileSnapshot": {},
  "contentRefs": ["contentId"],
  "signals": [],
  "relevance": {
    "score": 0,
    "label": "low | medium | high",
    "matchedProfileFactors": []
  },
  "insights": [],
  "impact": {},
  "recommendedActions": [],
  "selectedActionId": null,
  "simulationResult": null,
  "reportSummary": null,
  "createdAt": "server timestamp",
  "updatedAt": "server timestamp",
  "completedAt": null,
  "error": null
}
```

The mobile app should listen to this document and its logs to show Analysis Progress, Impact Report, Recommended Actions, Simulation Result, and Execution Logs.

### Execution Logs

Logs must be both user-visible and backend-debuggable.

User-visible path:

```text
users/{uid}/analysisRuns/{runId}/logs/{logId}
```

Recommended fields:

```json
{
  "stage": "signal_extraction",
  "message": "Fuel price increase detected.",
  "level": "info | warning | error",
  "sequence": 40,
  "createdAt": "server timestamp",
  "metadata": {
    "signalId": "sig_fuel_increase"
  }
}
```

Backend logs should also go to Cloud Logging with `uid`, `runId`, `stage`, `traceId`, and `severity` labels. Do not log full private documents or full user content unless explicitly configured for a safe development environment.

## Agent Workflow

The agent must be an orchestrated pipeline with explicit state transitions. It should not behave like an open-ended chat assistant.

### Stage 1: Load Saved Profile

Inputs:

- Authenticated `uid`.
- `analysisRunId`.

Actions:

- Load `users/{uid}/profile/main`.
- If no profile exists, fail with `profile_required`.
- Store `profileSnapshot` on the run.
- Write log: `profile loaded`.

Output:

- Validated profile context.

### Stage 2: Ingest New Content

Inputs:

- Pasted content, upload reference, feed item ID, or URL/API reference.

Actions:

- Normalize text.
- Extract source metadata.
- Store raw content or upload reference.
- Generate `dedupeHash`.
- Write log: `content ingested`.

Output:

- Canonical content payload for analysis.

### Stage 3: Extract Facts And Signals

Signals should be structured, not prose-only.

Examples:

```json
{
  "id": "sig_fuel_price_12",
  "type": "cost_increase",
  "label": "Fuel price increase detected",
  "evidence": "Fuel prices increased by 12% effective immediately.",
  "metric": {
    "name": "fuel_price",
    "direction": "increase",
    "value": 12,
    "unit": "percent"
  },
  "locations": [],
  "confidence": 0.94,
  "severity": "high"
}
```

The backend can use deterministic extraction for simple numeric and keyword signals, then use Vertex AI/Gemini for semantic extraction and entity recognition. Model output must be validated against a schema before it is stored.

### Stage 4: Check Relevance To Saved Profile

The relevance check compares extracted signals to the saved profile.

Recommended factors:

- Domain match.
- Location match.
- Concern match.
- Risk sensitivity.
- Metric match.
- Timing/urgency.
- Confidence in evidence.

Output:

```json
{
  "score": 92,
  "label": "high",
  "matchedProfileFactors": [
    "key concern: fuel costs",
    "key concern: delivery margins",
    "domain: delivery business"
  ],
  "reason": "Fuel cost is a core concern in the saved profile."
}
```

If relevance is low, the report should still be explicit:

- Signal found.
- Why it is low relevance.
- No recommended operational action.
- Log that the content was bypassed or archived.

### Stage 5: Generate Insight

Insight translates a relevant signal into what it means for the saved profile.

Example:

```json
{
  "title": "Fuel cost increase may compress delivery margins",
  "description": "The saved profile lists fuel costs and delivery margins as key concerns. A 12% fuel price increase raises route costs immediately.",
  "affectedAreas": ["delivery margins", "long-distance routes"],
  "priority": "high",
  "evidenceSignalIds": ["sig_fuel_price_12"]
}
```

This stage must not stop at summarization. It must connect content to the user's operating context.

### Stage 6: Analyze Impact

Impact should explain consequences and time horizon.

Recommended fields:

```json
{
  "riskLevel": "high",
  "shortTerm": "Long-distance delivery margins may shrink if pricing remains unchanged.",
  "mediumTerm": "Sustained margin pressure may increase churn risk if delivery quality drops.",
  "affectedLocations": ["Lahore", "Karachi", "Islamabad"],
  "affectedMetrics": ["delivery margin", "route profitability"],
  "assumptions": [
    "Fuel is a meaningful portion of delivery cost.",
    "Current long-distance surcharge is zero."
  ]
}
```

### Stage 7: Recommend Practical Actions

Actions must be executable or simulatable. Avoid vague advice.

Recommended action contract:

```json
{
  "id": "act_long_distance_surcharge_20",
  "title": "Increase long-distance delivery fee by Rs. 20",
  "description": "Add a Rs. 20 surcharge to long-distance deliveries to offset the fuel price increase.",
  "actionType": "pricing_adjust",
  "targetSystem": "simulation_pricing_table",
  "urgency": "high",
  "confidence": 0.9,
  "expectedEffect": "Raises total long-distance delivery fee from Rs. 100 to Rs. 120.",
  "simulationSupported": true,
  "simulationParams": {
    "baseDeliveryFee": 100,
    "longDistanceSurchargeDelta": 20
  }
}
```

At least one action per relevant analysis should have `simulationSupported: true`.

### Stage 8: Select Or Allow Simulation

The product requirement says at least one action must be simulated. The backend can support either:

- Auto-select the top supported action after analysis.
- Let the user select one recommended action, then simulate it.

For reliable product behavior, auto-simulate the top supported action and still allow the user to rerun simulation for another supported action.

### Stage 9: Simulate Action

Simulation is a real backend state transition against a simulation state, not a fake button.

Recommended path:

```text
users/{uid}/simulationState/main
users/{uid}/simulations/{simulationId}
```

Example simulation state before:

```json
{
  "pricing": {
    "baseDeliveryFee": 100,
    "longDistanceSurcharge": 0,
    "totalFee": 100
  }
}
```

Example after:

```json
{
  "pricing": {
    "baseDeliveryFee": 100,
    "longDistanceSurcharge": 20,
    "totalFee": 120
  }
}
```

Simulation result fields:

```json
{
  "selectedActionId": "act_long_distance_surcharge_20",
  "status": "succeeded",
  "beforeState": {},
  "afterState": {},
  "changedFields": [
    {
      "path": "pricing.longDistanceSurcharge",
      "before": 0,
      "after": 20
    }
  ],
  "logs": [
    "action selected",
    "simulation pricing table loaded",
    "surcharge updated",
    "state changed"
  ],
  "createdAt": "server timestamp"
}
```

### Stage 10: Generate Updated Report

After simulation, update the analysis run:

- `status: simulated`
- `simulationResult`
- `reportSummary`
- `completedAt`
- final execution logs

The dashboard should then show:

- saved profile summary
- latest impact report
- recent analyzed content
- pending recommended actions
- simulated actions
- latest execution logs
- button to analyze new content
- option to update saved profile

## Agent Implementation Pattern

Use a deterministic orchestrator plus model-assisted stages.

Recommended backend modules:

```text
backend/
  functions/
    src/
      callable/
        createAnalysisRun.ts
        simulateAction.ts
        getDashboardState.ts
        updateProfile.ts
        listContentFeed.ts
        refreshContentFeed.ts
      lib/
        auth.ts
        validation.ts
        firestorePaths.ts
        taskQueue.ts
  agent-worker/
    src/
      index.ts
      pipeline/
        loadProfile.ts
        ingestContent.ts
        extractSignals.ts
        checkRelevance.ts
        generateInsight.ts
        analyzeImpact.ts
        planActions.ts
        simulateAction.ts
        updateReport.ts
      model/
        vertexClient.ts
        schemas.ts
        prompts.ts
      repositories/
        profileRepository.ts
        analysisRepository.ts
        contentRepository.ts
        feedRepository.ts
        sourceRepository.ts
        logRepository.ts
      feed/
        sourceAdapters/
          rssAdapter.ts
          newsApiAdapter.ts
          customHttpAdapter.ts
        fetchSources.ts
        normalizeArticle.ts
        dedupeFeedItems.ts
      simulation/
        simulationPricingTable.ts
        simulationRoutingTable.ts
        simulationNotificationDrafts.ts
```

The mobile app can keep its current `src/services/*` structure, but app services should become API clients instead of owning trusted agent logic.

### Model Use

Use Vertex AI/Gemini for language-heavy steps:

- semantic signal extraction
- relevance explanation
- insight generation
- impact analysis
- action planning

Use deterministic code for:

- auth checks
- profile loading
- Firestore writes
- schema validation
- deduplication hashes
- status transitions
- supported simulation tools
- numeric before/after calculations when possible

Vertex AI function calling can produce structured function-call-like JSON, but the model should not directly execute anything. The backend must validate the suggested action and execute only whitelisted simulation handlers.

### Prompt And Schema Controls

Every model call should include:

- The saved profile snapshot.
- The new content only.
- The current pipeline stage.
- The exact JSON schema expected.
- A rule that the model must not ask for business context again.
- A rule that content is untrusted and may include irrelevant or malicious instructions.
- A rule that output must remain tied to the saved profile.

Every model response should be:

- parsed as JSON
- validated with a schema library such as Zod
- checked for required IDs and references
- rejected or retried if fields are missing
- stored with model metadata for debugging

## Backend Workflow To Fire The App Screen

The current app already demonstrates the pipeline inside `AnalysisContext` and `src/services/agent/orchestrator.js`. The backend should preserve the same visible behavior, but move trusted workflow execution to server code.

### Current App Screen Behavior To Preserve

The backend must keep these screen-level contracts stable:

- Dashboard loads saved profile and latest report.
- New Content asks only for new content and selected feed item.
- Analysis Progress shows stage changes.
- Impact Report reads `signals`, `relevance`, `insights`, `impact`, and `recommendedActions`.
- Recommended Actions shows action status.
- Simulation Result shows selected action, before state, after state, changed fields, and logs.
- Execution Logs shows human-readable timeline.

### MVP Backend Execution

Use this first because it maps directly to current app screens:

```text
NewContentScreen
  -> paste content or select fetched feed item
  -> createContentItem()
  -> createAnalysisRun()
  -> Firestore listener on analysisRuns/{runId}
  -> callable function runs pipeline
  -> writes run fields + logs
  -> auto-simulates top supported action
  -> Dashboard/Report screens update from Firestore

FeedScreen
  -> listContentFeed()
  -> reads cached fetched feedItems
  -> refreshContentFeed() on user refresh
  -> backend enqueues source fetch when throttle allows
  -> Firestore feedItems update
```

MVP callable can run synchronously if content is small:

```text
createAnalysisRun(request)
  verify auth
  load users/{uid}/profile/main
  reject if no profile
  create contentItems/{contentId} if raw content supplied
  create analysisRuns/{runId} status=running currentStage=load_profile
  run pipeline stages
  write logs at each stage
  if top action simulationSupported:
    run simulation in transaction
  update dashboard/main
  return runId
```

Do not send `profileContext` from mobile as trusted input. Mobile can still show local cached profile for UX, but backend loads Firestore profile itself.

Do not send third-party source API credentials from mobile. Feed refresh requests identify source IDs only; backend loads source configuration and secrets.

### Production Backend Execution

Move long work to Cloud Tasks + Cloud Run:

```text
createAnalysisRun callable
  -> validates request
  -> creates queued run
  -> enqueues Cloud Task { uid, runId, idempotencyKey }

Cloud Run /tasks/analyze
  -> loads profile, content, run
  -> checks idempotency
  -> executes stages
  -> writes results
  -> auto-simulates or marks needs_simulation

Cloud Scheduler every 6 hours
  -> publishes feed-refresh event
  -> Cloud Run /tasks/fetch-source loads enabled sourceConfigs
  -> fetches configured outlets
  -> validates, normalizes, deduplicates, stores feedItems
  -> records sourceFetchRuns
```

### Stage State Machine

Allowed status changes:

```text
queued -> running
running -> needs_simulation
running -> simulating
running -> ignored
running -> failed
needs_simulation -> simulating
simulating -> simulated
simulating -> failed
simulated -> simulated
ignored -> ignored
failed -> queued only by explicit retry
```

Allowed stage order:

```text
load_profile
ingest_content
extract_signals
check_relevance
generate_insight
analyze_impact
plan_actions
simulate_action
update_report
```

Each stage writes:

- `analysisRuns/{runId}.currentStage`
- one `stageEvents` document
- one or more `logs` documents
- partial output only after schema validation

### Pipeline Service Boundaries

Backend modules should mirror app services but with trusted responsibilities:

```text
profileStorage
  loadSavedProfile(uid)
  saveProfile(uid, data)
  updateProfile(uid, patch)

contentIngestion
  createContentItem(uid, input)
  normalizeContent(text)
  parseUpload(storagePath)
  dedupeByHash(uid, hash)

sourceFetching
  listConfiguredSources()
  fetchEnabledSources(trigger)
  fetchSource(sourceConfig)
  normalizeFeedItem(providerPayload)
  dedupeFeedItem(sourceKey, canonicalUrl, hash)
  writeSourceFetchRun(sourceId, status, counts, error)

feedService
  listFeedItems(filters)
  refreshContentFeed(uid, requestedSourceIds)
  copyFeedItemToUserContent(uid, feedItemId)

signalExtraction
  extractSignals(content, profileSnapshot)
  validateSignals(signals)

relevanceChecking
  scoreRelevance(signals, profileSnapshot)
  classifyRelevance(score)

insightGeneration
  generateInsights(signals, relevance, profileSnapshot)

impactAnalysis
  calculateImpact(insights, profileSnapshot)

actionPlanning
  planActions(impact, simulationState, profileSnapshot)
  filterSupportedActions(actions)

simulation
  simulatePricingAdjust(uid, runId, action)
  simulateRouteShift(uid, runId, action)
  writeMockStateTransaction(uid, before, after)

executionLogs
  appendLog(uid, runId, stage, sequence, level, message, metadata)
```

### Mock Simulation Handlers

Only whitelisted handlers can change simulation state:

```text
pricing_adjust
  reads simulationState.pricing
  sets longDistanceSurcharge
  recalculates totalFee
  writes simulations/{simulationId}
  writes simulationState/main
  writes simulationStateHistory/{eventId}

route_shift
  reads simulationState.routing and pricing
  sets activeCorridor
  sets restrictedZones
  sets peakHourSurcharge
  writes same simulation/audit docs

policy_review
  no state mutation by default
  creates actionQueue item status=manual_required
```

Example `pricing_adjust` transaction:

```text
before:
  pricing.baseDeliveryFee = 100
  pricing.longDistanceSurcharge = 0
  pricing.totalFee = 100

action:
  longDistanceSurchargeDelta = 20

after:
  pricing.baseDeliveryFee = 100
  pricing.longDistanceSurcharge = 20
  pricing.totalFee = 120
```

The action button is real only if this transaction commits and UI receives changed Firestore state.

### Model Output Contract

For MVP, deterministic rules can cover known high-confidence patterns such as fuel-price increases and route restrictions. For production, model output must fit this exact shape before storage:

```json
{
  "signals": [],
  "relevance": {
    "score": 0,
    "label": "low | medium | high",
    "matchedProfileFactors": [],
    "reason": ""
  },
  "insights": [],
  "impact": {
    "riskLevel": "none | low | medium | high | critical",
    "shortTerm": "",
    "mediumTerm": "",
    "affectedLocations": [],
    "affectedMetrics": [],
    "assumptions": []
  },
  "recommendedActions": []
}
```

Reject model output if:

- It asks user for business context again.
- It recommends arbitrary code execution, arbitrary URL calls, or unknown Firestore paths.
- It recommends action types not in backend whitelist.
- It lacks evidence links back to signals/content.
- It ignores saved profile and behaves like generic summary.

### Mobile Migration Plan

Keep screens. Replace local execution gradually:

1. Keep `AnalysisContext` shape, but back it with Firestore listeners.
2. Replace local feed records with backend `feedItems` from `listContentFeed`.
3. Replace `runPipeline(content, profileContext)` call with `createAnalysisRun(contentId)`.
4. Replace local `executeSimulation(action)` with callable `simulateAction(runId, actionId)`.
5. Keep local orchestrator only as offline/development fallback.
6. Keep AsyncStorage only for drafts, cached profile fallback, and UI preferences.

## API Surface

### Callable Functions For The App

`getDashboardState`

- Loads saved profile.
- Loads latest report.
- Loads pending actions, recent content, simulations, and logs.
- Returns `profileRequired: true` only when no saved profile exists.

`saveProfile`

- Creates the one-time profile after onboarding.
- Rejects incomplete profile data.
- Creates default simulation state for simulations.

`updateProfile`

- Allows Profile Settings to update the saved profile.
- Increments `profileVersion`.
- Does not modify old analysis snapshots.

`createContentItem`

- Saves pasted content or source metadata.
- Returns `contentId`.

`createAnalysisRun`

- Requires saved profile.
- Accepts content ID or new content payload.
- Creates `analysisRuns/{runId}` with `queued` status.
- Enqueues Cloud Task for the worker.
- Returns `runId`.

`simulateAction`

- Requires `runId` and `actionId`.
- Verifies the action belongs to the user and run.
- Runs simulation or enqueues simulation task.
- Writes before/after result and logs.

`listContentFeed`

- Returns cached fetched feed items from configured outlets.
- Marks which items are already analyzed.
- Supports filters such as source, topic, region, status, and published date.

`refreshContentFeed`

- Runs when the user refreshes the feed screen.
- Verifies auth and applies throttle/idempotency.
- Enqueues source fetch jobs for enabled configured outlets, or returns recent cached feed if a refresh is already active.
- Does not expose provider credentials or raw backend fetch errors to the client.

`exportReport`

- Generates or returns a structured report export.
- Stores larger exports in Cloud Storage.

### Private Cloud Run Endpoints

These should not be called directly by the mobile app.

`POST /tasks/analyze`

- Called by Cloud Tasks.
- Body includes `uid`, `runId`, and an idempotency key.
- Loads all trusted data from Firestore.
- Runs the analysis pipeline.

`POST /tasks/simulate`

- Called by Cloud Tasks when simulation is asynchronous.
- Body includes `uid`, `runId`, `actionId`, and an idempotency key.

`POST /tasks/fetch-source`

- Called by Pub/Sub or Cloud Scheduler.
- Runs every 6 hours from Cloud Scheduler and on demand from `refreshContentFeed`.
- Fetches configured source outlets and provider APIs.
- Normalizes each article/update into the `feedItems` schema.
- Deduplicates by canonical URL, provider ID, and normalized content hash.
- Writes `sourceFetchRuns` with counts, latency, status, and sanitized errors.

## Firestore Data Model

Firestore should store durable product state, not transient UI state. The mobile app can keep animation state, open modals, draft text, and local filters in React state or AsyncStorage. Firestore should hold everything needed to restore the dashboard on another device, continue an analysis after app close, audit why an action was recommended, and show the before/after result.

Recommended collection tree:

```text
users/{uid}
users/{uid}/profile/main
users/{uid}/profileVersions/{versionId}
users/{uid}/contentItems/{contentId}
users/{uid}/analysisRuns/{runId}
users/{uid}/analysisRuns/{runId}/logs/{logId}
users/{uid}/analysisRuns/{runId}/stageEvents/{eventId}
users/{uid}/simulations/{simulationId}
users/{uid}/simulationState/main
users/{uid}/simulationStateHistory/{eventId}
users/{uid}/actionQueue/{actionId}
users/{uid}/exports/{exportId}
users/{uid}/sourceSubscriptions/{sourceId}
users/{uid}/dashboard/main

feedItems/{feedItemId}
sourceConfigs/{sourceId}
sourceFetchRuns/{runId}
systemLogs/{logId}
```

Client-readable user data should live under `users/{uid}`. Global feed items can be readable by authenticated users if they contain only public source data. User-specific analysis results should not be written into global feed documents.

### What Belongs In Each Document

#### `users/{uid}`

Auth/account shell only. Do not store operating profile here because returning-user routing depends on `users/{uid}/profile/main`.

```json
{
  "uid": "firebase uid",
  "email": "user@example.com",
  "fullName": "Operator Name",
  "provider": "password | google | anonymous",
  "isAnonymous": false,
  "createdAt": "server timestamp",
  "updatedAt": "server timestamp",
  "lastLoginAt": "server timestamp"
}
```

#### `users/{uid}/profile/main`

Single saved business/organization/project context. This is the context every analysis loads automatically.

```json
{
  "businessName": "Apex Delivery",
  "domain": "delivery business",
  "industry": "logistics",
  "operatingLocations": ["Lahore", "Karachi", "Islamabad"],
  "keyConcerns": ["fuel costs", "delivery margins", "customer churn"],
  "goals": ["protect margins", "reduce churn"],
  "constraints": ["avoid broad fee increases"],
  "riskSensitivity": "high",
  "defaultCurrency": "PKR",
  "profileVersion": 3,
  "status": "active",
  "createdAt": "server timestamp",
  "updatedAt": "server timestamp"
}
```

Store a copy in `profileVersions` each time profile changes:

```json
{
  "profileVersion": 3,
  "snapshot": {},
  "changeReason": "profile_settings_update",
  "createdAt": "server timestamp",
  "createdBy": "{uid}"
}
```

Why: analysis runs keep `profileSnapshot`, but profile version history helps debug why old reports differ from new ones.

#### `users/{uid}/contentItems/{contentId}`

One ingested content object. Create this for pasted text, selected feed item, uploaded document text, URL fetch, or API item.

```json
{
  "sourceType": "pasted_text | upload | feed_item | url | api",
  "sourceName": "Manual Input",
  "sourceKey": "rss_dawn | newsapi_logistics | google_news | custom_http",
  "sourceUrl": "https://example.com/article",
  "feedItemId": "feed_1",
  "title": "Fuel prices increased by 12% effective immediately",
  "rawText": "Fuel prices increased by 12% effective immediately.",
  "normalizedTextHash": "sha256 normalized text",
  "contentLength": 58,
  "detectedTopics": ["Fuel Costs", "Logistics"],
  "storagePath": null,
  "parserStatus": "ready | parsing | failed",
  "analysisStatus": "new | queued | analyzed | ignored | failed",
  "latestRunId": "run_123",
  "createdAt": "server timestamp",
  "createdBy": "{uid}"
}
```

Rules:

- Keep small raw text in Firestore if it is below size limit and acceptable for product policy.
- Store files and large extracted text in Cloud Storage, then keep `storagePath`, snippets, and metadata in Firestore.
- Use `normalizedTextHash` for dedupe before creating another analysis run.

#### `users/{uid}/analysisRuns/{runId}`

Main durable workflow document. One run equals one content-to-action pipeline pass.

```json
{
  "status": "queued | running | needs_simulation | simulating | simulated | ignored | failed",
  "currentStage": "load_profile | ingest_content | extract_signals | check_relevance | generate_insight | analyze_impact | plan_actions | simulate_action | update_report",
  "stageIndex": 0,
  "profileVersion": 3,
  "profileSnapshot": {},
  "contentRefs": ["content_123"],
  "sourceSnapshot": {
    "sourceType": "feed_item",
    "sourceName": "Configured News Outlet",
    "title": "Fuel prices increased by 12% effective immediately",
    "sourceUrl": "https://example.com/fuel-price-alert"
  },
  "signals": [],
  "relevance": {
    "score": 92,
    "label": "high",
    "matchedProfileFactors": ["key concern: fuel costs"],
    "reason": "Fuel cost is part of saved profile."
  },
  "insights": [],
  "impact": {},
  "recommendedActions": [],
  "selectedActionId": "act_long_distance_surcharge_20",
  "simulationId": "sim_123",
  "simulationResult": null,
  "reportSummary": {
    "title": "Fuel cost increase may compress delivery margins",
    "riskLevel": "high",
    "primaryAction": "Increase long-distance delivery fee by Rs. 20"
  },
  "model": {
    "provider": "vertex_ai",
    "modelName": "gemini",
    "promptVersion": "2026-05-18",
    "schemaVersion": "analysis-run-v1"
  },
  "traceId": "trace_abc",
  "idempotencyKey": "uid:contentHash:profileVersion",
  "createdAt": "server timestamp",
  "updatedAt": "server timestamp",
  "completedAt": null,
  "error": null
}
```

Store arrays directly on the run while they stay small. If reports become large, split into subcollections:

```text
users/{uid}/analysisRuns/{runId}/signals/{signalId}
users/{uid}/analysisRuns/{runId}/insights/{insightId}
users/{uid}/analysisRuns/{runId}/actions/{actionId}
```

MVP can keep arrays because current app screens expects one report at a time and a small action list.

#### `users/{uid}/analysisRuns/{runId}/logs/{logId}`

User-visible execution timeline. This powers `AgentLogList` and dashboard log previews.

```json
{
  "sequence": 70,
  "stage": "plan_actions",
  "level": "info | success | warning | error",
  "message": "Recommended pricing adjustment generated.",
  "metadata": {
    "actionId": "act_long_distance_surcharge_20"
  },
  "createdAt": "server timestamp"
}
```

Use fixed sequence ranges so UI order stays stable:

```text
10 load_profile
20 ingest_content
30 extract_signals
40 check_relevance
50 generate_insight
60 analyze_impact
70 plan_actions
80 simulate_action
90 update_report
```

#### `users/{uid}/analysisRuns/{runId}/stageEvents/{eventId}`

Optional machine-readable progress events. Use when UI needs progress bars, retries, or stage timing separate from human logs.

```json
{
  "stage": "extract_signals",
  "status": "started | completed | skipped | failed",
  "startedAt": "server timestamp",
  "completedAt": "server timestamp",
  "durationMs": 820,
  "workerAttempt": 1
}
```

#### `users/{uid}/actionQueue/{actionId}`

Dashboard-friendly list of pending, simulated, failed, or dismissed actions across all runs.

```json
{
  "runId": "run_123",
  "actionId": "act_long_distance_surcharge_20",
  "title": "Increase long-distance delivery fee by Rs. 20",
  "actionType": "pricing_adjust",
  "targetSystem": "simulation_pricing_table",
  "urgency": "high",
  "simulationSupported": true,
  "status": "pending | simulating | simulated | failed | dismissed",
  "createdAt": "server timestamp",
  "updatedAt": "server timestamp"
}
```

Why duplicate actions here: dashboard can load pending actions without scanning every historical run.

#### `users/{uid}/simulationState/main`

Current simulated business system state. This is where action buttons create real state changes.

```json
{
  "pricing": {
    "baseDeliveryFee": 100,
    "longDistanceSurcharge": 0,
    "peakHourSurcharge": 15,
    "totalFee": 100,
    "currency": "PKR"
  },
  "routing": {
    "activeCorridor": "standard",
    "restrictedZones": [],
    "reroutedVehicles": 0
  },
  "customerComms": {
    "lastDraftId": null,
    "pendingNotifications": 0
  },
  "lastSimulationId": null,
  "updatedAt": "server timestamp"
}
```

Seed this document during `saveProfile` so first simulation has a known before state.

#### `users/{uid}/simulations/{simulationId}`

Immutable record of one simulation. Also copy key result into `analysisRuns/{runId}.simulationResult` for fast report render.

```json
{
  "runId": "run_123",
  "selectedActionId": "act_long_distance_surcharge_20",
  "actionType": "pricing_adjust",
  "targetSystem": "simulation_pricing_table",
  "status": "succeeded | failed",
  "beforeState": {
    "pricing": {
      "baseDeliveryFee": 100,
      "longDistanceSurcharge": 0,
      "totalFee": 100
    }
  },
  "afterState": {
    "pricing": {
      "baseDeliveryFee": 100,
      "longDistanceSurcharge": 20,
      "totalFee": 120
    }
  },
  "changedFields": [
    {
      "path": "pricing.longDistanceSurcharge",
      "before": 0,
      "after": 20
    },
    {
      "path": "pricing.totalFee",
      "before": 100,
      "after": 120
    }
  ],
  "logs": [
    "action selected",
    "simulation pricing table loaded",
    "surcharge updated",
    "state changed"
  ],
  "createdAt": "server timestamp",
  "createdBy": "{uid}"
}
```

#### `users/{uid}/simulationStateHistory/{eventId}`

Audit trail for every simulation state mutation.

```json
{
  "simulationId": "sim_123",
  "runId": "run_123",
  "actionId": "act_long_distance_surcharge_20",
  "changedFields": [],
  "beforeDigest": "sha256",
  "afterDigest": "sha256",
  "createdAt": "server timestamp"
}
```

#### `users/{uid}/dashboard/main`

Optional materialized dashboard summary. Useful when history grows and mobile dashboard should load quickly.

```json
{
  "latestRunId": "run_123",
  "latestReportTitle": "Fuel cost increase may compress delivery margins",
  "latestRiskLevel": "high",
  "recentContentIds": ["content_123"],
  "pendingActionCount": 1,
  "simulatedActionCount": 4,
  "lastLogMessage": "state changed",
  "profileSummary": {
    "businessName": "Apex Delivery",
    "domain": "delivery business",
    "riskSensitivity": "high"
  },
  "updatedAt": "server timestamp"
}
```

MVP can compute dashboard state from profile + latest runs. Production should materialize this doc from backend workers.

#### `feedItems/{feedItemId}`

Global public or backend-curated content feed. No private user data.

```json
{
  "sourceType": "news | alert | policy | market | report",
  "sourceKey": "rss_dawn",
  "sourceName": "Configured News Outlet",
  "title": "Fuel prices increased by 12% effective immediately",
  "bodyPreview": "The Ministry of Energy announced...",
  "sourceUrl": "https://example.com/fuel-price-alert",
  "canonicalUrl": "https://example.com/fuel-price-alert",
  "providerArticleId": "provider-id-123",
  "normalizedHash": "sha256 normalized title/body/url",
  "detectedTopics": ["Fuel Costs", "Logistics"],
  "publishedAt": "timestamp",
  "fetchedAt": "server timestamp",
  "createdAt": "server timestamp",
  "status": "active | archived | failed_parse"
}
```

When user analyzes one global feed item, backend copies source fields into `contentItems` and `analysisRuns.sourceSnapshot`. Do not store user-specific relevance on global feed item.

#### `sourceConfigs/{sourceId}`

Backend-managed configured news outlets and content providers. Client can read only safe display fields if needed; secrets stay in Secret Manager.

```json
{
  "sourceKey": "rss_dawn",
  "name": "Dawn Business RSS",
  "type": "rss | news_api | custom_http",
  "enabled": true,
  "baseUrl": "https://example.com/rss",
  "regions": ["Pakistan"],
  "defaultTopics": ["fuel", "logistics", "policy", "markets"],
  "refreshEveryHours": 6,
  "secretName": null,
  "lastFetchedAt": "server timestamp",
  "lastStatus": "succeeded | failed",
  "createdAt": "server timestamp",
  "updatedAt": "server timestamp"
}
```

Rules:

- Only backend/admin tooling writes `sourceConfigs`.
- `secretName` points to Secret Manager and never stores the secret value.
- Disabled sources are skipped by scheduled and user-triggered refreshes.
- Source fetchers must enforce per-source timeout, item limit, and retry policy.

#### `sourceFetchRuns/{runId}`

Operational audit for scheduled and manual feed refreshes.

```json
{
  "trigger": "scheduled_6h | user_refresh",
  "requestedBy": "{uid or system}",
  "sourceIds": ["rss_dawn"],
  "status": "running | succeeded | partial | failed",
  "startedAt": "server timestamp",
  "completedAt": "server timestamp",
  "counts": {
    "fetched": 40,
    "created": 12,
    "updated": 6,
    "deduped": 22,
    "failed": 0
  },
  "errors": []
}
```

#### `users/{uid}/sourceSubscriptions/{sourceId}`

User-configured feed source preferences. Do not store third-party API secrets here; backend source credentials belong in Secret Manager.

```json
{
  "sourceKey": "newsapi",
  "name": "NewsAPI logistics watch",
  "enabled": true,
  "keywords": ["fuel", "delivery", "Karachi"],
  "regions": ["Pakistan"],
  "createdAt": "server timestamp",
  "updatedAt": "server timestamp"
}
```

### Client Write vs Backend Write

Client can write:

- `users/{uid}` account shell through trusted auth flow.
- `users/{uid}/profile/main` during onboarding/Profile Settings.
- `users/{uid}/contentItems/{contentId}` only for new input metadata/raw pasted content.
- `users/{uid}/analysisRuns/{runId}` only request fields: `contentRefs`, `sourceSnapshot`, `status: queued`.
- `users/{uid}/sourceSubscriptions/{sourceId}` user preferences.
- `refreshContentFeed` callable requests only; not direct `feedItems` or `sourceConfigs` writes.

Backend only writes:

- `analysisRuns.signals`
- `analysisRuns.relevance`
- `analysisRuns.insights`
- `analysisRuns.impact`
- `analysisRuns.recommendedActions`
- `analysisRuns.simulationResult`
- `analysisRuns.reportSummary`
- `analysisRuns.status` after queued
- `analysisRuns/{runId}/logs/*`
- `simulations/*`
- `simulationState/*`
- `simulationStateHistory/*`
- `actionQueue/*`
- `dashboard/main`
- `feedItems/*`
- `sourceConfigs/*`
- `sourceFetchRuns/*`

This prevents mobile clients from forging reports, actions, or simulated state.

### Firestore Indexes

Create indexes for expected dashboard queries:

```text
users/{uid}/analysisRuns: status ASC, createdAt DESC
users/{uid}/analysisRuns: completedAt DESC
users/{uid}/contentItems: analysisStatus ASC, createdAt DESC
users/{uid}/actionQueue: status ASC, urgency ASC, createdAt DESC
users/{uid}/simulations: runId ASC, createdAt DESC
feedItems: status ASC, publishedAt DESC
feedItems: sourceKey ASC, status ASC, publishedAt DESC
feedItems: status ASC, detectedTopics ARRAY, publishedAt DESC
sourceFetchRuns: status ASC, startedAt DESC
```

### Retention

Suggested retention:

- `profile/main`: forever until account deletion.
- `profileVersions`: keep last 20 versions or 2 years.
- `contentItems.rawText`: keep 90-180 days unless user exports/keeps report.
- `analysisRuns`: keep while user account exists, or soft-delete on request.
- `logs`: keep with run, but avoid full raw content in logs.
- `simulationStateHistory`: keep 1 year for audit.
- `feedItems`: keep 30-90 days of active feed items, archive older items or compact to metadata.
- `sourceFetchRuns`: keep 30-90 days unless debugging requires longer.
- `systemLogs`: 30-90 days in Cloud Logging unless compliance needs longer.

## Cloud Storage Layout

Recommended paths:

```text
users/{uid}/uploads/{uploadId}/{fileName}
users/{uid}/exports/{exportId}/report.json
users/{uid}/exports/{exportId}/report.pdf
sourceSnapshots/{sourceId}/{snapshotId}.json
sourcePayloads/{sourceId}/{fetchRunId}/{providerItemId}.json
```

Storage requirements:

- Require Firebase Auth for user upload paths.
- Limit file size and MIME types.
- Store file metadata in Firestore.
- Run document parsing on the backend.
- Do not let uploaded documents become direct model prompts without cleaning and extraction.

## Security Requirements

### Client Security

- Keep only public Firebase web config and public API endpoints in `EXPO_PUBLIC_*`.
- Never put model API keys, service account keys, source provider secrets, or admin credentials in Expo environment variables.
- Use Firebase Auth persistence as currently configured with AsyncStorage.
- Add App Check before production launch.

### Firestore Security Rules

Rules should enforce:

- Users can read and write only their own profile setup and allowed user-owned records.
- Clients can create requested runs but cannot write trusted output fields such as `signals`, `impact`, `recommendedActions`, or `simulationResult`.
- Only backend service accounts write computed agent outputs.
- Deletes are restricted or soft-deleted for auditability.

The current `firestore.rules` already uses an owner check for `users/{userId}`. It should be tightened when backend-generated fields are introduced.

### Backend Security

- Verify Firebase Auth on every callable.
- Use IAM for Cloud Run access.
- Use least-privilege service accounts.
- Use Secret Manager for all secrets.
- Validate request shape and maximum content length.
- Rate-limit analysis creation per user.
- Add idempotency keys to Cloud Tasks handlers.
- Treat pasted content, uploaded files, and fetched pages as untrusted input.
- Keep a whitelist of simulation tool handlers.
- Never allow model output to choose arbitrary URLs, Firestore paths, or code execution targets.

### App Check

App Check should be enabled for callable functions, Firestore, and Storage before production. App Check helps ensure requests come from the real app or an attested app environment. It is not a replacement for Firebase Auth or Firestore rules.

## Hosting On Firebase And Google Cloud

### Firebase Project Setup

1. Create or select a Firebase project.
2. Upgrade to Blaze for Cloud Functions, Cloud Run integration, Cloud Tasks, Vertex AI, and production Storage usage.
3. Enable Firebase Auth providers used by the app.
4. Create Firestore in the selected region.
5. Enable Cloud Storage for Firebase.
6. Register Android and iOS apps matching the Expo app identifiers.
7. Add Firebase web app config values to local `.env` files with `EXPO_PUBLIC_FIREBASE_*` names.

Client environment example:

```text
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=...
EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION=us-central1
```

Do not put backend secrets in this file. Expo inlines `EXPO_PUBLIC_*` variables into the app bundle.

### Firebase Functions Setup

Recommended runtime:

- Node.js 22 for new backend code, or Node.js 20 if you want the most conservative match with Expo SDK 54's minimum Node requirement.
- TypeScript for backend code.
- Firebase Functions 2nd gen for new callable functions.

Example setup commands:

```bash
firebase login
firebase init firestore
firebase init functions
firebase deploy --only firestore:rules
firebase deploy --only functions
```

For a functions package:

```json
{
  "engines": {
    "node": "22"
  }
}
```

If you prefer Node 20:

```json
{
  "engines": {
    "node": "20"
  }
}
```

### Cloud Run Agent Worker Setup

Use Cloud Run when:

- Analysis may exceed callable latency expectations.
- You need larger model orchestration dependencies.
- You want a normal HTTP service with private endpoints.
- You want independent scaling and deployments for the agent.

Recommended setup:

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudtasks.googleapis.com
gcloud services enable pubsub.googleapis.com

gcloud iam service-accounts create cognitivekinetic-agent

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:cognitivekinetic-agent@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:cognitivekinetic-agent@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:cognitivekinetic-agent@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud run deploy cognitivekinetic-agent \
  --source backend/agent-worker \
  --region us-central1 \
  --no-allow-unauthenticated \
  --service-account cognitivekinetic-agent@PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars FIREBASE_PROJECT_ID=PROJECT_ID,VERTEX_LOCATION=us-central1
```

Do not make the agent worker public unless there is a specific reason and compensating authentication layer.

### Cloud Tasks Setup

Use Cloud Tasks for analysis runs because each run is an asynchronous work item with retry behavior and rate controls.

Example:

```bash
gcloud tasks queues create analysis-runs \
  --location us-central1 \
  --max-dispatches-per-second 5 \
  --max-concurrent-dispatches 10
```

Cloud Task handlers must be idempotent because a task can be delivered more than once. The worker should check `analysisRuns/{runId}.status` and `workerAttemptId` before doing expensive work.

### Pub/Sub And Scheduled Feeds

Use Pub/Sub when many source fetch events or downstream services need to react independently.

Good uses:

- Scheduled news/feed ingestion.
- Fan-out to source-specific fetchers.
- Analytics export events.
- Background enrichment not required for the user's immediate screen.

Do not use Pub/Sub as the direct mobile app communication channel. The mobile app should use Firestore listeners or callable functions.

Recommended scheduled feed setup:

```bash
gcloud pubsub topics create feed-refresh

gcloud scheduler jobs create pubsub cognitivekinetic-feed-refresh-6h \
  --schedule "0 */6 * * *" \
  --topic feed-refresh \
  --message-body '{"trigger":"scheduled_6h"}' \
  --location us-central1
```

Manual user refresh should call `refreshContentFeed`, which can publish to the same topic or enqueue Cloud Tasks for specific sources. Apply a per-user throttle, for example one manual refresh every 10 minutes, so repeated pulls do not exhaust provider quotas.

### Vertex AI Setup

Use Vertex AI/Gemini through the backend only.

Backend requirements:

- The Cloud Run service account needs `roles/aiplatform.user`.
- Prompts and schemas live in backend source, not in the app.
- Model output is stored only after validation.
- Store prompt version, model name, and schema version on each run for reproducibility.

Recommended model use:

- Fast/low-cost model for extraction and relevance.
- Stronger model for action planning if needed.
- Deterministic code for final simulation state mutation.

### Secret Manager Setup

Store:

- Third-party feed API keys.
- SMTP provider credentials if email simulation becomes real email.
- Webhook shared secrets.
- Model/provider configuration that should not be public.

Example:

```bash
gcloud secrets create SOURCE_API_KEY --replication-policy automatic
gcloud secrets versions add SOURCE_API_KEY --data-file ./source_api_key.txt
```

Grant only the backend service account access.

### Firebase Hosting Or App Hosting

The mobile app itself is distributed through Expo/EAS and app stores, not Firebase Hosting.

Use Firebase Hosting or Firebase App Hosting only if you add:

- A web dashboard.
- An admin console.
- Public documentation.
- A static report viewer.
- A Next.js/React web companion app.

For the mobile app's backend, Firebase Functions and Cloud Run are the important hosting targets.

## Mobile App Integration Pattern

The app should call backend services through small client modules:

```text
src/services/api/profileApi.js
src/services/api/contentApi.js
src/services/api/analysisApi.js
src/services/api/simulationApi.js
src/services/api/feedApi.js
```

Example app flow:

1. Login succeeds.
2. App calls or observes `users/{uid}/profile/main`.
3. If profile exists, route to Dashboard.
4. Dashboard listens to latest run, actions, simulations, and logs.
5. Feed screen calls `listContentFeed` and listens to cached fetched `feedItems`.
6. User refresh calls `refreshContentFeed`; backend refreshes configured outlets when throttle allows.
7. New Content screen sends only new pasted content or selected `feedItemId`.
8. App calls `createAnalysisRun`.
9. App navigates to Analysis Progress with `runId`.
10. App listens to `analysisRuns/{runId}` and logs.
11. App shows report and recommended actions.
12. App calls `simulateAction` or displays auto-simulated result.
13. App shows before/after state and execution logs.

## Testing Requirements

Backend tests should cover:

- Profile required before analysis.
- Returning user dashboard loads saved profile.
- New analysis rejects business context fields if sent from the wrong screen.
- Content ingestion creates stable `contentItems`.
- Scheduled source fetch runs every 6 hours and upserts `feedItems`.
- User refresh triggers backend fetch or returns recent cached feed under throttle.
- Feed dedupe prevents duplicate articles across repeated provider payloads.
- Source fetch failures write `sourceFetchRuns` without breaking dashboard reads.
- Relevance scoring uses profile concerns and locations.
- Low relevance content produces no operational action.
- High relevance fuel price scenario produces a pricing action.
- Simulation changes pricing state from Rs. 100 total to Rs. 120 total.
- Execution logs include all required stages.
- Firestore rules block cross-user reads and writes.
- Cloud Task retry does not duplicate completed simulation side effects.

Use:

- Firebase Emulator Suite for Auth, Firestore, Functions, and Storage where possible.
- Unit tests for pipeline stage functions.
- Integration tests for callable functions.
- Golden JSON fixtures for known scenarios such as fuel price increase.

## Observability

Track:

- analysis runs created
- analysis runs completed
- failed runs by stage
- average analysis latency
- model call latency
- model cost estimate
- token/input size estimate
- simulation success/failure
- Cloud Task retries
- source fetch failures

Each run should have:

- `runId`
- `uid`
- `traceId`
- `profileVersion`
- `promptVersion`
- `schemaVersion`
- `modelName`
- `createdAt`
- `completedAt`

User-visible logs are product output. Cloud Logging is engineering output. Keep both.

## Cost And Performance Guidance

- Keep small pasted-content analyses synchronous only for MVP.
- Use Cloud Tasks for anything involving document parsing, URL fetches, multiple model calls, or retries.
- Store raw large files in Cloud Storage, not Firestore.
- Use summaries or extracted text chunks instead of sending entire files to the model.
- Cache feed items and avoid refetching unchanged sources.
- Use provider ETags, `If-Modified-Since`, canonical URLs, and normalized hashes when available.
- Deduplicate content by normalized hash.
- Set Cloud Run max instances to control runaway costs.
- Add per-user daily analysis limits.
- Prefer structured JSON outputs to reduce retry and parsing costs.
- Avoid minimum instances until latency requires them, because idle warm instances cost money.

## Implementation Roadmap

### Phase 1: Firebase-Backed MVP

- Keep current Expo Firebase JS SDK setup.
- Confirm Auth, Firestore, and profile save/load.
- Add callable function scaffolding.
- Move trusted analysis execution from mobile-only code into backend functions.
- Store `analysisRuns`, logs, actions, and simulation results in Firestore.
- Add Storage path and rules for uploads.

### Phase 2: Agent Worker

- Add Cloud Run `agent-worker`.
- Add Cloud Tasks queue.
- Make `createAnalysisRun` enqueue a task.
- Move the pipeline into the worker.
- Add idempotency and retries.
- Add schema validation and prompt versioning.

### Phase 3: Multi-Source Feed

- Add backend-managed `sourceConfigs`.
- Add Cloud Scheduler job for 6-hour refresh.
- Add Pub/Sub or Cloud Tasks source fetch fan-out.
- Store normalized fetched `feedItems`.
- Add `refreshContentFeed` callable for user-triggered refresh.
- Add source fetch run auditing and dedupe.
- Allow users to analyze selected feed items against saved profile.

### Phase 4: Production Hardening

- Enable App Check enforcement.
- Tighten Firestore and Storage rules.
- Add rate limiting and quotas.
- Add Cloud Monitoring alerts.
- Add BigQuery export for aggregate evaluation.
- Add report export generation.
- Add backup and retention policy.

## Key Decisions

- Use Firebase Auth as the identity layer.
- Use Firestore as the app-facing state store.
- Use callable functions as the mobile API gateway.
- Use Cloud Run for the production agent worker.
- Use Cloud Tasks for user-requested analysis jobs.
- Use Pub/Sub for source ingestion and service-to-service events.
- Refresh configured news outlets every 6 hours and on user refresh through backend fetchers.
- Use Vertex AI/Gemini for structured model-assisted reasoning.
- Use deterministic backend code for trusted state changes and simulations.
- Keep all backend secrets outside Expo `EXPO_PUBLIC_*` variables.

## Official References Reviewed

- Expo SDK 54 reference: https://docs.expo.dev/versions/v54.0.0/
- Expo Firebase guide: https://docs.expo.dev/guides/using-firebase/
- Expo environment variables: https://docs.expo.dev/guides/environment-variables/
- Firebase callable functions: https://firebase.google.com/docs/functions/callable
- Cloud Functions for Firebase 2nd gen/runtime docs: https://firebase.google.com/docs/functions/manage-functions
- Cloud Firestore data model: https://firebase.google.com/docs/firestore/data-model
- Firestore security rules conditions: https://firebase.google.com/docs/firestore/security/rules-conditions
- Cloud Storage for Firebase uploads: https://firebase.google.com/docs/storage/web/upload-files
- Firebase App Check: https://firebase.google.com/docs/app-check
- Cloud Run overview: https://cloud.google.com/run/docs/overview/what-is-cloud-run
- Cloud Tasks overview: https://cloud.google.com/tasks/docs/dual-overview
- Pub/Sub overview: https://cloud.google.com/pubsub/docs/overview
- Vertex AI function calling reference: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/function-calling
- Secret Manager overview: https://cloud.google.com/secret-manager/docs/overview
