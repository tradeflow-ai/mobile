# TradeFlow: Project & Codebase Rules

## 🎯 Guiding Philosophy: An AI-First Codebase
Our goal is to build an AI-first codebase. This means every part of our project must be **modular, scalable, and easy for both humans and AI agents to understand.** The file structure should be highly navigable, and the code should be well-organized and easy to read. This discipline will accelerate development and improve maintainability.

---

## 1. Directory Structure
The project follows a strict, feature-based directory structure. Adhering to this ensures that files are predictable and easy to locate.

- `/_docs`: All project documentation (`.md` files).
- `/app`: All screens, routes, and navigation logic (powered by Expo Router).
- `/supabase`: All logic related to the edge function implementation. Specialized functions, prompts, and tool integrations live here.
- `/assets`: Static assets like fonts, icons, and images.
- `/components`: Reusable, high-level React components (e.g., `Header`, `InventoryList`). These often compose smaller `ui` components.
- `/components/ui`: Primitive, "dumb" UI building blocks (e.g., `Button`, `Card`, `TextInput`). These should be pure and highly reusable.
- `/constants`: App-wide, unchanging values. This is where our `Colors.ts` and other design tokens will be implemented.
- `/hooks`: Custom, reusable React hooks that encapsulate complex logic (e.g., `useAppNavigation`, `useJobs`).
- `/services`: Abstractions for all external services. This is where the Supabase client, Location services, and any third-party API clients are managed.
- `/store`: Global UI state management. All Jotai atoms must be defined here.
- `/utils`: Global, pure utility functions that can be used across the application (e.g., `mapUtils.ts`, date formatters).

---

## 2. File & Function Conventions
Code clarity is paramount. Every file and function must be structured to be self-documenting.

-   **File Naming:**
    -   React components must use `PascalCase` (e.g., `JobCard.tsx`).
    -   All other files (hooks, utils, services) must use `camelCase` (e.g., `useJobs.ts`, `mapUtils.ts`).
    -   File names must be descriptive and accurately represent their contents.

-   **File Headers:** **Every `.ts` and `.tsx` file MUST begin with a block comment** that explains the file's purpose and its role within the application.

-   **Function Documentation:** **Every exported function MUST have a TSDoc comment block** explaining its purpose, parameters, and return value. This is critical for AI tool compatibility.
    ```typescript
    /**
     * Calculates the most efficient route between a series of job locations.
     * @param jobs - An array of JobLocation objects to be routed.
     * @param vehicleProfile - The vehicle type to use for routing calculations.
     * @returns A promise that resolves to an optimized JobRoute object.
     */
    ```

-   **File Length:** To maintain modularity, **no file should exceed 500 lines.** If a file grows too large, it must be refactored into smaller, more focused modules.

---

## 3. Coding Conventions & Best Practices

-   **State Management:** The separation of state is critical.
    -   **Jotai (`/store`)** is used **exclusively for local UI state** (e.g., theme, modal visibility, form state).
    -   **TanStack Query** is used for **all server state**. This includes fetching, caching, and mutating any data that comes from the Supabase backend. **Do not store server data in Jotai atoms.**

-   **Data Fetching:**
    -   All interactions with the Supabase client **must** be abstracted into a custom hook or a function in the `/services` directory.
    -   UI components should **never** call `supabase.from(...)` directly. They should use a hook like `useJobs()` or a service function like `InventoryService.getItems()`.

-   **UI & Styling:**
    -   All UI development **must** adhere to the principles defined in `_docs/ui-rules.md`.
    -   All styling **must** use the design tokens (colors, spacing, typography) defined in `_docs/theme-rules.md`. **There should be no hardcoded style values in any component.**

-   **Error Handling:** All asynchronous operations (e.g., API calls, database queries) **must** be wrapped in `try/catch` blocks or use the `error` state from TanStack Query to handle potential failures gracefully.

---

## 4. Version Control

-   **Branching:** All new work must be done on a feature branch, named descriptively (e.g., `feature/add-job-creation-form`, `fix/map-rendering-bug`).
-   **Commits:** Commits should be atomic and follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification (e.g., `feat:`, `fix:`, `docs:`, `style:`, `refactor:`).
-   **Pull Requests:** Before merging to `main`, all pull requests must be reviewed by at least one other team member. 