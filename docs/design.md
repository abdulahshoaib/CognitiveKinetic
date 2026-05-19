---
name: Relay
colors:
  background: '#0F1110'
  surface: '#181C18'
  surface-raised: '#222820'
  primary: '#E85D2A'
  primary-soft: '#FF9B6A'
  secondary: '#9CAF88'
  accent: '#F2C14E'
  text-primary: '#F4F1EA'
  text-secondary: '#A9AEA3'
  border: '#333A32'
  success: '#7FB069'
  warning: '#F2C14E'
  error: '#D95D5D'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  mono-code:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  mono-label:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
  headline-md-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 16px
  container-max: 1440px
---

## Brand & Style
**Cognitive Kinetic** is the entire end-to-end content-to-action pipeline (encompassing background feed ingestion, agentic parsing, impact reasoning, and transaction simulation). **Relay** is the mobile application frontend for this system.

The design system for the **Relay** mobile app is built on the principles of **Operational Clarity** and **High-Fidelity Transparency**. It targets operators who require a clear, high-performance console for real-time decision-making, steering clear of generic corporate SaaS or chatbot vibes.

The style feels warm, characterful, and clean. It utilizes deep, layered surfaces with natural, earthy dark tones, while vibrant data-driven signals ensure that key changes and alerts are always visible. The aesthetic should feel like an operational cockpit: intuitive, responsive, and premium.

## Colors
The palette is anchored in a **warm dark-mode default** ecosystem. The base is a deep charcoal (`#0F1110`), providing a high-contrast foundation for the layered surfaces (`#181C18`, `#222820`).

- **Active Process (Ember Orange):** `#E85D2A` is reserved exclusively for "active" states—this includes main actions, active agent states, and important progress moments.
- **System & Insights (Sage Green):** `#9CAF88` acts as the calm baseline for system states, insight cards, and profile-related UI.
- **Highlights (Muted Gold):** `#F2C14E` is used sparingly for highlights, warnings, and emphasis.
- **Text & Borders:** Off-white (`#F4F1EA`) and muted sage (`#A9AEA3`) text ensures readability without harsh contrast, paired with subtle borders (`#333A32`).

## Typography
This system employs a unified typographic strategy using **Inter** across all UI controls, body text, and primary insights. This creates a clean, "engineered" look that reinforces the platform's focus on professional clarity.

Hierarchy is established through careful use of weight, scale, and color. Use tighter letter spacing on display headings for a modern feel. For agent execution logs, "under the hood" traces, and metadata labels, use the smaller variants of Inter in secondary tones (like Slate-400) to signal machine-logic while maintaining a cohesive visual language.

## Layout & Spacing
The layout follows a **Tight/Efficient** philosophy to accommodate data-heavy agent environments. Use a 4px base unit for all spacing increments.

- **Grid:** A 12-column fluid grid for desktop with 16px gutters.
- **Sidebar:** A fixed technical sidebar (280px) for agent status and navigation.
- **Agent Trace Panels:** These should use condensed padding (`8px` to `12px`) to maximize the amount of log data visible on screen at once.
- **Information Density:** Prioritize horizontal space for data tables and execution timelines. Use vertical stacking only for high-level insight summaries.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Subtle Glassmorphism** rather than traditional shadows.

- **L0 (Base):** Deep Charcoal (`#0F1110`). The canvas.
- **L1 (Surfaces):** Dark Earth (`#181C18`) with a subtle 1px border (`#333A32`).
- **L2 (Overlays/Modals):** Raised Earth (`#222820`) with a backdrop-blur (12px) and 60% opacity. This creates a "glass" effect that suggests the UI is floating organically over the stream of data.
- **Active State Glow:** When an agent is "Active," elements may use a soft Ember Orange outer glow (0px 0px 15px rgba(232, 93, 42, 0.2)) to signal active processing.

## Shapes
A **Rounded** (Level 2) shape language is applied to soften the technical rigidity and improve user comfort.

- **Cards/Containers:** 12px (`rounded-xl` in this context) to create clear, friendly groupings of technical data.
- **Buttons/Inputs:** 8px (`rounded-lg`) for a precise, modern control feel.
- **Status Pills:** Fully rounded (pill) to distinguish them from interactive buttons or static containers.

## Components

### Buttons
- **Primary:** Solid Ember Orange (`#E85D2A`) with off-white text. High prominence for "Run" or "Action."
- **Secondary/Ghost:** Raised Earth (`#222820`) background with a 1px border. Used for ingestion settings.
- **Action Icons:** 32x32px hit area, utilizing minimalist line icons (2px stroke).

### Agent Logs (The "Trace")
A specialized component using a dark surface background. Each line should be timestamped and prefixed with a status icon (e.g., an ember dot for "Processing", a sage check for "Success"). Text is rendered in smaller-scale Inter to ensure high data density without feeling clinical.

### Cards & Ingestion Points
- **Ingestion Chips:** Small, 8px rounded blocks with icons for PDF, URL, or Text.
- **Insight Cards:** Use larger typography (Headline-MD) for the primary finding, leaning heavily on Sage Green (`#9CAF88`) for calm structural presence.

### Input Fields
Dark-filled inputs (`#0F1110`) with a 1px subtle border (`#333A32`). On focus, the border transitions to Ember Orange with a subtle inner glow.

### Status Indicators
- **Success:** Sage Green check or trend-up icon.
- **Risk:** Muted Gold exclamation or trend-down icon.
- **Active:** A pulsing Ember Orange ring around the agent's avatar or process icon.