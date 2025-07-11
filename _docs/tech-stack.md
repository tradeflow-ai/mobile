# TradeFlow: Technical Stack & Architectural Guide

## Overview
This document provides a comprehensive overview of the technical architecture, core technologies, and development conventions for the TradeFlow application. It serves as a single source of truth to ensure all development is consistent, scalable, and adheres to best practices.

---

## Frontend Architecture

### Core Framework: React Native (with Expo)
-   **Description:** The primary framework for building our cross-platform mobile application for iOS and Web. Expo is used to streamline the development, build, and deployment process.
-   **Best Practices:**
    -   Always use functional components with Hooks.
    -   Use `FlatList` or `FlashList` for rendering any long lists of data to ensure performance.
    -   Structure UI components to be reusable and composable.
-   **Limitations & Pitfalls:**
    -   The asynchronous nature of the React Native bridge can become a bottleneck. Avoid passing large amounts of data frequently between the JS thread and the Native thread.
    -   Ignoring platform-specific UI conventions can lead to a poor user experience.

### State Management: Jotai
-   **Description:** A lightweight, atomic state management library used for managing global and local UI state.
-   **Best Practices:**
    -   Keep atoms small and focused on a single piece of state.
    -   Use derived atoms (`atom()`, `selectAtom()`) for computed state to prevent unnecessary recalculations.
    -   For collections of similar state, use `atomFamily`.
-   **Conventions:**
    -   All global atoms must be defined in the `/store/atoms.ts` directory.
    -   **Crucially, server state (data from Supabase) should NOT be stored in Jotai atoms.** It should be managed exclusively by TanStack Query.
-   **Common Pitfalls:**
    -   Creating monolithic "god" atoms that hold too much unrelated state.
    -   Duplicating server state in Jotai, which leads to synchronization issues.

### Data Fetching & Caching: TanStack Query (React Query)
-   **Description:** Manages all asynchronous operations and server state, handling the fetching, caching, and synchronization of data from our Supabase backend.
-   **Best Practices:**
    -   Define query keys as structured arrays to ensure uniqueness and allow for easy invalidation (e.g., `['jobs', 'list', { status: 'pending' }]`).
    -   Use `useQuery` for all data fetching (GET requests) and `useMutation` for all data modification (POST, PUT, DELETE).
    -   Leverage optimistic updates for a smoother UX when creating or updating data.
-   **Conventions:**
    -   Wrap common `useQuery` and `useMutation` calls in custom hooks (e.g., `useJobs()`, `useUpdateJob()`) to encapsulate query keys and logic.
-   **Common Pitfalls:**
    -   Forgetting to invalidate relevant queries after a mutation, leading to stale data in the UI.
    -   Using TanStack Query to manage purely local UI state (that's Jotai's job).

### Forms Management: React Hook Form
-   **Description:** A performant library for managing all user input forms.
-   **Best Practices:**
    -   Use as an uncontrolled form library by default to maximize performance.
    -   Integrate with a schema validation library like `Zod` to define and enforce validation rules declaratively.
-   **Conventions:**
    -   Create a reusable, generic `<ControlledInput>` component that integrates React Hook Form's `Controller` with our standard UI components.
    -   Validation schemas should be co-located with the forms that use them.
-   **Common Pitfalls:**
    -   Overusing the `watch` function, which can trigger excessive re-renders and defeat the library's performance benefits.

### Styling
- **React Native StyleSheet:** The core API for styling components. We will use `StyleSheet.create` for optimized and co-located styles, without relying on an external styling library.

### UI & Visualization
-   **Best Practices:**
    -   Memoize complex components like maps to prevent unnecessary re-renders.
    -   For maps, avoid rendering too many markers at once. At scale, we must implement clustering.
-   **Conventions:**
    -   All map-related utility functions (e.g., coordinate calculations, polyline encoding) will be kept in `utils/mapUtils.ts`.

---

## Backend Architecture

### Database & Core Services: Supabase
-   **Description:** Our unified Backend-as-a-Service (BaaS) and single source of truth for all application data.
-   **Best Practices:**
    -   **Row Level Security (RLS) MUST be enabled on ALL tables containing user data.** There are no exceptions to this rule.
    -   For complex, multi-table operations, create database functions (RPC) to ensure data integrity and atomicity.
    -   Use Supabase's built-in connection pooling.
-   **Conventions:**
    -   All interaction with the Supabase client will be abstracted into a service layer (e.g., `/services/supabase.ts`). UI components should not call the Supabase client directly.
