# Phase 1: Foundational Setup & Architecture

## 🎯 Goal
To establish the project's technical foundation. This phase focuses on creating a runnable, barebones application with the core architecture, directory structure, and design system in place. The output will be a developer-ready codebase, not a user-facing product.

##  deliverables
- A new Expo (React Native) application.
- A fully defined Supabase schema and live backend.
- A complete, implemented design system based on `theme-rules.md`.
- A basic navigation structure with placeholder screens.

---

### Feature 1: Project & Repository Initialization

1.  **Initialize Expo App:** Create a new React Native project using `npx create-expo-app`.
2.  **Set up Git Repository:** Initialize a Git repository and create the `main` branch.
3.  **Establish Directory Structure:** Create the complete folder structure as defined in `_docs/project-rules.md` (`/components`, `/hooks`, `/services`, etc.).
4.  **Install Core Dependencies:** Add essential libraries like `expo-router`, `jotai`, `react-native-maps`, `supabase-js`, and `react-native-big-calendar`.
5.  **Configure TypeScript:** Set up `tsconfig.json` with strict typing rules and path aliases (`@/*`).
6.  **Create Open Source Documentation:** Create initial versions of `README.md`, `CONTRIBUTING.md`, and issue templates for bug reports and feature requests.

### Feature 2: Backend & Database Setup (Supabase)

1.  **Create Supabase Project:** Set up a new project in the Supabase dashboard.
2.  **Define Database Schema:** Write and execute SQL scripts to create the initial tables. This must include the relational schema (e.g., `job_type_parts` join tables) required to establish a **"Bill of Materials"** for different job types.
3.  **Enable Row Level Security (RLS):** Define and enable RLS policies for all tables to ensure data is only accessible by the correct user.
4.  **Implement Auth Service:** Create the initial `services/auth.ts` file to handle user sign-up, sign-in, and session management.
5.  **Seed Initial Data:** Create a seed script to populate the database with a rich and varied set of sample data, including multiple job types (`Demand`, `Maintenance`), priorities, clients, and a comprehensive Bill of Materials, to support the development and testing of the agentic crew.

### Feature 3: Design System Implementation

1.  **Implement Color Palette:** Create `constants/Colors.ts` and populate it with the full light/dark mode color palettes from `_docs/theme-rules.md`.
2.  **Create UI Primitives:** Build the initial versions of the core UI components in `/components/ui`: `<Button>`, `<Card>`, `<TextInput>`. These should be styled using the tokens from the theme rules.
3.  **Set up Global Styles:** Define the typography scale and spacing variables, making them available throughout the app.
4.  **Build a Style Guide Screen:** Create a development-only screen that displays all core components (`<Button>`, `<Card>`, etc.) and colors to visually verify the design system.

### Feature 4: Core Application Shell & Navigation

1.  **Set up Root Layout:** Create the main `app/_layout.tsx` file, configuring the global `Stack` navigator and integrating the Jotai `Provider`.
2.  **Implement Tab Navigator:** Create the `app/(tabs)/_layout.tsx` file to define the primary tab-based navigation for Dashboard, Schedule, Routes, Inventory, and Settings.
3.  **Style Navigators:** Style the tab bar and headers using the colors and fonts from the design system.
4.  **Create Placeholder Screens:** Create blank placeholder files for each tab to ensure the navigation is fully functional.
5.  **Implement Custom Header:** Build the reusable `<Header>` component and integrate it into the main screens.

---

## Team Task Allocation

This phase is about building the bedrock of the application. The goal is to work in parallel on the core pillars of the stack, with each developer taking sole ownership of a distinct domain to maximize velocity and prevent merge conflicts.

| Task / Feature | Swimlane | Owner | Rationale & Collaboration |
| :--- | :--- | :--- | :--- |
| **Feature 1: Project & Repo Init** | Platform | **Jeremiah** | This is a foundational task that everyone else's work depends on. Jeremiah will establish the repository, directory structure, all configuration files (`package.json`, `tsconfig.json`), and the core open source documentation. |
| **Feature 2: Backend & DB Setup** | Backend & Data | **Josh** | This is a self-contained unit of backend work. Josh will own the entire Supabase setup, including writing the detailed schema (with BoM), creating rich seed data, and implementing the initial authentication service. His work is isolated to the backend. |
| **Feature 3: Design System Impl.** | Frontend & UI/UX | **Jack** | Jack will own the visual foundation of the app. He will translate the theme rules into the `Colors.ts` constant and build all the primitive UI components (Button, Card, etc.) in the `/components/ui` directory, working in isolation. |
| **Feature 4: Core App Shell & Nav** | Frontend & UI/UX | **Trevor** | Trevor will own the application's skeleton and navigation. He will build the root layouts and tab navigators in the `/app` directory, using placeholder components until Jack's UI primitives are ready, ensuring no overlap. | 

This phase is about building the bedrock of the application. The goal is to work in parallel on the core pillars of the stack.
