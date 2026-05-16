# CognitiveKinetic Architecture

## Overview

CognitiveKinetic is an autonomous content-to-action agent system built with React Native (Expo SDK 54). It processes unstructured content through a multi-stage pipeline, producing insights, impact analysis, recommended actions, and simulated outcomes.

## Pipeline Flow

```
Input → Understanding → Insight → Impact → Action → Simulation → Outcome
```

## Directory Structure

```
src/
├── screens/          # One screen per pipeline stage
├── components/       # Reusable UI (common + feature-specific)
├── services/         # Business logic per pipeline stage
│   └── agent/        # Orchestrator, planner, tracer
├── hooks/            # React hooks for state management
├── utils/            # Pure utilities (formatting, validation, storage)
├── constants/        # Design tokens and enums
├── data/             # Demo scenarios (JSON)
└── navigation/       # Stack navigator config
```

## Technology Stack

- **Runtime**: Expo SDK 54 / React Native 0.81
- **Navigation**: React Navigation (Native Stack)
- **AI Orchestration**: Google Antigravity (planned)
- **State**: React hooks (local), planned context/store for pipeline state

## Agent Architecture

The agent uses a pipeline pattern:
1. **Orchestrator** (`services/agent/orchestrator.js`) — Runs the full pipeline
2. **Planner** (`services/agent/planner.js`) — Generates workplan from content
3. **Tracer** (`services/agent/tracer.js`) — Records every step for transparency

Each pipeline stage has a dedicated service file that can be developed independently.
