# Phase 2: MVP - The Core AI Workflow

## 🎯 Goal
To build and integrate the core, end-to-end AI-powered daily planning workflow. This phase delivers the "magic" of the application: a user can open the app, have their day planned by AI, and see the results on a map.

##  deliverables
- A functional user authentication and onboarding flow.
- A live, two-step "Plan Your Day" feature powered by specialized edge functions.
- AI-powered spatial reasoning for route optimization using coordinate analysis.
- A map view that visualizes the AI-generated route.

---

### Feature 1: User Authentication & Onboarding (Josh)

1.  **Build Auth Screens:** Create the UI for the Sign In and Sign Up screens.
2.  **Integrate Auth Service:** Connect the UI to the `services/auth.ts` functions.
3.  **Implement Session Management:** Ensure the user's session is persisted.
4.  **Create Onboarding Flow:** Build a multi-step onboarding process to capture all initial "Autonomy Slider" preferences:
    *   Work Schedule (Days, hours, breaks).
    *   Default Time Buffers (Travel and job duration).
    *   Demand Job Response Time rules.
    *   Preferred Hardware Suppliers.
5.  **Store User Preferences:** Save all onboarding data to the appropriate tables in Supabase.

### Feature 2: Data Fetching & Management (Trevor)

**Architectural Rule:** TanStack Query will be the single source of truth for all **asynchronous server state** (e.g., jobs, inventory, clients). Jotai will be used exclusively for **synchronous, client-side state** (e.g., UI theme, modal visibility, or managing the state of complex, multi-step forms before submission).

1.  **Integrate TanStack Query:** Add the library and wrap the root of the app in a `QueryClientProvider`.
2.  **Create Data Hooks:** Build custom hooks for fetching data from Supabase, abstracting away the query keys and logic (e.g., `useJobs()`, `useInventory()`).
3.  **Refactor Screens for Server State:** Replace any placeholder or Jotai-managed server data with live data from the `useJobs` hook.
4.  **Implement Mutations:** Build hooks for data modification (e.g., `useUpdateJob()`, `useCreateJob()`) and integrate them.

### Feature 3: AI Agent Crew & Spatial Reasoning (Jeremiah)

**Objective:** Build the complete AI-powered daily planning workflow using specialized edge functions with spatial reasoning for route optimization.

1.  **Implement 2-Step Edge Function Architecture:** Build the core workflow orchestration using two specialized edge functions:
    *   **Dispatcher Function:** Job prioritization and scheduling with spatial reasoning
    *   **Inventory Function:** Parts analysis and shopping list generation with hardware store job creation

2.  **Build AI Agent Prompt System:** Create comprehensive prompt templates for each function:
    *   Dispatcher reasoning prompts with business logic and spatial optimization
    *   Inventory analysis prompts with parts knowledge and supplier integration

3.  **Implement Coordinate-Based Route Optimization:** Use AI spatial reasoning for route optimization:
    *   Simple coordinate formatting tools for agent input
    *   GPT-4o spatial reasoning for optimal route determination
    *   Zero external dependencies - pure AI-powered optimization

4.  **Build Agent-Database Integration:** Connect functions to Supabase for state persistence:
    *   Real-time workflow state tracking through daily_plans table
    *   Agent output storage and retrieval
    *   Human-in-the-loop verification support between steps

5.  **Deploy Functions as Supabase Edge Functions:** Deploy the 2-step workflow to Supabase Edge Functions for serverless execution.

### Feature 4: Agent Prompt Optimization (Continued)

1.  **Optimize Spatial Reasoning Prompts:** Fine-tune the Route Optimizer agent prompts:
    *   Enhance geographic analysis instructions
    *   Improve coordinate processing guidance
    *   Refine route efficiency algorithms in prompt form

2.  **Validate Agent Decision Quality:** Test agent reasoning outputs:
    *   Dispatch prioritization logic validation
    *   Route optimization spatial accuracy
    *   Inventory analysis completeness

3.  **Implement Agent Performance Monitoring:** Track agent execution metrics:
    *   Response time optimization
    *   Decision quality scoring
    *   Error rate monitoring

### Feature 5: The "Plan Your Day" UI (Josh)

