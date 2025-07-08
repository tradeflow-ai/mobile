# TradeFlow User Flow

This document outlines the key user journeys within the TradeFlow application. It serves as a guide for understanding the user experience and informing UI/UX design and architectural development.

---

### Journey 1: First-Time User Onboarding

The goal of this flow is to efficiently set up a new user's account and capture the core preferences that will guide the AI agents.

1.  **Welcome & Account Creation:** The user opens the app for the first time, creates an account, and logs in.
2.  **Preferences Setup (The "Autonomy Sliders"):** The user is guided through a multi-step setup process:
    *   **Work Schedule:** The user defines their standard work week by selecting days, setting start/end times, and blocking out recurring breaks (e.g., Lunch, 12:00 PM - 1:00 PM).
    *   **Time Buffers:** The user sets default buffers to be added to AI calculations, choosing from presets (e.g., 10%, 15%) or a custom value for both drive time and on-site job duration.
    *   **Demand Job Response Time:** The user defines their service level agreement for high-priority jobs (e.g., "Respond to emergencies within 1 hour").
    *   **Preferred Suppliers:** The user selects their preferred hardware store(s) from a list (e.g., Lowe's, Grainger's) for inventory checks.
3.  **Initial Inventory Setup:**
    *   The user is prompted to set up their on-hand truck/van inventory.
    *   They can add parts and tools, specifying name and quantity. For demo purposes, this can be pre-populated with mock data.
4.  **Onboarding Complete:** The user lands on the main "Dashboard" screen, ready to use the app.

---

### Journey 2: The Core Daily Workflow (Planning the Day)

This is the primary loop the user engages in at the start of their day to plan their work.

1.  **Initiation:** From the "Dashboard", the user taps the primary action button, "Start My Day".
2.  **Step 1: Dispatch Verification:**
    *   **System Action:** The `Dispatch Strategist` agent analyzes all pending jobs and presents a prioritized list for the day. The order is: 1) Demand Jobs, 2) Hardware Store Run, 3) Maintenance Jobs, 4) Scheduled Breaks.
    *   **User Action:** The user reviews the AI-generated schedule. They can approve it as is or make modifications by dragging and dropping jobs to reorder the sequence.
    *   **Confirmation:** The user taps "Confirm Schedule" to finalize the job order.
3.  **Step 2: Route Verification:**
    *   **System Action:** The `Route Optimizer` agent takes the user-approved job list and calculates the most efficient route.
    *   **User Action:** The user is presented with a **view-only map** displaying the full day's route and all stops. They review the path for a high-level sanity check.
    *   **Confirmation:** The user taps "Confirm Route".
4.  **Step 3: Inventory Verification & Shopping List Generation:**
    *   **System Action:** The `Inventory & Prep Specialist` agent generates a checklist of all parts and tools required for the day's confirmed jobs. Items the user has in their on-hand inventory are pre-checked.
    *   **User Action:** The user reviews the checklist, unchecking any items they believe they don't need or checking items they have but the system missed.
    *   **Confirmation:** The user taps "Finalize Parts List".
5.  **Planning Complete:**
    *   **System Action:** Based on the unchecked items, a "Shopping List" is generated. The system can ping the selected hardware store's API to confirm stock availability for these items.
    *   The user is now ready to start their day and enters the "In-Field Execution" flow.

---

### Journey 3: In-Field Execution (Working the Day)

This flow describes the user's interaction with the app while actively working.

1.  **Navigation to First Job:** The app displays the route map, highlighting the first stop.
2.  **Job Details:** The user can tap the stop to view key information, such as job notes and the specific parts required for this job.
3.  **Handoff to Navigation App:** The user taps a "Navigate" button. The app opens their preferred turn-by-turn navigation app (e.g., Waze, Google Maps, Apple Maps) with the destination pre-loaded.
4.  **Job Completion:** After finishing the work, the user returns to the TradeFlow app.
5.  **Mark as Done:** The user marks the job as "Complete". They can add final notes or log parts used, which automatically updates their inventory.
6.  **Proceed to Next Job:** The system automatically highlights the next stop on the map, and the cycle repeats from step 2.

---

### Journey 4: Dynamic Replanning (Handling Emergencies)

This flow occurs when an unscheduled, high-priority job is added mid-day.

1.  **Job Creation:** A new "Demand" job is created using the "Add New Job" flow.
2.  **Re-planning Trigger:** The system recognizes a high-priority job has been added to an in-progress day and prompts the user: "An emergency job has been added. Would you like to re-plan your day?"
3.  **User Confirmation:** The user confirms they want to re-plan.
4.  **Return to Core Workflow:** The system re-initiates the "Core Daily Workflow" (Journey 2), starting from the Dispatch step. The `Dispatch Strategist` agent now includes the new emergency job, placing it at the top of the priority list while attempting to honor existing time windows.
5.  **User Verification:** The user quickly verifies the new Dispatch, Route, and Inventory plans to get back on the road.

---

### Journey 5: Ongoing Data Management

This describes how users manage their data outside of the daily planning loop.

1.  **Job Management:**
    *   **Access:** The user can access a full list of all jobs (past, present, and future) from the dashboard.
    *   **Creation:** The user can tap an "Add New Job" button. They are presented with a simple form to capture `Address`, `Client Info`, `Priority Level`, and `Notes`. The user can use natural language for details like "Schedule for tomorrow afternoon" or "Needs a new flange and wax ring". For the demo, this will be pre-populated with mock data.
2.  **Inventory Management:**
    *   **Access:** The user can navigate to a dedicated "Inventory" section from the dashboard.
    *   **CRUD Operations:** The user can view a list of all their parts and tools. They can Create new items, Read their details, Update quantities, and Delete items. For the demo, this will be pre-populated with mock data.
3.  **Settings & Preferences:**
    *   **Access:** The user can navigate to a "Settings" screen.
    *   **Update:** Here, they can modify any of the preferences that were initially set during the onboarding flow. 