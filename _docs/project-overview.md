# Project Overview: TradeFlow

## 🎯 Introduction

This project aims to build an industry-specific AI agent that brings the "Cursor experience" to independent tradespeople, such as plumbers, electricians, and other field service professionals. We are addressing a significant gap in the market, where existing workflow automation tools cater primarily to teams with back-office staff, leaving solo contractors underserved.

### The Problem: "Windshield Time" vs. "Wrench Time"

Independent contractors are often bogged down by non-revenue-generating activities ("windshield time") like scheduling, routing, and inventory management. This disorganization and administrative overhead directly reduce their revenue-generating potential ("wrench time"). They need a lightweight, intelligent solution that optimizes their daily workflow without the complexity of enterprise-grade software.

### The Solution: An AI-First Workflow Agent

TradeFlow will act as an "AI Admin for Tradespeople," applying the principles of Software 3.0 to automate and optimize the complex, dynamic context of a contractor's day. It will manage scheduling, routing, and inventory, keeping the human in the loop for verification and final decisions.

- **Manages context intelligently:** The agent will maintain a holistic understanding of the user's multi-day schedule, job priorities (`Demand` vs. `Maintenance`), real-time traffic, and parts inventory.
- **AI for generation, humans for verification:** The agent generates optimal daily plans; the tradesperson verifies, adjusts, and approves them.
- **Works in incremental chunks:** The workflow is broken into three clear, reviewable stages, handled by a specialized crew of AI agents.
- **Visual, mobile-first interface:** Designed for quick, intuitive use in the field.

## 📋 The Task

**Objective:** To build and launch an open source AI agent that optimizes the daily workflow for independent tradespeople, focusing on maximizing revenue-generating "wrench time."

**Core Concept:** TradeFlow tackles the week-at-a-glance for a tradesperson by focusing on three pillars of their daily operation: Dispatch, Routing, and Inventory.

## 📏 Guidelines & Agent Design

### Industry Application: Independent Tradespeople (Plumbers)
We are focusing on independent contractors, with the initial user persona being a self-employed plumber. This user faces constant context loss when juggling high-priority emergency calls, routine maintenance jobs, travel time, and necessary parts for each job.

### The Agent Design Framework: A Collaborative Crew

Instead of a single monolithic AI, we will implement a collaborative crew of specialized agents. This team works behind the scenes to generate the daily plan, ensuring each step is handled by an expert. This modular approach ensures higher quality results and a more scalable architecture.

1.  **Context Management:** The crew's primary strength is solving the "anterograde amnesia" of a busy day. The agents share context, allowing the system to know that Tuesday is booked with maintenance, so a new non-urgent job should be scheduled for Wednesday, or that a `Demand` job must be prioritized immediately.