-   **Common Pitfalls:**
    -   Disabling RLS for "convenience" during development. This is a critical security risk.
    -   Exposing service role (`service_role`) keys on the client-side. Only the anonymous (`anon`) key should ever be present in the frontend app.

### AI Agent Route Optimization
-   **Description:** Lightweight, intelligent route optimization through AI spatial reasoning using GPT-4o without external dependencies.
-   **Architecture:** Pure Edge Function implementation leveraging AI agent reasoning for Vehicle Routing Problem (VRP) solving.
-   **Deployment:** Zero infrastructure requirements - fully Edge Function native with no external dependencies.
-   **Best Practices:**
    -   Use coordinate-based spatial analysis for distance and proximity calculations.
    -   Leverage GPT-4o's spatial reasoning capabilities for route optimization decisions.
    -   Format geographic data clearly for agent consumption (latitude/longitude pairs with clear context).
    -   Design prompts with spatial reasoning guidelines and output format specifications.
-   **Advantages:**
    -   Zero external dependencies and infrastructure overhead.
    -   Predictable performance for 3-8 job optimization scenarios typical for tradesperson use cases.
    -   Native integration with agent reasoning capabilities.
    -   Eliminates containerization complexity and resource requirements.
-   **Common Pitfalls:**
    -   Providing insufficient spatial context to the agent for optimization decisions.
    -   Expecting routing precision beyond agent spatial reasoning capabilities.

---

## AI & Agentic Layer

### Orchestration Framework: LangGraph
-   **Description:** The core framework used to build and orchestrate our multi-agent system.
-   **Best Practices:**
    -   Model the workflow as a formal state machine with clear nodes and edges.
    -   Nodes should be small and single-purpose (e.g., one node for an agent, one for a tool).
    -   The `State` object that is passed between nodes should be explicitly defined with a validation library like Pydantic.
-   **Conventions:**
    -   The definition for our core `(Dispatch -> Route -> Inventory)` graph will reside in a dedicated `agent/graph.ts` directory.
-   **Limitations:**
    -   As a newer framework, it has fewer established patterns and examples than core LangChain. Development requires careful adherence to its core principles.

### Language Model: OpenAI GPT-4o
-   **Description:** The LLM that powers the reasoning capabilities of our AI agents.
-   **Best Practices:**
    -   Use structured prompting techniques (e.g., providing examples, using XML tags to delineate sections) to get reliable, parsable output (like JSON).
    -   Set a low `temperature` (e.g., 0.1-0.2) for analytical tasks to ensure predictable outputs.
-   **Conventions:**
    -   All agent prompts (`role`, `goal`, `backstory`) will be managed as version-controlled constants.
-   **Common Pitfalls:**
    -   Writing vague, open-ended prompts that lead to inconsistent or "hallucinated" results.
    -   Assuming the LLM will always return perfectly formatted JSON. The application logic must include robust error handling and parsing validation.

---

## DevOps & Deployment

### AI Agent Deployment: Supabase Edge Functions
-   **Description:** AI agent route optimization is deployed as serverless Edge Functions with zero external infrastructure dependencies.
-   **Best Practices:**
    -   Manage all secrets (OpenAI API keys, etc.) via Supabase Environment Variables, never hardcoded.
    -   Implement proper error handling for agent reasoning failures.
    -   Use Deno-compatible imports for all LangGraph and AI dependencies.
    -   Test Edge Functions locally before deployment using `supabase functions serve`.
-   **Conventions:**
    -   Agent implementations are mirrored between local development (`agent/`) and Edge Function (`supabase/functions/plan-day/`).
    -   Coordinate formatting tools provide spatial data to agents in standardized format.
-   **Scalability Considerations:**
    -   Edge Functions scale automatically with usage without infrastructure management.
    -   Agent performance is predictable for typical tradesperson job counts (3-8 jobs).
    -   No memory or geographic coverage limitations.

### Application Deployment: Expo Application Services (EAS)
-   **Description:** EAS is used for building and deploying the React Native application.
-   **Best Practices:**
    -   Leverage EAS build profiles to manage different environments (e.g., `development`, `preview`, `production`).
    -   Store all sensitive credentials and API keys in EAS Secrets, not in the repository.

## Development Workflow & Tooling

### Version Control
- **Git & GitHub:** Used for all source code management, following the feature-branch workflow defined in `team-collaboration.md`.

### Testing
- **E2E Testing (Deferred):** The implementation of an end-to-end testing framework (such as Detox or Maestro) is currently deferred to allow for rapid initial development. This will be revisited in the "POLISH" phase of the project.

This tech stack provides a robust foundation for a scalable, maintainable job and route management application with comprehensive mapping capabilities and room for future growth and feature additions. 