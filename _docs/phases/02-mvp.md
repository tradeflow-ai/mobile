# Phase 2: MVP - The Core AI Workflow

## 🎯 Goal
To build and integrate the core, end-to-end AI-powered daily planning workflow. This phase delivers the "magic" of the application: a user can open the app, have their day planned by AI, and see the results on a map.

##  deliverables
- A functional user authentication and onboarding flow.
- A live, three-step "Plan Your Day" feature powered by a LangGraph agent crew.
- A self-hosted routing engine (VROOM/OSRM) deployed and integrated.
- A map view that visualizes the AI-generated route.

---

### Feature 1: User Authentication & Onboarding

1.  **Build Auth Screens:** Create the UI for the Sign In and Sign Up screens.
2.  **Integrate Auth Service:** Connect the UI to the `services/auth.ts` functions.
3.  **Implement Session Management:** Ensure the user's session is persisted.
4.  **Create Onboarding Flow:** Build a multi-step onboarding process to capture all initial "Autonomy Slider" preferences:
    *   Work Schedule (Days, hours, breaks).
    *   Default Time Buffers (Travel and job duration).
    *   Demand Job Response Time rules.
    *   Preferred Hardware Suppliers.
5.  **Store User Preferences:** Save all onboarding data to the appropriate tables in Supabase.

### Feature 2: Data Fetching & Management (TanStack Query)

**Architectural Rule:** TanStack Query will be the single source of truth for all **asynchronous server state** (e.g., jobs, inventory, clients). Jotai will be used exclusively for **synchronous, client-side state** (e.g., UI theme, modal visibility, or managing the state of complex, multi-step forms before submission).

1.  **Integrate TanStack Query:** Add the library and wrap the root of the app in a `QueryClientProvider`.
2.  **Create Data Hooks:** Build custom hooks for fetching data from Supabase, abstracting away the query keys and logic (e.g., `useJobs()`, `useInventory()`).
3.  **Refactor Screens for Server State:** Replace any placeholder or Jotai-managed server data with live data from the `useJobs` hook.
4.  **Implement Mutations:** Build hooks for data modification (e.g., `useUpdateJob()`, `useCreateJob()`) and integrate them.

### Feature 3: The AI Agent Crew (LangGraph & OpenAI)

1.  **Architect Communication Layer:** The state of the agentic workflow will be persisted to a `daily_plans` table in Supabase. The LangGraph agent will update this record as it transitions between states. The client will use a **Supabase real-time subscription** to listen for changes to this record and update the UI accordingly.
2.  **Define Agent Prompts & Integrate Preferences:** Define detailed prompts for all three agents. Critically, update these prompts and the agent logic to **utilize the user's preferences** (Work Schedule, Buffers, Priority Rules) captured during onboarding.
3.  **Build LangGraph Graph:** Create the state machine in LangGraph. This workflow must include a new step to create a routable **"Hardware Store Run"** job if the inventory check results in a shopping list.
4.  **Implement Dispatch Agent Node:** Write the logic for the `Dispatch Strategist`.
5.  **Implement Route Optimizer Agent Node:** Write the logic for the `Route Optimizer`, ensuring it gathers and uses advanced constraints (`time windows`, `breaks`) from user preferences and job data when calling the routing tool.
6.  **Implement Inventory Agent Node:** Write the logic for the `Inventory & Prep Specialist` using a mock/simulated API for external stock checks.

### Feature 4: The Proprietary Routing Engine (VROOM & Docker)

1.  **Build Docker Image:** Create a `Dockerfile` for the VROOM/OSRM routing engine.
2.  **Deploy to AWS Lightsail:** Deploy the container to AWS Lightsail.
3.  **Create Routing Service:** In `/services`, create `routing.ts`. This service must accept and pass advanced constraints like **`time windows`**, **`technician breaks`**, and **`vehicle capacity`** to the VROOM engine.
4.  **Integrate Engine as a Tool:** Make the `routing.ts` function available as a "tool" for the `Route Optimizer` agent.

### Feature 5: The "Plan Your Day" UI

1.  **Build Schedule Review UI:** Create the screen where the user is presented with the AI-generated job list. Implement drag-and-drop functionality using a **list-based component (e.g., `react-native-draggable-flatlist`)** for the user to reorder the list.
2.  **Handle User Approval:** When the user hits "Confirm Schedule," send the (potentially reordered) list back to the LangGraph agent to proceed to the next step.
3.  **Build Map View UI:** Create the screen to display the optimized route from the `Route Optimizer`. Use `react-native-maps` to draw the polyline and place markers for each job.
4.  **Build Inventory Checklist UI:** Create the final screen in the flow, which displays the parts manifest from the `Inventory & Prep Specialist` as a simple checklist.
5.  **Connect the Full Flow:** Tie all the UI steps together, driven by the state of the LangGraph agent via the Supabase real-time subscription.
6.  **Implement Error Handling UI:** Design and build a generic error state component for the AI planning flow. The UI must catch errors from the agent execution and display this state, providing a clear message and a "Retry" option for the user.

