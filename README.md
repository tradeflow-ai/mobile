# TradeFlow: The AI-First OS for Tradespeople

TradeFlow is an industry-specific AI agent that brings the "Cursor experience" to independent tradespeople. It acts as an "AI Admin," intelligently automating and optimizing the complex, dynamic context of a contractor's day to maximize their revenue-generating "wrench time" and minimize administrative overhead.

## 🎯 The Problem
Independent contractors are often bogged down by non-revenue-generating activities like scheduling, routing, and inventory management. This disorganization directly reduces their earning potential. TradeFlow is a lightweight, intelligent solution that optimizes their daily workflow without the complexity of enterprise-grade software.

## ✨ Core Features
The application's intelligence is powered by a collaborative crew of specialized AI agents, orchestrated by LangGraph:

-   **The Dispatch Strategist:** Analyzes all pending jobs and prioritizes them based on urgency and user-defined rules to create the most logical and profitable job sequence for the day.
-   **The Route Optimizer:** Takes the approved job list and uses AI spatial reasoning to determine the most time and fuel-efficient travel route without external dependencies.
-   **The Inventory & Prep Specialist:** Creates a manifest of all required parts for the day's jobs, cross-references it with on-hand inventory, and generates a precise shopping list.

### Agent Architecture
The AI agents are implemented using real LangGraph and deployed as Supabase Edge Functions:
- **Edge Function**: `supabase/functions/plan-day/` - Deno-compatible LangGraph implementation
- **Agent Classes**: `supabase/functions/plan-day/agents.ts` - Real LangGraph agent implementations
- **Prompts**: `supabase/functions/plan-day/prompts/` - LLM prompt templates optimized for GPT-4o
- **Tools**: `supabase/functions/plan-day/tools/` - Coordinate formatting and supplier APIs
- **Local Development**: `agent/` - Development/testing environment (mirrors Edge Function structure)

## 🛠️ Tech Stack
Our architecture is designed to be robust, scalable, and AI-first.

- **Framework:** TypeScript, Node.js, React Native (with Expo)
- **State Management:** Jotai (UI State) & TanStack Query (Server State)
- **Backend & Database:** Supabase
- **AI Orchestration:** LangGraph with OpenAI GPT-4o
- **AI Dependencies:** `@langchain/langgraph`, `@langchain/core`, `@langchain/openai`
- **AI Agent Route Optimization:** GPT-4o spatial reasoning for intelligent route optimization
- **Deployment:** Supabase Edge Functions, EAS (Mobile App)

## 📜 Project Conventions
This is an AI-first codebase, which means it is built to be modular, scalable, and easy for both humans and AI agents to understand.

- **Documentation-Driven:** Our project's structure, rules, and development phases are thoroughly documented in the `/_docs` directory.
- **Strict Directory Structure:** We follow a strict, feature-based directory structure to ensure files are predictable and easy to locate.
- **Mandatory File & Function Commentation:** Every file must begin with a descriptive header, and every exported function must have a TSDoc block.

For a complete overview of our coding standards, UI/theme rules, and development phases, please review the documents in the `/_docs` directory.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`

### Quick Start

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/tradeflow.git
    cd tradeflow
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    -   Create a `.env` file in the root directory using `.env.example` as a template.
    -   Add your required environment variables:
        ```
        EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
        EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
        OPENAI_API_KEY=YOUR_OPENAI_API_KEY
        ```
    -   **⚠️ CRITICAL:** Configure environment variables in Supabase Edge Functions:
        - In Supabase Dashboard → Settings → Edge Functions → Environment Variables
        - Add: `OPENAI_API_KEY` = your OpenAI API key
4.  **Deploy and test Edge Functions:**
    ```bash
    # Start local Edge Functions for testing
    supabase functions serve plan-day --env-file .env.local
    
    # Test the Edge Function
    curl -X POST http://localhost:54321/functions/v1/plan-day \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      -d '{"userId": "test", "jobIds": ["job-1"], "planDate": "2024-12-21"}'
    ```
5.  **Start the mobile development server:**
    ```bash
    npm start
    ```

### Full Deployment Guide

For complete deployment with AI agent route optimization:

📖 See `_docs/phases/02-mvp.md` for detailed step-by-step instructions and deployment guidelines.

## 🧪 Testing the AI Workflow

### Quick Test
1. Start Edge Functions: `supabase functions serve plan-day --env-file .env.local`
2. Start the mobile app: `npm start`
3. Tap "Plan Your Day" in the app
4. Verify real LangGraph execution with AI route optimization:
   - ✅ Non-zero execution times (not 0ms)
   - ✅ GPT-4o spatial reasoning in route outputs
   - ✅ Database state progression: pending → dispatch_complete → route_complete → inventory_complete

### Automated Validation
Run the AI agent routing validation test suite:
```bash
# Agent routing validation test
npm run test:agent-routing

# Or run tests directly
node tests/validation-test.js
```

This will test:
- ✅ Coordinate formatting for agent spatial reasoning
- ✅ Agent route optimization quality and logic
- ✅ Spatial analysis and distance calculations
- ✅ Route efficiency and backtracking elimination
- ✅ End-to-end AI workflow functionality

### Detailed Testing
See `_docs/testing-guide.md` for comprehensive testing instructions, troubleshooting, and performance monitoring.

## 🤝 Contributing
Please see `_docs/project-rules.md` for details on our version control conventions and pull request process. We welcome contributions that adhere to our established standards.

## 📄 License
This project is licensed under the MIT License. 