1.  **Build Schedule Review UI:** Create the screen where the user is presented with the AI-generated job list. Implement drag-and-drop functionality using a **list-based component (e.g., `react-native-draggable-flatlist`)** for the user to reorder the list.
2.  **Handle User Approval:** When the user hits "Confirm Schedule," trigger the inventory analysis step to proceed to the next phase.
3.  **Build Map View UI:** Create the screen to display the optimized route from the `Dispatcher Function`. Use `react-native-maps` to draw the polyline and place markers for each job.
4.  **Build Inventory Checklist UI:** Create the final screen in the flow, which displays the parts manifest from the `Inventory Function` as a simple checklist.
5.  **Connect the Full Flow:** Tie all the UI steps together, driven by the state of the edge functions via the Supabase real-time subscription.
6.  **Implement Error Handling UI:** Design and build a generic error state component for the AI planning flow. The UI must catch errors from the function execution and display this state, providing a clear message and a "Retry" option for the user.

### Feature 6: Full Data Management (Jack)

1.  **Build Job Management UI:** Create a dedicated screen for full CRUD operations on jobs.
2.  **Build Inventory Management UI:** Create a dedicated screen for full CRUD operations on inventory items.
3.  **Implement Image Upload:** In the Inventory Management UI, add functionality for users to upload an image for each inventory item.
4.  **Integrate Data Mutations:** Connect the new UIs to the necessary TanStack Query mutation hooks.

### Feature 7: Dynamic Replanning & In-Field Updates (Jack)

1.  **Develop Change Detection Trigger:** Implement a listener that detects when a job in an active daily plan is created, updated (e.g., rescheduled), or cancelled.
2.  **Build Re-planning UI Flow:** Create the UI prompts to ask the user if they want to re-plan their day when a change is detected.
3.  **Implement Re-planning Logic:** Connect the trigger to the edge functions, allowing them to re-run the dispatch and inventory sequence with the updated job list while preserving the state of completed jobs.
4.  **Integrate with Map View:** Ensure the map view dynamically updates to reflect the new, re-optimized route.

### Feature 8: Client Management (Trevor)

1.  **Client CRUD Operations:** Build full client management with TanStack Query integration.
2.  **Client-Job Association:** Connect clients to jobs with proper relationship management.
3.  **Client Contact Management:** Store and manage client contact preferences and history.

### Feature 9: In-Field Execution UI (Josh)

1.  **Job Progress Tracking:** Real-time job status updates and completion tracking.
2.  **Navigation Integration:** Connect with device navigation apps for turn-by-turn directions.
3.  **Inventory Usage Tracking:** Track parts used during job completion.

### Feature 10: BoM Management (Trevor)

1.  **Job Type Templates:** Create reusable job type definitions with standard parts lists.
2.  **BoM Association:** Within the Job Types UI, allow users to associate specific inventory items and their required quantities, creating a reusable Bill of Materials for each job type.
3.  **Update Seed Script:** Ensure the database seed script populates this data structure with sensible defaults that the user can later edit.

---

## Team Task Allocation

This is the most complex phase where the swimlanes become critical. The work is divided into four distinct, feature-based packages, allowing the team to build the app's core value proposition in parallel with minimal overlap.

| Package & Features | Domain | Owner | Rationale |
| :--- | :--- | :--- | :--- |
| **The AI Core & Engine** <br/> • F3: AI Agent Crew <br/> • F4: Agent Prompt Optimization | AI & Backend | **Jeremiah** | This is a highly specialized work package. Jeremiah will own the "brain" of the app, from creating the edge function agents to implementing AI-powered spatial reasoning and architecting the real-time communication layer. |
| **The Backend Data Layer** <br/> • F2: TanStack Query <br/> • F4: Coordinate Service Integration <br/> • F8: Client Management <br/> • F10: BoM Management | Backend & Data | **Trevor** | This package is focused on providing the application with its data. Trevor will own the entire data access layer, including building the coordinate service client and all TanStack Query hooks needed for the frontend to manage jobs, clients, and bills of materials. |
| **The Core User Experience UI** <br/> • F1: Auth & Onboarding <br/> • F5: Plan Your Day UI <br/> • F9: In-Field Execution UI | Frontend & UI/UX | **Josh** | This package covers the primary, sequential user journey. Josh will own the complete "happy path" UI, from logging in and setting preferences, to stepping through the AI plan, to executing the first job of the day. He will consume the services provided by Trevor and Jeremiah. | 
