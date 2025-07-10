# TradeFlow: The AI-First OS for Tradespeople

TradeFlow is an industry-specific AI agent that brings the "Cursor experience" to independent tradespeople. It acts as an "AI Admin," intelligently automating and optimizing the complex, dynamic context of a contractor's day to maximize their revenue-generating "wrench time" and minimize administrative overhead.

## 🎯 The Problem
Independent contractors are often bogged down by non-revenue-generating activities like scheduling, routing, and inventory management. This disorganization directly reduces their earning potential. TradeFlow is a lightweight, intelligent solution that optimizes their daily workflow without the complexity of enterprise-grade software.

## ✨ Core Features
The application's intelligence is powered by a collaborative crew of specialized AI agents, orchestrated by LangGraph:

-   **The Dispatch Strategist:** Analyzes all pending jobs and prioritizes them based on urgency and user-defined rules to create the most logical and profitable job sequence for the day.
-   **The Route Optimizer:** Takes the approved job list and calculates the most time and fuel-efficient travel route using a self-hosted VROOM routing engine.
-   **The Inventory & Prep Specialist:** Creates a manifest of all required parts for the day's jobs, cross-references it with on-hand inventory, and generates a precise shopping list.

### Agent Architecture
The AI agents are implemented using real LangGraph and deployed as Supabase Edge Functions:
- **Edge Function**: `supabase/functions/plan-day/` - Deno-compatible LangGraph implementation
- **Agent Classes**: `supabase/functions/plan-day/agents.ts` - Real LangGraph agent implementations
- **Prompts**: `supabase/functions/plan-day/prompts/` - LLM prompt templates optimized for GPT-4o
- **Tools**: `supabase/functions/plan-day/tools/` - VROOM/OSRM routing and supplier APIs
- **Local Development**: `agent/` - Development/testing environment (mirrors Edge Function structure)

## 🛠️ Tech Stack
Our architecture is designed to be robust, scalable, and AI-first.

- **Framework:** TypeScript, Node.js, React Native (with Expo)
- **State Management:** Jotai (UI State) & TanStack Query (Server State)
- **Backend & Database:** Supabase
- **AI Orchestration:** LangGraph with OpenAI GPT-4o
- **AI Dependencies:** `@langchain/langgraph`, `@langchain/core`, `@langchain/openai`
- **Proprietary Routing Engine:** VROOM & OSRM (Docker containerized)
- **Deployment:** Docker Containerization (Routing Engine), EAS (Mobile App)

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
- Docker & Docker Compose (minimum 16GB RAM for OSRM)

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
        VROOM_API_URL=http://localhost:3000/vroom
        ```
    -   **⚠️ CRITICAL:** Configure environment variables in Supabase Edge Functions:
        - In Supabase Dashboard → Settings → Edge Functions → Environment Variables
        - Add: `OPENAI_API_KEY` = your OpenAI API key
        - Add: `VROOM_API_URL` = http://your-docker-host:3000/vroom
4.  **Phase 2 Setup (Real VROOM/OSRM):**
    ```bash
    # Set up OSRM data (one-time setup, takes 45-75 minutes)
    ./docker/osrm/setup-osrm-data.sh
    
    # Build and start routing engine with real VROOM binary
    docker-compose up --build -d
    ```
5.  **Deploy and test Edge Functions:**
    ```bash
    # Start local Edge Functions for testing
    supabase functions serve plan-day --env-file .env.local
    
    # Test the Edge Function
    curl -X POST http://localhost:54321/functions/v1/plan-day \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      -d '{"userId": "test", "jobIds": ["job-1"], "planDate": "2024-12-21"}'
    ```
6.  **Start the mobile development server:**
    ```bash
    npm start
    ```

### Full Deployment Guide

For complete Phase 2 deployment with real VROOM/OSRM integration:

📖 **[See DEPLOYMENT.md](DEPLOYMENT.md)** for detailed step-by-step instructions, troubleshooting, and production deployment guidelines.

## 🧪 Testing the AI Workflow

### Quick Test
1. Start the routing engine: `docker-compose up -d`
2. Start Edge Functions: `supabase functions serve plan-day --env-file .env.local`
3. Start the mobile app: `npm start`
4. Tap "Plan Your Day" in the app
5. Verify real LangGraph execution with:
   - ✅ Non-zero execution times (not 0ms)
   - ✅ GPT-4o reasoning in agent outputs
   - ✅ Database state progression: pending → dispatch_complete → route_complete → inventory_complete

### Automated Validation
Run the comprehensive validation test suite:
```bash
# Basic validation test
node validation-test.js

# Or comprehensive VROOM integration test
npm run test:vroom
```

This will test:
- ✅ VROOM routing engine health and performance  
- ✅ Real VROOM binary vs mock response detection
- ✅ API response times and data integrity
- ✅ Constraint handling (time windows, capacity, breaks)
- ✅ End-to-end workflow functionality

### Detailed Testing
See `_docs/testing-guide.md` for comprehensive testing instructions, troubleshooting, and performance monitoring.

## 🤝 Contributing
Please see `_docs/project-rules.md` for details on our version control conventions and pull request process. We welcome contributions that adhere to our established standards.

## 📄 License
This project is licensed under the MIT License. 