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
2.  **Integrate Auth Service:** Connect the UI to the `services/auth.ts` functions to handle user registration and login with Supabase.
3.  **Implement Session Management:** Ensure the user's session is persisted and they remain logged in between app launches.
4.  **Create Onboarding Flow:** Build a simple, multi-step onboarding process where users can set their initial preferences (e.g., work hours, home address), as defined in `project-overview.md`.
5.  **Store User Preferences:** Save the onboarding data to the `users` table in Supabase.

### Feature 2: Data Fetching & Management (TanStack Query)

1.  **Integrate TanStack Query:** Add the library and wrap the root of the app in a `QueryClientProvider`.
2.  **Create Data Hooks:** Build custom hooks for fetching data from Supabase, abstracting away the query keys and logic (e.g., `useJobs()`, `useInventory()`).
3.  **Refactor Screens for Server State:** Replace any placeholder or Jotai-managed server data with live data from the `useJobs` hook.
4.  **Implement Mutations:** Build hooks for data modification (e.g., `useUpdateJob()`, `useCreateJob()`) and integrate them.

### Feature 3: The AI Agent Crew (LangGraph & OpenAI)

1.  **Define Agent Prompts:** In the `/agent` directory, define the detailed prompts (role, goal, backstory) for the `Dispatch Strategist` and `Inventory & Prep Specialist`.
2.  **Build LangGraph Graph:** Create the state machine in LangGraph that orchestrates the agentic workflow: (Start) -> (Dispatch) -> (User Approval 1) -> (Route) -> (User Approval 2) -> (Inventory) -> (End).
3.  **Implement Dispatch Agent Node:** Write the logic for the `Dispatch Strategist` node, which takes a list of jobs from Supabase and returns a prioritized list based on the prompt.
4.  **Implement Inventory Agent Node:** Write the logic for the `Inventory & Prep Specialist` node, which takes a job list and generates a required parts manifest.

### Feature 4: The Proprietary Routing Engine (VROOM & Docker)

1.  **Build Docker Image:** Create a `Dockerfile` for the VROOM/OSRM routing engine.
2.  **Deploy to AWS Lightsail:** Write a script or CI/CD step to deploy the container to AWS Lightsail.
3.  **Create Routing Service:** In `/services`, create `routing.ts` with a function that calls the deployed engine's API endpoint.
4.  **Integrate Engine as a Tool:** Make the `routing.ts` function available as a "tool" that the `Route Optimizer` agent in the LangGraph graph can call.

### Feature 5: The "Plan Your Day" UI

1.  **Build Schedule Review UI:** Create the screen where the user is presented with the AI-generated job list. Implement drag-and-drop functionality for the user to reorder the list.
2.  **Handle User Approval:** When the user hits "Confirm Schedule," send the (potentially reordered) list back to the LangGraph agent to proceed to the next step.
3.  **Build Map View UI:** Create the screen to display the optimized route from the `Route Optimizer`. Use `react-native-maps` to draw the polyline and place markers for each job.
4.  **Build Inventory Checklist UI:** Create the final screen in the flow, which displays the parts manifest from the `Inventory & Prep Specialist` as a simple checklist.
5.  **Connect the Full Flow:** Tie all the UI steps together, driven by the state of the LangGraph agent.

---

## Team Task Allocation
This is the most complex phase where the swimlanes become critical. The team will be building the app's core value proposition in parallel.

*   **Lead Developer(s):** Jack & Trevor (Frontend), Josh (Backend), Jeremiah (AI/Routing)
*   **Rationale:** This division isolates the most complex and specialized work (the AI engine) while the frontend and backend data layers are built out.

| Task / Feature | Swimlane | Suggested Owner(s) | Rationale & Collaboration |
| :--- | :--- | :--- | :--- |
| **Feature 1 & 5: Auth & "Plan Your Day" UI** | Frontend & UI/UX | **Jack & Trevor** | This is the largest chunk of frontend work. They can build all the necessary screens and user interactions. They could split it (e.g., Jack on Auth/Onboarding, Trevor on the multi-step AI flow) or pair-program to ensure a seamless user experience. |
| **Feature 2: Data Fetching (TanStack Query)** | Backend & Data | **Josh** | This is the natural next step for the Backend Lead. Building on his Phase 1 work, Josh can now create the data fetching and mutation hooks that the frontend team will need to bring their UI to life with real data. |
| **Feature 3 & 4: AI Agent Crew & Routing Engine** | AI & Routing | **Jeremiah** | This is the most specialized work. It requires deep focus on LangGraph, agent prompting, Docker, and cloud deployment. Assigning this entire domain to one person ensures a cohesive architecture for the app's "brain." This is the highest-risk part of the project, so this developer would focus solely on it. | 