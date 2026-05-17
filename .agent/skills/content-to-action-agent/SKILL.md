---
name: content-to-action-agent
description: Use this skill when designing, building, refactoring, or reviewing the Autonomous Content-to-Action Agent project.
---

# Content-to-Action Agent Skill

Use this skill for all project decisions.

## Core Rule

This project is not a summarizer and not a chatbot.

Every feature must support this pipeline:

saved profile → new content → relevance check → signal extraction → insight → impact → recommended action → simulation → outcome report

## Saved Profile Rule

The user enters business, organization, project, or operating context only once.

This happens during onboarding.

After onboarding:

- profile is saved
- profile is reused automatically
- new content is analyzed against the saved profile
- user is not asked to re-enter business context during every analysis

Only the Profile Settings screen should allow editing the saved profile.

## Returning User Flow

When a returning user logs in:

1. Load saved profile.
2. Show main report/dashboard.
3. Show latest risks, impacts, actions, and logs.
4. Allow user to paste new content.
5. Optionally show fetched/multi-source content.
6. Analyze new content using saved profile.

Do not send returning users directly to business context setup unless no profile exists.

## Required App States

The app should support these states:

1. No profile exists
   - show onboarding/profile setup

2. Profile exists, no analysis yet
   - show dashboard with empty report state
   - encourage user to paste or fetch content

3. Profile exists, analysis exists
   - show dashboard with latest report
   - show recent content items
   - show recommended actions
   - show simulations/logs

4. New content added
   - analyze against saved profile

5. Simulation executed
   - update before/after state
   - append execution logs

## Required Data Models

Use or create models similar to:

UserProfile:
- id
- name
- domain
- locations
- keyConcerns
- importantCosts
- targetUsers
- goals
- riskSensitivity
- createdAt
- updatedAt

ContentItem:
- id
- sourceType
- title
- body
- timestamp
- sourceName
- relevanceStatus
- detectedTopics

ExtractedSignal:
- id
- contentId
- type
- label
- evidence
- metric
- severity
- relevanceScore

Insight:
- id
- title
- description
- evidence
- affectedArea
- priority

ImpactAnalysis:
- id
- insightId
- shortTermImpact
- mediumTermImpact
- riskLevel
- explanation

RecommendedAction:
- id
- title
- description
- rationale
- urgency
- confidence
- actionType
- targetSystem
- simulationSupported

SimulationResult:
- id
- actionId
- status
- beforeState
- afterState
- logs
- generatedArtifacts
- timestamp

ExecutionLog:
- id
- level
- stage
- message
- timestamp

## Required Screens

Implement or preserve these screens:

1. Profile Setup
   - first-time only
   - collects reusable profile context
   - saves profile

2. Main Dashboard / Report
   - default after login
   - shows saved profile summary
   - shows latest analysis report
   - shows recent content
   - shows pending actions
   - shows simulation results

3. New Content Input
   - collects only new content
   - uses saved profile automatically
   - must not ask for business context again

4. Multi-source Feed
   - shows fetched/imported/pasted content
   - marks relevant vs ignored items
   - allows analysis of selected content

5. Analysis Progress
   - shows agent stages
   - shows live logs

6. Insight and Impact Report
   - extracted signals
   - relevance to saved profile
   - insight
   - impact analysis

7. Recommended Actions
   - practical actions
   - rationale
   - urgency/confidence
   - simulate/queue buttons

8. Simulation Result
   - selected action
   - before/after state
   - resulting state change

9. Execution Logs
   - traceable decision flow
   - simulated tool/API call logs

10. Profile Settings
   - edit saved profile only here

## Required Agent Services

Keep these separate from UI:

1. profileService
   - save profile
   - load profile
   - update profile
   - check if profile exists

2. contentIngestionService
   - accept pasted/imported/fetched content
   - normalize content
   - create content item

3. relevanceService
   - compare content signals against saved profile
   - mark content as relevant, low relevance, or ignored

4. signalExtractor
   - extract facts, risks, metrics, entities, dates, locations

5. insightEngine
   - produce meaningful insights
   - avoid generic summary output

6. impactAnalyzer
   - explain consequences based on saved profile

7. actionPlanner
   - recommend practical actions
   - rank by urgency/confidence

8. simulationService
   - execute mock action
   - produce before/after state
   - generate logs

9. traceService
   - record agent workflow
   - store execution logs

## Analysis Logic

When analyzing new content:

1. Load saved profile.
2. Parse new content.
3. Extract signals.
4. Compare signals against profile concerns, costs, locations, domain, and goals.
5. Ignore or down-rank irrelevant content.
6. Generate insight only if relevance is meaningful.
7. Explain why it matters.
8. Recommend specific action.
9. Simulate action if supported.
10. Return report.

## Relevance Examples

Saved profile:
delivery business, Lahore/Karachi/Islamabad, fuel cost, margins, customer churn

Relevant content:
fuel price increase, road closure, delivery regulation, competitor delivery discount, regional demand drop

Less relevant content:
general celebrity news, unrelated sports update, foreign policy update with no operational effect

## Simulation Rules

Every simulation must show real state transition.

Bad:
"Action simulated successfully."

Good:
Before:
delivery_fee = 100

Action:
increase long-distance surcharge by 20

After:
delivery_fee = 120

Logs:
profile loaded
signal detected
relevance confirmed
pricing action selected
mock API call executed
state updated

## UI Rules

Do not design as a chat interface.

Avoid:

- chat bubbles
- assistant avatars
- message threads
- repeated context forms
- visual branding details
- generic summary cards only

Prefer:

- dashboard
- report cards
- status badges
- workflow steps
- relevance labels
- before/after comparison
- execution timeline
- mock system state

## MVP Priority

Build in this order:

1. Profile setup and saved profile state
2. Returning-user dashboard
3. New content input using saved profile
4. Hardcoded/mocked multi-source content feed
5. Analysis pipeline
6. Insight/impact report
7. Recommended actions
8. One working action simulation
9. Execution logs
10. README explanation

## Demo Requirement

The demo must clearly show:

1. user profile already saved
2. user logs in
3. dashboard appears
4. user pastes or selects new content
5. system uses saved profile
6. system checks relevance
7. system gives impact
8. system suggests changes
9. system simulates one change
10. system shows before/after state and logs
