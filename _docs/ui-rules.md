# TradeFlow: UI & Design Rules

## 🎯 Guiding Philosophy: Friendly Professional
Our design philosophy is "Friendly Professional." The application must be trustworthy, clear, and efficient for a busy tradesperson, while also feeling modern and approachable. It is a power tool, but an intelligent, easy-to-use one. Every design decision should be measured against this goal.

---

## 1. Principle: Clarity & Transparency
The user must always understand what the AI is suggesting and why. We build trust by making the system's "thinking" visible and transparent.

**How to Implement:**
-   **Explain AI Suggestions:** When the AI generates a schedule or route, provide a brief, human-readable justification (e.g., "Prioritizing 'Emergency Repair' due to 'Urgent' status").
-   **Visualize Data Clearly:** Use semantic colors and icons to add instant context. An "urgent" job should be visually distinct from a routine one.
-   **Avoid "Black Boxes":** Never perform an action or change state without explicit user confirmation.

## 2. Principle: Progressive Disclosure & Focused Workflows
Guide the user through one decision at a time. A tradesperson's cognitive load is already high; our app must reduce it, not add to it. The "Agent Crew" workflow from the project overview is our model.

**How to Implement:**
-   **One Primary Action Per Screen:** Each step in a workflow (e.g., "Plan Your Day") should have a single, unambiguous primary action (e.g., "Confirm Schedule").
-   **Sequential Task Flow:** Don't present the job list, map, and inventory checklist simultaneously. Guide the user through the sequence: 1. Approve Jobs -> 2. Confirm Route -> 3. Review Parts.
-   **Use Modals for Atomic Tasks:** Use modals for simple, self-contained actions like adding a new inventory item or viewing item details.

## 3. Principle: Layered, Card-Based Layout
The UI is built from a hierarchy of floating cards on a neutral background. This creates a clean, organized, and tactile interface that is easy to scan.

**How to Implement:**
-   **Use `<Card>` for Everything:** All primary content containers, list items, and dashboards widgets must be wrapped in our standard `<Card>` component.
-   **Establish Elevation:** Use soft, consistent drop shadows to communicate elevation. Interactive elements or primary containers should be "closer" to the user.
-   **Maintain Generous Whitespace:** Use the spacing scale defined in `theme-rules.md` for all padding and margins to ensure the layout feels uncluttered and calm.

## 4. Principle: Actionable, Obvious Controls
User interactions must be predictable and satisfying. The user is always the final decision-maker, and the controls must reflect that power and simplicity.

**How to Implement:**
-   **High-Contrast Primary Buttons:** All primary actions must use the `<Button>` component with the `primary` variant. The button title must clearly state the outcome (e.g., "Start My Day," not just "Submit").
-   **Clear Touch Targets:** All interactive elements, including list items and icons, must have a minimum touch target of 44x44dp.
-   **Provide Feedback:** Use visual feedback for all interactions (e.g., button press states, loading spinners). For data mutations, use optimistic updates via TanStack Query to make the UI feel instantaneous.

## 5. Principle: Data Visualization First
As an app that processes complex logistical data, we must present it in a way that is immediately understandable.

**How to Implement:**
-   **Maps:** Map views (`react-native-maps`) should be clean. Use semantic coloring for pins and routes. For many job locations, implement pin clustering to avoid clutter.
-   **Lists:** Lists are for scannability. Each item must be clearly delineated in a `<Card>` and show the most critical information without requiring a tap.
-   **Charts & Dashboards:** Any data visualization should be simple and highlight the key insight for the user. Avoid overly complex charts with multiple axes. 