2.  **Generation + Verification (The Agent Crew in Action):** The daily plan is generated through a sequential process where each agent performs a specific task and hands off its output to the next.

    *   **Agent 1: The Dispatch Strategist**
        *   **Role:** `Senior Field Service Dispatcher specializing in dynamic job prioritization for independent contractors.`
        *   **Goal:** `To analyze all pending jobs, prioritize them based on urgency (Demand vs. Maintenance) and user-defined rules, creating the most logical and profitable job sequence for the day.`
        *   **Backstory:** `A veteran dispatcher with 15 years of experience, you have an uncanny ability to instantly see the most logical order of operations, ensuring high-priority clients are served quickly without derailing pre-scheduled work.`
        *   **Task:** The strategist takes all available jobs and outputs a prioritized list of Job IDs for the day. The user then verifies and can re-order this list via a simple drag-and-drop interface.

    *   **Agent 2: The Route Optimizer**
        *   **Role:** `Logistics and Traffic Analyst with expertise in real-time, last-mile route optimization.`
        *   **Goal:** `To calculate the most time and fuel efficient travel route to connect all job locations in the sequence provided, while accounting for current traffic data and user-defined travel buffers.`
        *   **Backstory:** `An analyst who previously worked for a major delivery service, you live and breathe maps, traffic patterns, and ETAs. You are obsessed with minimizing "windshield time".`
        *   **Task:** Takes the verified job list from the Dispatcher and uses AI reasoning to determine optimal travel routes based on spatial analysis, considering advanced constraints like time windows and vehicle capacity.

    *   **Agent 3: The Inventory & Prep Specialist**
        *   **Role:** `Lead Service Technician and Inventory Manager with deep knowledge of plumbing parts and job requirements.`
        *   **Goal:** `To ensure the tradesperson is fully prepared for every job by creating a manifest of all required parts, cross-referencing it with known inventory, and generating a precise shopping list.`
        *   **Backstory:** `A meticulous 20-year master plumber who hates making a second trip to the hardware store. You have a photographic memory for every fitting needed for any job.`
        *   **Task:** Queries the TradeFlow Supabase database to get the Bill of Materials for the day's jobs and the user's current on-hand inventory. It then generates a final checklist and a shopping list. It can also query third-party hardware store APIs (e.g., Lowe's) to confirm part availability.

3.  **Incremental Processing:** The user interacts with the system in logical steps: confirm the job list generated by the *Dispatcher*, approve the route from the *Optimizer*, then check the inventory list from the *Prep Specialist*. Each step is a manageable, verifiable chunk.

4.  **Visual Interface:** The application will be mobile-first (React Native) and feature:
    *   A list-based view for the daily job schedule (Dispatch).
    *   A map view displaying the optimized route and next stops.
    *   A checklist view for the inventory and shopping list.

5.  **Partial Autonomy Controls (The "Autonomy Sliders"):** During onboarding, the user sets their core operational preferences, giving them granular control over the agent's behavior:
    *   **Work Schedule:** Define workdays, hours, and breaks (e.g., Mon-Fri, 8 AM - 5 PM, Lunch, 12 PM - 1 PM).
    *   **Buffer Time:** Set preferences for travel and job duration buffers (e.g., "Add 15% to estimated travel time").
    *   **Priority Customization:** Define rules for what constitutes a `Demand` vs. `Maintenance` job. Can preference repsonse times (e.g., "Repsond to emergency leaks within 1 hour).
    *   **Inventory & Suppliers:** Upload an initial inventory list and select a preferred hardware store for API integration.

### Technical Architecture
Our technical architecture is designed to be robust, scalable, and powerful, reflecting a polish-level vision from the start.

- **Agentic Framework:** The core logic will be orchestrated using **LangGraph**, with agents powered by **OpenAI's GPT-4o** model. This framework is specifically chosen for its first-class support for stateful, cyclical workflows and its ability to natively handle Human-in-the-Loop (HITL) verification, which is essential for our three-step approval process.

- **Backend & Routing Engine:** We use AI agent reasoning for intelligent route optimization without external dependencies. The agent leverages GPT-4o's spatial reasoning capabilities to solve Vehicle Routing Problems (VRP) through coordinate analysis. This lightweight approach provides intelligent features while eliminating infrastructure complexity, such as:
    - Honoring time windows and technician breaks.
    - Applying capacity constraints to prevent vehicle overloading.
    - Real-time rescheduling and re-optimization of unfinished routes.

- **Database & Inventory Management:** **Supabase** will serve as our unified backend and single source of truth. It will manage all user data, including jobs, client information, parts lists (Bills of Materials), and the user's on-hand truck inventory. This provides a seamless, all-in-one system for the contractor, eliminating the need for external ERP software.

- **Frontend:** The mobile application will be built with **React Native (Expo)** for cross-platform compatibility. The UI will leverage specialized libraries to visualize the complex data our agents produce:
    - **`react-native-maps`** to display the optimized routes.

- **Human-in-the-Loop Interaction Model:** The user verification steps are designed for speed and clarity:
    - **Dispatch Verification:** The user can approve the prioritized job list or modify it via a simple **drag-and-drop** interface.
    - **Route Verification:** The user is presented with a **view-only map** of the optimized route for final confirmation. They do not edit the route itself.
    - **Inventory Verification:** The user verifies the agent-generated parts list via a **checklist interface**, allowing them to check or uncheck items.

- **Third-Party APIs:** For real-time stock checks, the `Inventory & Prep Specialist` will integrate with official supplier APIs from providers like **Lowe's, Grainger, or Fastenal**.

### 🌐 Open Source Strategy
To foster a welcoming and collaborative open source community, we will prioritize:
- **Comprehensive Documentation:** A detailed `README.md` with a project description, feature list, and clear, step-by-step installation and setup instructions.
- **Contribution Guidelines:** A `contributing.md` file outlining our branching strategy, coding standards, and pull request process to make contributing straightforward.
- **Community Engagement:** We will create clear issue templates for bug reports and feature requests to streamline community feedback and contributions.
- **License:** The project will be released under an MIT license.

### Avoiding Pitfalls
- Our system is designed for **partial autonomy**; the user is always in control.
- Our system is **built on context management** as its core feature.
- We will use **visual interfaces** to make verification fast and intuitive.
- We will perfect the **core daily workflow** rather than adding extraneous features.

## 🚀 Development Process
Our development will follow the `MVP -> CORE -> POLISH` structure outlined in the project brief, with the goal of building towards our full "v3" architecture.
1.  **MVP: Research & Foundational Setup**
    *   Architect the Supabase database schema for users, jobs, parts, and inventory.
    *   Define the agentic workflow as a formal LangGraph graph structure.
    *   Set up the basic React Native (Expo) application shell and Supabase client.
    *   Build the user onboarding flow for setting preferences.
2.  **CORE: Build the Agentic Loop & Backend**
    *   Implement the `Dispatch Strategist`, `Route Optimizer`, and `Inventory & Prep Specialist` agents in LangGraph using GPT-4o.
    *   Develop AI-powered spatial reasoning for route optimization using coordinate analysis and GPT-4o intelligence.
    *   Integrate coordinate formatting tools for the `Route Optimizer` agent to enable spatial reasoning.
    *   Develop the core UI components for visualizing the outputs of each agent and handling the HITL approval steps (drag-and-drop list, view-only map, and checklist).
3.  **POLISH: Integration & Documentation**
    *   Refine the UI/UX into a polished, intuitive experience.
    *   Integrate third-party hardware store APIs for real-time inventory lookups.

    *   Finalize all user and developer documentation (`README.md`, `CONTRIBUTING.md`).

## 💡 Success Tips
- **Nail the Onboarding:** A great onboarding experience that captures user preferences is key to building trust in the agent.
- **Focus on the Core Loop:** A seamless Dispatch -> Route -> Inventory flow is our primary goal for the prototype.
- **Simulate Where Necessary:** To stay on schedule, we will simulate the hardware store API with a local JSON file initially.

**Remember:** We are building a tool to amplify a tradesperson's capability, not replace their judgment. By reducing their cognitive load, we directly increase their earning potential. 🚀 