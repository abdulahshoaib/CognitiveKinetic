# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.


The challenge name and system description are only conceptual context. They must not replace the existing project name.

Preserve the current app/project identity. Only update screens, flows, logic, services, and documentation needed for the content-to-action workflow.

## Core Product Rule

This project is an agentic content-to-action system.

It is not a chatbot.
It is not a generic summarization tool.

The system must follow this pipeline:

saved profile → new content/news → relevance check → extracted signals → insight → impact analysis → recommended action → simulated execution → updated report

## Saved Profile Rule

The user must enter their business, organization, project, or operating context only once during onboarding.

After onboarding:

- save the profile
- reuse the saved profile automatically
- do not ask for business context again during every analysis
- only allow profile changes from Profile Settings

New pasted content, uploaded reports, dashboard text, articles, policy updates, or fetched news must be analyzed against the saved profile.

## Returning User Flow

When a returning user logs in:

1. Load the saved profile.
2. Show the main report/dashboard.
3. Show latest risks, impacts, recommendations, simulations, and logs.
4. Allow the user to paste new content or review fetched content.
5. Analyze new content using the saved profile.

Do not send returning users to the business context setup screen unless no saved profile exists.

## Required User Flow

First-time user:

1. Login or signup.
2. Complete one-time profile setup.
3. Land on the main report/dashboard.

Returning user:

1. Login.
2. Land on the main report/dashboard.
3. Paste new content or select fetched content.
4. Run analysis using saved profile.
5. View impact report.
6. View recommended changes.
7. Simulate one action.
8. View before/after state and execution logs.

## Required Screens

The mobile app should support these screens:

1. Login / Signup
2. One-time Profile Setup
3. Main Report / Dashboard
4. New Content Input
5. Multi-source Content Feed
6. Analysis Progress
7. Insight and Impact Report
8. Recommended Actions
9. Action Simulation Result
10. Execution Logs
11. Profile Settings

## Dashboard Rule

After login, the user should land on the main report/dashboard.

The dashboard should show:

- saved profile summary
- latest impact report
- recent analyzed content
- pending recommended actions
- simulated actions
- latest execution logs
- button to analyze new content
- option to update saved profile

The dashboard must make it obvious that the saved profile is reused automatically.

## New Analysis Rule

The New Analysis screen must ask only for new content.

It should support:

- pasted news
- reports
- dashboard text
- policy updates
- market updates
- uploaded documents
- fetched content from multiple sources where supported

Do not ask for business details again on this screen.

The main button should clearly indicate that analysis uses the saved profile.

Example:

Analyze Using Saved Profile

## Agentic Workflow Rule

Every analysis should follow structured stages:

1. Load saved profile.
2. Ingest new content.
3. Extract facts/signals.
4. Check relevance to saved profile.
5. Generate insight.
6. Analyze impact.
7. Recommend practical actions.
8. Select or allow simulation of one action.
9. Simulate action.
10. Show before/after state.
11. Generate execution logs.

## Action Simulation Rule

At least one action must be simulated.

A simulation must include:

- selected action
- before state
- after state
- execution logs
- visible UI result

Do not create fake action buttons that do not change state.

## Example Demo Scenario

Saved profile:

- domain: delivery business
- operating locations: Lahore, Karachi, Islamabad
- key concerns: fuel costs, delivery margins, customer churn
- risk sensitivity: high

New content:

Fuel prices increased by 12% effective immediately.

Expected result:

Signal:
Fuel price increase detected.

Relevance:
High relevance because fuel cost is part of the saved profile.

Insight:
Fuel cost increase may compress delivery margins.

Impact:
Long-distance delivery margins may shrink if pricing remains unchanged.

Recommended action:
Increase long-distance delivery fee by Rs. 20.

Simulation:
Update mock pricing table.

Before:

base delivery fee = Rs. 100
long-distance surcharge = Rs. 0
total fee = Rs. 100

After:

base delivery fee = Rs. 100
long-distance surcharge = Rs. 20
total fee = Rs. 120

Logs:

profile loaded → content ingested → signal detected → relevance confirmed → impact analyzed → action selected → mock update executed → state changed

## Architecture Rule

Keep UI and agent logic separate.

Recommended structure:

src/
├── screens/
├── components/
├── context/
├── services/
├── services/agent/
├── services/simulation/
├── data/
├── hooks/
└── utils/

Agent logic should not be hardcoded directly inside screen components.

## Required Services

Create or preserve services for:

- profile storage
- content ingestion
- relevance checking
- signal extraction
- insight generation
- impact analysis
- action planning
- action simulation
- execution logs

## UI Rule

Do not build this as a chat interface.

Avoid:

- chat bubbles
- assistant avatars
- message threads
- repeated business context forms
- generic summary-only cards
- unnecessary branding changes

Prefer:

- dashboard
- report cards
- workflow steps
- relevance labels
- before/after comparison
- execution timeline
- mock system state

## MVP Priority

Build in this order:

1. Saved profile setup
2. Returning-user dashboard
3. New content input using saved profile
4. Mock multi-source content feed
5. Analysis pipeline
6. Insight and impact report
7. Recommended actions
8. One working simulation
9. Before/after state
10. Execution logs
11. README documentation

## Expo Rule

This project uses Expo.

Before changing Expo-specific code, check the exact Expo SDK version used in the project and follow the matching Expo patterns already present in the codebase.