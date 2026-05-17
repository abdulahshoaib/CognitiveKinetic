---
name: CognitiveKinetic
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1b1b1d'
  surface-container: '#1f1f21'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e4e2e4'
  on-surface-variant: '#c6c6cd'
  inverse-surface: '#e4e2e4'
  inverse-on-surface: '#303032'
  outline: '#909097'
  outline-variant: '#45464d'
  surface-tint: '#bec6e0'
  primary: '#bec6e0'
  on-primary: '#283044'
  primary-container: '#0f172a'
  on-primary-container: '#798098'
  inverse-primary: '#565e74'
  secondary: '#b9c7e0'
  on-secondary: '#233144'
  secondary-container: '#3c4a5e'
  on-secondary-container: '#abb9d2'
  tertiary: '#dec29a'
  on-tertiary: '#3e2d11'
  tertiary-container: '#231500'
  on-tertiary-container: '#957d5a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#131315'
  on-background: '#e4e2e4'
  surface-variant: '#353436'
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
The design system for this autonomous agent platform is built on the principles of **Technical-Professionalism** and **High-Fidelity Transparency**. It targets a user base that requires absolute clarity on how an agent transitions from raw data ingestion to autonomous execution.

The style is a hybrid of **Corporate Modern** and **Technical Glassmorphism**. It utilizes deep, layered surfaces to create a sense of focused workspace, while vibrant data-driven signals ensure that the "kinetic" nature of the agent is always visible. The aesthetic should feel like a high-end command center: authoritative, stable, and incredibly precise.

## Colors
The palette is anchored in a **dark-mode default** ecosystem. The base is a deep, near-black navy (`#020617`), which provides a high-contrast foundation for the slate and navy surfaces.

- **Primary & Secondary:** Utilize deep navy and slate for structural elements to maintain a professional, grounded atmosphere.
- **Active Process:** Electric Blue (`#3B82F6`) is reserved exclusively for "active" states—this includes agent thinking, data processing, and primary action buttons.
- **Signals:** Emerald Green and Amber act as semantic indicators for success/growth and risk/delay respectively. These should be used with moderate saturation to pop against the dark backgrounds without causing visual fatigue.

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

- **L0 (Base):** Deep Navy (`#020617`). The canvas.
- **L1 (Surfaces):** Navy (`#0F172A`) with a subtle 1px border (`#1E293B`).
- **L2 (Overlays/Modals):** Slate-800 (`#1E293B`) with a backdrop-blur (12px) and 60% opacity. This creates a "glass" effect that suggests the UI is floating over the stream of data.
- **Active State Glow:** When an agent is "Active," elements may use a soft Electric Blue outer glow (0px 0px 15px rgba(59, 130, 246, 0.2)) to signal life.

## Shapes
A **Rounded** (Level 2) shape language is applied to soften the technical rigidity and improve user comfort.

- **Cards/Containers:** 12px (`rounded-xl` in this context) to create clear, friendly groupings of technical data.
- **Buttons/Inputs:** 8px (`rounded-lg`) for a precise, modern control feel.
- **Status Pills:** Fully rounded (pill) to distinguish them from interactive buttons or static containers.

## Components

### Buttons
- **Primary:** Solid Electric Blue with white text. High prominence for "Run" or "Deploy."
- **Secondary/Ghost:** Slate-800 background with a 1px border. Used for ingestion settings.
- **Action Icons:** 32x32px hit area, utilizing minimalist line icons (2px stroke).

### Agent Logs (The "Trace")
A specialized component using a dark-slate background. Each line should be timestamped and prefixed with a status icon (e.g., a blue dot for "Processing", a green check for "Success"). Text is rendered in smaller-scale Inter to ensure high data density.

### Cards & Ingestion Points
- **Ingestion Chips:** Small, 8px rounded blocks with icons for PDF, URL, or Text.
- **Insight Cards:** Use larger typography (Headline-MD) for the primary finding, with a "Confidence Score" displayed in a pill-shaped badge in the top right.

### Input Fields
Dark-filled inputs (`#020617`) with a 1px Slate border. On focus, the border transitions to Electric Blue with a subtle inner glow.

### Status Indicators
- **Success:** Emerald Green check or trend-up icon.
- **Risk:** Amber exclamation or trend-down icon.
- **Active:** A pulsing Electric Blue ring around the agent's avatar or process icon.