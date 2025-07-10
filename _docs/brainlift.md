📋 BrainLift Outline: TradeFlow AI
Project: AI Workflow Optimizer for Independent Tradespeople

1. 🎯 Arena (a.k.a. What we're really exploring)
"Service Titan for One" → TradeFlow AI:
A mobile-first, AI-powered assistant designed specifically for independent tradespeople—those without dispatchers, back-office staff, or support tools. TradeFlow AI helps with scheduling, routing, and inventory—all on the go.

Frustration that sparked this:
Why are workflow tools like ServiceTitan only made for teams? Why can’t one person have an AI dispatcher in their pocket?

2. 📚 Curated Insights (sources that challenged our thinking)
- Andrej Karpathy – Software 3.0: Agents as OS-layer tools
- ServiceTitan (anti-pattern): Enterprise-first, not solo-first
- Real tradespeople:
  - Troy Hudson (Electrician): Field-tested friction with routing & tools
  - Chuck Lynch (HVAC): Repeats hardware store runs = lost time
  - Julie Cheng (PE investor): Identified market white space


3. 🌶 SpikyPOVs (contrarian insights we’re developing)

✅ Most people think:
AI tools are only useful for companies with scale.

❗ But actually:
AI provides the most leverage to solo tradespeople—where it becomes their dispatcher, coordinator, and inventory assistant.

✅ Most people think:
Route optimization is only valuable for fleets.

❗ But actually:
Wasted time hurts solo contractors more, because they have no one else to pick up the slack.

✅ Most people think:
Inventory tools only work with large ERPs and structured databases.

❗ But actually:
TradeFlow AI can infer tools from job notes, compare BOMs, and check API inventory to make lightweight checklists that prevent costly return trips.

4. 🧱 Knowledge Tree (things you need to understand to build TradeFlow AI)
- Wrench Time vs Windshield Time: Maximize job hours, minimize drive time
- Just-in-Time Job Injection: Emergency jobs need buffer space
- LLM Agent Roles:
  - Scheduler
  - Router
  - Inventory Assistant
- AI-Powered Route Optimization:
  - Spatial reasoning with coordinate analysis
  - Geographic optimization through AI
  - Zero external dependencies
- UX Stack:
  - React Native (Expo)
  - Big Calendar + Maps
- Inventory Strategy:
  - Job Notes → BOM → What's Missing → Check Grainger/Lowe's APIs

5. 🛠️ What We've Built in TradeFlow AI (MVP)
- Job Intake Parser: Turns natural language/text into structured tasks
- Multi-Day Calendar: With part availability logic + customizable priorities
- AI Spatial Reasoning Router: Optimizes job order & re-routes dynamically using coordinate analysis
- Inventory Prep Assistant: Generates tool checklist and to-buy list
- Map View + Job Queue: Visual interface for planning + execution

6. 📣 What We’re Publishing for Open Source Week
- GitHub Repo: Full open source code for TradeFlow AI
- Demo Video: 5-minute walkthrough of TradeFlow AI in action
- This BrainLift: Strategy + insight tracker for how we built the product
- Social Post:
  “We built TradeFlow AI: an AI-powered co-pilot for solo tradespeople—no dispatcher, no back office, just one powerful agent in your pocket.”

7. 🔁 Weekly Review (BrainLift Habit)
- What did we learn?
  - Trade pros don’t want automation—they want flexible help that listens
  - Route optimization is most valuable when things go wrong, not when they go right
- What POVs resonated?
  - “Solo > Teams” AI use case generated discussion from devs and trades
- What’s next?
  - Add voice job intake
  - Build offline mode
  - Integrate real-time Grainger API lookup

8. 🧠 Prompts We’re Using to Push TradeFlow AI
- "What’s the minimum user input needed to generate an optimized daily schedule?"
- "How might an agent handle an emergency job insertion at 2:30pm when the current plan is full?"
- "Given a job note like 'replace faucet', what inventory items should be checked or suggested for pickup?"
9. 🔧 Technical Components & Tools (Powering TradeFlow AI)
- CrewAI Docs: Agent-based architecture for role-specific LLM agents (e.g. Scheduler, Router, Inventory Assistant)
- Odoo + Vendor APIs (Grainger, Lowe’s, SerpAPI): Inventory lookup and BOM-to-shopping-list generation
