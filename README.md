# CognitiveKinetic

CognitiveKinetic is a premium React Native (Expo) mobile application designed to help users track, analyze, and improve their cognitive and physical progress.

## How to Start the App

### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation
1. Navigate to the project directory:
   ```bash
   cd CognitiveKinetic
   ```
2. Install the project dependencies:
   ```bash
   npm install
   ```

### Running the App
Start the Expo development server by running:
```bash
npm start
```
*(Alternatively, you can use `npx expo start`)*

Once the server is running in your terminal, you can:
- Press **`a`** to open the app on an Android emulator (if running/installed).
- Press **`i`** to open the app on an iOS simulator (macOS only).
- Scan the **QR code** displayed in your terminal using the **Expo Go** app on your physical iOS or Android device.

---

## Features Roadmap

Based on the challenge requirements, CognitiveKinetic will evolve into an autonomous content-to-action agent system that turns unstructured information into insights, decisions, simulated actions, and visible outcomes.

### 1. Content Ingestion

- Text input for reports, news, policy updates, business data, and dashboard summaries
- PDF and document upload support
- Web article or URL-based content ingestion
- Manual sample input for demo scenarios
- Input history for previously analyzed content

### 2. Content Understanding

- Extract key facts, entities, numbers, dates, locations, and metrics
- Detect important signals such as decline, increase, risk, delay, loss, opportunity, or anomaly
- Convert unstructured content into structured JSON
- Categorize input by domain such as business, logistics, finance, public policy, or news

### 3. Insight Extraction

- Identify meaningful insights instead of simple summaries
- Detect trends, risks, opportunities, and unusual patterns
- Highlight the most important findings from the input
- Rank insights by severity, urgency, and business impact

### 4. Impact Analysis

- Explain why each insight matters
- Connect insights to real-world consequences
- Estimate possible effects such as revenue loss, cost increase, customer impact, delivery delay, or operational risk
- Show affected departments, users, regions, or systems

### 5. Action Recommendation

- Generate realistic recommended actions based on the extracted insight
- Suggest domain-relevant actions such as:
  - Launching a discount campaign
  - Updating pricing
  - Sending customer notifications
  - Creating a task for a team
  - Updating a dashboard metric
  - Triggering a mock workflow
- Explain why each action is recommended
- Rank actions by priority and expected effectiveness

### 6. Action Simulation

- Simulate execution of at least one recommended action
- Support mock actions such as:
  - Mock API call
  - Dashboard update
  - CRM or spreadsheet update
  - Email/SMS notification generation
  - Workflow trigger
  - Pricing table update
- Show whether the simulated action succeeded or failed
- Generate execution logs for every step

### 7. Before vs After State

- Display the system state before the action
- Display the updated system state after simulation
- Show changed values clearly, such as:
  - Old price vs new price
  - Previous sales state vs projected result
  - Previous delivery cost vs updated delivery cost
  - Previous risk level vs reduced risk level
- Provide a visual comparison dashboard

### 8. Agentic Workflow

- Use Google Antigravity as the core orchestration layer
- Manage agent planning, reasoning, tool calls, and action execution through Antigravity
- Show a traceable workflow from:

```text
Input → Understanding → Insight → Impact → Action → Simulation → Outcome
````

* Display agent workplan, task plan, reasoning steps, decision flow, and execution logs

### 9. Agent Trace Viewer

* Show how the agent processed the input
* Display each step of the autonomous workflow
* Include:

  * Workplan
  * Task breakdown
  * Extracted facts
  * Generated insights
  * Reasoning behind action
  * Simulated execution result
* Make the system transparent for evaluation

### 10. Outcome Visualization

* Dashboard showing final results after action simulation
* Cards for insights, impacts, recommendations, and executed actions
* Timeline view for execution logs
* Before/after comparison screen
* Final outcome summary for demo presentation

### 11. Demo Scenario Support

* Built-in sample scenarios for fast demonstration:

  * Sales decline in a region
  * Fuel price increase affecting delivery cost
  * Supply chain delay
  * Customer complaint spike
  * Policy change affecting business operations
* One-click demo flow from input to final outcome

### 12. Documentation & Export

* Export agent trace and logs for submission
* Generate structured report of:

  * Input
  * Extracted facts
  * Insights
  * Impact analysis
  * Recommended actions
  * Simulated execution
  * Final outcome
* README documentation explaining:

  * Architecture
  * Tools/APIs used
  * Antigravity usage
  * Assumptions
  * Setup instructions