# Team Collaboration & Project Management

To ensure effective project management and equal contribution, our team will adhere to the following process and structure.

### 🤝 Version Control & Task Management
- **Version Control:** We will use a `feature-branch` workflow. All code will be submitted through pull requests requiring at least one peer review before being rebased and merged into the `main` branch to maintain a clean history.
- **Task Management:** We will use GitHub Projects to manage our development backlog, assign clear tasks, and track progress through the development stages.

---

##  Roles & Responsibilities

This project is divided into four distinct domains, with a clear owner for each. These roles are consistent across all project phases to ensure clear accountability and minimize overlap.

| **Role** | **Team Member** | **Core Responsibilities** | **Description** |
| :--- | :--- | :--- | :--- |
| **Frontend & UX Lead** | Josh | React Native, UI/UX, Expo Router, Auth flows | The User Experience |
| **Full-Stack & Data Lead** | Trevor | TanStack Query, Supabase, API integrations, data layer | The Foundation |
| **AI & Systems Lead** | Jeremiah | Agents, LLM prompts, LangGraph, AI-powered route optimization | The Brain |

---

## Phase-by-Phase Task Allocation

The following tables outline the specific package of work owned by each lead for each phase of the project.

### Phase 1: Foundational Setup

| Task / Feature | Swimlane | Owner | Rationale & Collaboration |
| :--- | :--- | :--- | :--- |
| **Feature 1: Project & Repo Init** | Platform | **Jeremiah** | This is a foundational task that everyone else's work depends on. Jeremiah will establish the repository, directory structure, all configuration files (`package.json`, `tsconfig.json`), and the core open source documentation. |
| **Feature 2: Backend & DB Setup** | Backend & Data | **Trevor** | This is a self-contained unit of backend work. Trevor will own the entire Supabase setup, including writing the detailed schema (with BoM), creating rich seed data, and implementing the initial authentication service. His work is isolated to the backend. |
| **Feature 3: Design System Impl.** | Frontend & UI/UX | **Josh** | Josh will own the visual foundation of the app. He will translate the theme rules into the `Colors.ts` constant and build all the primitive UI components (Button, Card, etc.) in the `/components/ui` directory, working in isolation. |
| **Feature 4: Core App Shell & Nav** | Frontend & UI/UX | **Jack** | Jack will own the application's skeleton and navigation. He will build the root layouts and tab navigators in the `/app` directory, using placeholder components until Josh's UI primitives are ready, ensuring no overlap. |

### Phase 2: MVP - The Core AI Workflow

| Package & Features | Domain | Owner | Rationale |
| :--- | :--- | :--- | :--- |
| **The AI Core & Engine** <br/> • F3: AI Agent Crew <br/> • F4: Routing Engine (Deployment) | AI & Backend | **Jeremiah** | This is a highly specialized work package. Jeremiah will own the "brain" of the app, from creating the LangGraph agents to deploying the Dockerized routing engine and architecting the real-time communication layer. |
| **The Backend Data Layer** <br/> • F2: TanStack Query <br/> • F4: Routing Engine (Client Service) <br/> • F8: Client Management <br/> • F10: BoM Management | Backend & Data | **Trevor** | This package is focused on providing the application with its data. Trevor will own the entire data access layer, including building the `routing.ts` client and all TanStack Query hooks needed for the frontend to manage jobs, clients, and bills of materials. |
| **The Core User Experience UI** <br/> • F1: Auth & Onboarding <br/> • F5: Plan Your Day UI <br/> • F9: In-Field Execution UI | Frontend & UI/UX | **Josh** | This package covers the primary, sequential user journey. Josh will own the complete "happy path" UI, from logging in and setting preferences, to stepping through the AI plan, to executing the first job of the day. He will consume the services provided by Trevor and Jeremiah. |
| **Data Management & Dynamic UI** <br/> • F6: CRUD UIs <br/> • F7: Dynamic Replanning | Frontend & UI/UX | **Jack** | This package focuses on all the "management" and "reactive" parts of the UI. Jack will own the screens for manually managing jobs and inventory, as well as the UI triggers and modals required for the dynamic re-planning flow, ensuring a robust data management experience. |

### Phase 3: Polish & Advanced Features

| Feature & Core Task | Domain | Owner | Rationale |
| :--- | :--- | :--- | :--- |
| **F1: UI/UX Refinement & Polish** | Frontend & UI/UX | **Josh** | This is a pure frontend task focused on making the application *feel* great. Josh will conduct an app-wide pass to implement all micro-interactions, skeleton loaders, and haptic feedback, touching many components but in a superficial way that avoids deep logic conflicts. |
| **F2, F4, F6, F7: Frontend App & Architecture** <br/> • Settings/Autonomy Sliders <br/> • Performance & Optimization <br/> • Offline-First Sync (Client-side) <br/> • Calendar Schedule View | Frontend & UI/UX | **Jack** | This package covers all major client-side architecture and feature upgrades. Jack owns the app's performance, offline capabilities, and the most complex new UIs, solidifying his role as the Frontend Application Lead. |
| **F3, F5, F8: Advanced AI Services** <br/> • 3rd-Party API Integration <br/> • AI-Powered Job Creation <br/> • Agent Self-Improvement (Logic) | AI & Backend | **Jeremiah** | This package focuses on enhancing the app's intelligence. Jeremiah will own the creation of new AI-powered services and the implementation of the adaptive learning logic for the core agents. |
| **F6 & F8: Backend Architecture & Data Integrity** <br/> • Offline-First Sync (Backend & Conflicts) <br/> • Agent Self-Improvement (Feedback Logging) | Platform & Backend | **Trevor** | This package contains deep, architectural work critical for a production app. Trevor owns the backend data synchronization logic and the foundational data capture required for agent learning, supporting the other leads. | 