### Feature 6: Full Data Management (CRUD)

1.  **Build Job Management UI:** Create a dedicated screen for full CRUD operations on jobs.
2.  **Build Inventory Management UI:** Create a dedicated screen for full CRUD operations on inventory items.
3.  **Implement Image Upload:** In the Inventory Management UI, add functionality for users to upload an image for each inventory item.
4.  **Integrate Data Mutations:** Connect the new UIs to the necessary TanStack Query mutation hooks.

### Feature 7: Dynamic Replanning & In-Field Updates

1.  **Develop Change Detection Trigger:** Implement a listener that detects when a job in an active daily plan is created, updated (e.g., rescheduled), or cancelled.
2.  **Build Re-planning UI Flow:** Create the UI prompts to ask the user if they want to re-plan their day when a change is detected.
3.  **Implement Re-planning Logic:** Connect the trigger to the LangGraph agent, allowing it to re-run the dispatch and routing sequence with the updated job list while preserving the state of completed jobs.
4.  **Integrate with Map View:** Ensure the map view dynamically updates to reflect the new, re-optimized route.

### Feature 8: Basic Client Management

1.  **Create Client Management UI:** Build a simple UI to allow users to list and add new clients.
2.  **Update Job Forms:** In the 'Add/Edit Job' UI, add a feature to associate a job with a client from the user's client list.

### Feature 9: In-Field Execution UI & Logic

1.  **Build Active Job UI:** Create the primary in-field screen that shows the current job destination, details, and required parts.
2.  **Integrate Native Navigation:** Add a "Navigate" button that hands off the destination coordinates to the user's default mapping application (e.g., Apple Maps, Google Maps).
3.  **Implement Job Completion Logic:** Add functionality for the user to "Mark as Complete".
4.  **Implement Parts Usage Logging:** Upon job completion, create a UI for the user to confirm which parts were used. This action should automatically decrement the quantities in the user's inventory via a call to Supabase.

### Feature 10: Bill of Materials Management

1.  **Build Job Types UI:** Create a UI for users to define and manage the types of jobs they perform (e.g., "Leaky Faucet Repair," "HVAC Tune-up").
2.  **Implement BoM Association:** Within the Job Types UI, allow users to associate specific inventory items and their required quantities, creating a reusable Bill of Materials for each job type.
3.  **Update Seed Script:** Ensure the database seed script populates this data structure with sensible defaults that the user can later edit.

---

## Team Task Allocation
This is the most complex phase where the swimlanes become critical. The work is divided into four distinct, feature-based packages, allowing the team to build the app's core value proposition in parallel with minimal overlap.

| Package & Features | Domain | Owner | Rationale |
| :--- | :--- | :--- | :--- |
| **The AI Core & Engine** <br/> • F3: AI Agent Crew <br/> • F4: Routing Engine (Deployment) | AI & Backend | **Jeremiah** | This is a highly specialized work package. Jeremiah will own the "brain" of the app, from creating the LangGraph agents to deploying the Dockerized routing engine and architecting the real-time communication layer. |
| **The Backend Data Layer** <br/> • F2: TanStack Query <br/> • F4: Routing Engine (Client Service) <br/> • F8: Client Management <br/> • F10: BoM Management | Backend & Data | **Trevor** | This package is focused on providing the application with its data. Trevor will own the entire data access layer, including building the `routing.ts` client and all TanStack Query hooks needed for the frontend to manage jobs, clients, and bills of materials. |
| **The Core User Experience UI** <br/> • F1: Auth & Onboarding <br/> • F5: Plan Your Day UI <br/> • F9: In-Field Execution UI | Frontend & UI/UX | **Josh** | This package covers the primary, sequential user journey. Josh will own the complete "happy path" UI, from logging in and setting preferences, to stepping through the AI plan, to executing the first job of the day. He will consume the services provided by Trevor and Jeremiah. |
| **Data Management & Dynamic UI** <br/> • F6: CRUD UIs <br/> • F7: Dynamic Replanning | Frontend & UI/UX | **Jack** | This package focuses on all the "management" and "reactive" parts of the UI. Jack will own the screens for manually managing jobs and inventory, as well as the UI triggers and modals required for the dynamic re-planning flow, ensuring a robust data management experience. | 