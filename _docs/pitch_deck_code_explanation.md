# Pitch Deck Code Snippets - Explanation Guide

## Overview
This document explains what each code snippet and table reference in the TradeFlow pitch deck represents, based on the actual codebase.

## Slide-by-Slide Breakdown

### Slide 2: "AI Planning in Two Taps"
**Code Reference**: `await DispatcherAgent.execute(context)`

**What it shows**: 
- The actual edge function call that triggers AI planning
- Input context includes user ID, job IDs, and date
- Output includes prioritized jobs with business reasoning
- This is the "first tap" that starts the planning process

### Slide 3: "GPT-4o Powered Route Optimization"
**Table Reference**: `routes` table

**What it shows**:
- The database structure that stores optimized routes
- Includes waypoints array with coordinates and arrival times
- Stores AI reasoning in `optimization_data` field
- Shows how we persist the route for offline access

### Slide 4: "Inventory Intelligence"
**Code Reference**: `await InventoryAgent.execute(context)`

**What it shows**:
- The second AI agent that analyzes inventory needs
- Takes dispatcher output as input (chained execution)
- Generates shopping lists and hardware store jobs
- Shows automatic insertion of store stops into the day

### Slide 5: "One UI Built for the Field"
**Table References**: `job_status`, `inventory_usage`

**What it shows**:
- `job_locations` table tracks job completion status
- `inventory_movements` table logs parts usage
- The `parts_used` JSONB field captures what was used on each job
- This enables offline-first tracking with later sync

### Slide 6: "Personalized Autonomy Sliders"
**Table Reference**: `user_preferences`

**What it shows**:
- The comprehensive preferences stored in `profiles.preferences` JSONB
- All the "autonomy sliders" like work hours, buffers, supplier preferences
- How AI agents read these to personalize behavior
- Includes map app preferences for navigation

### Slide 7: "Dynamic Replanning in the Field"
**Code Reference**: `useRealtimeSync(planId)`

**What it shows**:
- The React hook that manages daily plan state
- Real-time Supabase subscription for live updates
- How replanning works (cancel → restart with new jobs)
- Demonstrates offline-first with automatic sync

### Slide 8: "Built for Scale. Free Forever"
**Code Reference**: `git clone tradeflow`

**What it shows**:
- Complete setup process from clone to production
- Emphasizes simplicity (npm install → deploy)
- Shows both development and Docker production paths
- Demonstrates open source accessibility

### Slide 9: "Real User-Centric Innovation"
**Table References**: `user_feedback_events`, `agent_decision_contexts`

**What it shows**:
- How we capture every user modification to AI plans
- The learning loop: decision → feedback → improvement
- Actual schema that enables agent self-improvement
- Example of job reordering being logged

## Key Technical Points to Emphasize

1. **No External Dependencies**: All routing is done via GPT-4o, not VROOM/OSRM
2. **JSONB Flexibility**: Heavy use of PostgreSQL JSONB for flexible data
3. **Real-time by Default**: Supabase subscriptions enable live updates
4. **Offline-First**: All tables designed for offline operation with sync
5. **Open Source**: Every line of code is MIT licensed and available

## Visual Elements Included

1. **System Architecture Diagram**: Shows the simple 3-tier architecture
2. **Performance Metrics**: Quantifies the 2-hour daily time savings
3. **Complete Code Examples**: Not just snippets, but working code

## What Makes This Different

Unlike typical pitch decks with pseudo-code, every snippet here is:
- Pulled from the actual production codebase
- Tested and working in the live app
- Demonstrable in a real demo
- Open source and verifiable on GitHub

This authenticity reinforces that TradeFlow is not vaporware, but a production-ready solution that contractors can use today. 