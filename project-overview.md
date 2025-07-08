# Project Overview: AI Agent for Independent Tradespeople

## 🎯 Introduction

This project aims to build an industry-specific AI agent that brings the "Cursor experience" to independent tradespeople, such as plumbers, electricians, and other field service professionals. We are addressing a significant gap in the market, where existing workflow automation tools cater primarily to teams with back-office staff, leaving solo contractors underserved.

### The Problem: "Windshield Time" vs. "Wrench Time"

Independent contractors are often bogged down by non-revenue-generating activities ("windshield time") like scheduling, routing, and inventory management. This disorganization and administrative overhead directly reduce their revenue-generating potential ("wrench time"). They need a lightweight, intelligent solution that optimizes their daily workflow without the complexity of enterprise-grade software.

### The Solution: An AI-First Workflow Agent

Our agent will act as a "Cursor for Tradespeople," applying the principles of Software 3.0 to automate and optimize the complex, dynamic context of a contractor's day. It will manage scheduling, routing, and inventory, keeping the human in the loop for verification and final decisions.

- **Manages context intelligently:** The agent will maintain a holistic understanding of the user's multi-day schedule, job priorities (`Demand` vs. `Maintenance`), real-time traffic, and parts inventory.
- **AI for generation, humans for verification:** The agent generates optimal daily plans; the tradesperson verifies, adjusts, and approves them.
- **Works in incremental chunks:** The workflow is broken into three clear, reviewable stages, handled by a specialized crew of AI agents.
- **Visual, mobile-first interface:** Designed for quick, intuitive use in the field.

## 📋 The Task

**Objective:** To build and launch an open source AI agent that optimizes the daily workflow for independent tradespeople, focusing on maximizing revenue-generating "wrench time."

**Core Concept:** Our agent tackles the week-at-a-glance for a tradesperson by focusing on three pillars of their daily operation: Dispatch, Routing, and Inventory.

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
        *   **Goal:** `To calculate the most time- and fuel-efficient travel route to connect all job locations in the sequence provided, while accounting for current traffic data and user-defined travel buffers.`
        *   **Backstory:** `An analyst who previously worked for a major delivery service, you live and breathe maps, traffic patterns, and ETAs. You are obsessed with minimizing "windshield time".`
        *   **Task:** Takes the verified job list from the Dispatcher and generates the most efficient travel route.

    *   **Agent 3: The Inventory & Prep Specialist**
        *   **Role:** `Lead Service Technician and Inventory Manager with deep knowledge of plumbing parts and job requirements.`
        *   **Goal:** `To ensure the tradesperson is fully prepared for every job by creating a manifest of all required parts, cross-referencing it with known inventory, and generating a precise shopping list.`
        *   **Backstory:** `A meticulous 20-year master plumber who hates making a second trip to the hardware store. You have a photographic memory for every fitting needed for any job.`
        *   **Task:** Based on the day's jobs, the specialist generates a checklist of required parts and tools and can create a shopping list for a hardware store run. Using a hardware store API (e.g., Lowe's), it can confirm part availability, altering the schedule if a critical part is out of stock (pending user verification).

3.  **Incremental Processing:** The user interacts with the system in logical steps: confirm the job list generated by the *Dispatcher*, approve the route from the *Optimizer*, then check the inventory list from the *Prep Specialist*. Each step is a manageable, verifiable chunk.

4.  **Visual Interface:** The application will be mobile-first (React Native) and feature:
    *   A list-based view for the daily job schedule (Dispatch).
    *   A map view displaying the optimized route and next stops.
    *   A checklist view for the inventory and shopping list.

5.  **Partial Autonomy Controls (The "Autonomy Sliders"):** During onboarding, the user sets their core operational preferences, giving them granular control over the agent's behavior:
    *   **Work Schedule:** Define workdays and hours (e.g., Mon-Fri, 8 AM - 5 PM).
    *   **Buffer Time:** Set preferences for travel and job duration buffers (e.g., "Add 15% to estimated travel time").
    *   **Priority Customization:** Define rules for what constitutes a `Demand` vs. `Maintenance` job.
    *   **Inventory & Suppliers:** Upload an initial inventory list and select a preferred hardware store for API integration.

### Technical Requirements
- **Mobile-First:** Built with React Native to be accessible on the go.
- **Mapping & Routing:** Integration with a mapping service for route optimization.
- **Third-Party API:** Integration with a hardware store API (e.g., Lowe's) to check inventory.
- **Clean Architecture:** Well-documented, modular code with a clear open source license.

### 🌐 Open Source Strategy
To foster a welcoming and collaborative open source community, we will prioritize:
- **Comprehensive Documentation:** A detailed `README.md` with a project description, feature list, and clear, step-by-step installation and setup instructions.
- **Contribution Guidelines:** A `CONTRIBUTING.md` file outlining our branching strategy, coding standards, and pull request process to make contributing straightforward.
- **Community Engagement:** We will create clear issue templates for bug reports and feature requests to streamline community feedback and contributions.
- **License:** The project will be released under an MIT license.

### Avoid These Pitfalls
- Our system is designed for **partial autonomy**; the user is always in control.
- Our system is **built on context management** as its core feature.
- We will use **visual interfaces** to make verification fast and intuitive.
- We will perfect the **core daily workflow** rather than adding extraneous features.

## 🏆 Grading Criteria
*(This section aligns with the original project brief's criteria for Agent Implementation, Industry Application, Open Source Contribution, and Team Collaboration.)*

## 🚀 Development Process
Our development will follow the `MVP -> CORE -> POLISH` structure outlined in the project brief.
1.  **MVP: Research & Foundational Setup**
    *   Architect the system and define the final data models for Jobs, Users, and Inventory.
    *   Build the user onboarding flow, including the "Autonomy Slider" preference settings.
    *   Set up the basic React Native application shell and navigation.
2.  **CORE: Build the Agentic Loop**
    *   Implement the `Dispatch Strategist` agent and the job prioritization UI.
    *   Integrate mapping services for the `Route Optimizer` agent.
    *   Build the `Inventory & Prep Specialist` with a simulated hardware store API.
3.  **POLISH: Integration & Documentation**
    *   Refine the UI/UX based on the core functionality.
    *   Conduct integration testing of the end-to-end agentic workflow.
    *   Finalize all documentation, including the `README.md` and `CONTRIBUTING.md`.

## 💡 Success Tips
- **Nail the Onboarding:** A great onboarding experience that captures user preferences is key to building trust in the agent.
- **Focus on the Core Loop:** A seamless Dispatch -> Route -> Inventory flow is our primary goal for the prototype.
- **Simulate Where Necessary:** To stay on schedule, we will simulate the hardware store API with a local JSON file initially.

**Remember:** We are building a tool to amplify a tradesperson's capability, not replace their judgment. By reducing their cognitive load, we directly increase their earning potential. 🚀 