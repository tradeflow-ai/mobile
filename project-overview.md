# Project Overview: AI Agent for Independent Tradespeople

## 🎯 Introduction

This project aims to build an industry-specific AI agent that brings the "Cursor experience" to independent tradespeople, such as plumbers, electricians, and other field service professionals. We are addressing a significant gap in the market, where existing workflow automation tools cater primarily to teams with back-office staff, leaving solo contractors underserved.

### The Problem: "Windshield Time" vs. "Wrench Time"

Independent contractors are often bogged down by non-revenue-generating activities ("windshield time") like scheduling, routing, and inventory management. This disorganization and administrative overhead directly reduce their revenue-generating potential ("wrench time"). They need a lightweight, intelligent solution that optimizes their daily workflow without the complexity of enterprise-grade software.

### The Solution: An AI-First Workflow Agent

Our agent will act as a "Cursor for Tradespeople," applying the principles of Software 3.0 to automate and optimize the complex, dynamic context of a contractor's day. It will manage scheduling, routing, and inventory, keeping the human in the loop for verification and final decisions.

- **Manages context intelligently:** The agent will maintain a holistic understanding of the user's multi-day schedule, job priorities (`Demand` vs. `Maintenance`), real-time traffic, and parts inventory.
- **AI for generation, humans for verification:** The agent generates optimal daily plans; the tradesperson verifies, adjusts, and approves them.
- **Works in incremental chunks:** The workflow is broken into three clear, reviewable stages: **Dispatch**, **Routing**, and **Inventory**.
- **Visual, mobile-first interface:** Designed for quick, intuitive use in the field.

## 📋 The Task

**Objective:** To build and launch an open source AI agent that optimizes the daily workflow for independent tradespeople, focusing on maximizing revenue-generating "wrench time."

**Core Concept:** Our agent tackles the week-at-a-glance for a tradesperson by focusing on three pillars of their daily operation: Dispatch, Routing, and Inventory.

## 📏 Guidelines & Agent Design

### Industry Application: Independent Tradespeople (Plumbers)
We are focusing on independent contractors, with the initial user persona being a self-employed plumber. This user faces constant context loss when juggling high-priority emergency calls, routine maintenance jobs, travel time, and necessary parts for each job.

### The Agent Design Framework

1.  **Context Management:** The agent's core strength is solving the "anterograde amnesia" of a busy day. It knows Tuesday is booked with maintenance, so a new non-urgent job is scheduled for Wednesday. It understands that a `Demand` job (e.g., a leak) must be prioritized and routed immediately.

2.  **Generation + Verification (The Three Pillars):**
    *   **Dispatch:** The AI generates a prioritized job list for the day. `Demand` jobs are placed first, followed by a potential hardware store run, and then `Maintenance` jobs. The user can verify and re-order this list via a simple drag-and-drop interface.
    *   **Routing Optimization:** The agent takes the verified job list and generates the most efficient travel route, minimizing "windshield time." It builds in buffers and can dynamically re-route if a new `Demand` job is accepted mid-day.
    *   **Inventory:** Based on the day's jobs, the agent generates a checklist of required parts and tools. It can check this list against the user's uploaded inventory and create a shopping list for the hardware store run. Using a hardware store API (e.g., Lowe's), it can confirm part availability, altering the schedule if a critical part is out of stock.

3.  **Incremental Processing:** The user interacts with the system in logical steps: confirm the job list, approve the route, then check the inventory list. Each step is a manageable, verifiable chunk.

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

### Avoid These Pitfalls
- Our system is designed for **partial autonomy**; the user is always in control.
- Our system is **built on context management** as its core feature.
- We will use **visual interfaces** to make verification fast and intuitive.
- We will perfect the **core daily workflow** rather than adding extraneous features.

## 🏆 Grading Criteria
*(This section aligns with the original project brief's criteria for Agent Implementation, Industry Application, Open Source Contribution, and Team Collaboration.)*

## 🚀 Getting Started
1.  **Architect the System:** Define the data models for Jobs, Users, and Inventory.
2.  **Build the Onboarding Flow:** Implement the "Autonomy Slider" preference settings.
3.  **Develop the Core Loop:**
    *   Implement the **Dispatch** feature with job prioritization.
    *   Integrate mapping for the **Routing** feature.
    *   Build the **Inventory** checklist and simulated API integration.

## 💡 Success Tips
- **Nail the Onboarding:** A great onboarding experience that captures user preferences is key to building trust in the agent.
- **Focus on the Core Loop:** A seamless Dispatch -> Route -> Inventory flow is our primary goal for the prototype.
- **Simulate Where Necessary:** To stay on schedule, we will simulate the hardware store API with a local JSON file initially.

**Remember:** We are building a tool to amplify a tradesperson's capability, not replace their judgment. By reducing their cognitive load, we directly increase their earning potential. 🚀 