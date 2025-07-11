# TradeFlow: The AI-First OS for Tradespeople

TradeFlow is an industry-specific AI agent that brings the "Cursor experience" to independent tradespeople. It acts as an "AI Admin," intelligently automating and optimizing the complex, dynamic context of a contractor's day to maximize their revenue-generating "wrench time" and minimize administrative overhead.

## 🎯 The Problem
Independent contractors are often bogged down by non-revenue-generating activities like scheduling, routing, and inventory management. This disorganization directly reduces their earning potential. TradeFlow is a lightweight, intelligent solution that optimizes their daily workflow without the complexity of enterprise-grade software.

## ✨ Core Features
The application's intelligence is powered by a **2-step edge function architecture** with user confirmation:

-   **The Dispatcher:** Analyzes all pending jobs and prioritizes them based on business rules (Emergency → Inspection → Service) with intelligent route optimization
-   **The Inventory Manager:** Analyzes parts requirements, creates shopping lists, and automatically generates hardware store jobs when needed

### 🔧 2-Step Edge Function Architecture
The AI system uses two separate edge functions with user confirmation between steps:

1. **Dispatcher Function** (`supabase/functions/dispatcher/`)
   - Prioritizes jobs using business rules
   - Optimizes routes with GPT-4o spatial reasoning
   - Returns prioritized job list for user confirmation

2. **Inventory Function** (`supabase/functions/inventory/`)
   - Analyzes parts requirements for confirmed jobs
   - Creates shopping lists with cost estimates
   - Generates hardware store jobs when parts are needed
   - Inserts hardware store jobs at optimal position in job sequence

### 📱 Mobile App Workflow
1. **Start Planning**: User selects jobs and initiates planning
2. **Dispatcher Results**: System shows prioritized job order
3. **User Confirmation**: User reviews and confirms job order
4. **Inventory Analysis**: System analyzes parts requirements
5. **Hardware Store Integration**: Automatically creates and inserts hardware store jobs
6. **Final Execution**: User receives optimized job list ready for execution

### 🎯 Key Features
- **Business Priority Rules**: Emergency jobs first, then inspection, then service
- **Hardware Store Job Insertion**: Automatically inserted after emergency/inspection jobs, before service jobs
- **User Confirmation**: User can review and modify job order before inventory analysis
- **Parts Analysis**: Intelligent analysis of job requirements and inventory levels
- **Shopping List Generation**: Automated creation of shopping lists with cost estimates

## 🛠️ Tech Stack
Our architecture is designed to be robust, scalable, and AI-first.

- **Framework:** TypeScript, Node.js, React Native (with Expo)
- **State Management:** Jotai (UI State) & TanStack Query (Server State)
- **Backend & Database:** Supabase
- **AI Architecture:** 2-step edge function architecture with OpenAI GPT-4o
- **AI Dependencies:** OpenAI API (direct integration)
- **AI Processing:** GPT-4o spatial reasoning for intelligent route optimization
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
    # Deploy dispatcher function
    supabase functions deploy dispatcher
    
    # Deploy inventory function  
    supabase functions deploy inventory
    
    # Test the Dispatcher Function
    curl -X POST http://localhost:54321/functions/v1/dispatcher \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      -d '{"userId": "test", "jobIds": ["job-1"], "planDate": "2024-12-21"}'
    
    # Test the Inventory Function
    curl -X POST http://localhost:54321/functions/v1/inventory \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      -d '{"userId": "test", "jobIds": ["job-1"], "dispatchOutput": {}}'
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
1. Deploy edge functions: `supabase functions deploy dispatcher && supabase functions deploy inventory`
2. Start the mobile app: `npm start`
3. Tap "Plan Your Day" in the app
4. Verify 2-step workflow execution:
   - ✅ Dispatcher prioritizes jobs with business rules
   - ✅ User confirmation screen shows prioritized jobs
   - ✅ Inventory analysis creates shopping lists and hardware store jobs
   - ✅ Database state progression: pending → dispatcher_complete → awaiting_confirmation → inventory_complete → ready_for_execution

### Automated Testing
Run the comprehensive test suite:
```bash
# Run all tests
npm run test:all

# Run edge function tests
npm run test:edge-functions

# Run mobile app workflow tests
npm run test:mobile-app

# Run integration tests
npm run test:integration

# Run Phase 9 validation tests
npm run test:phase9
```

### Test Coverage
The test suite validates:
- ✅ Dispatcher function prioritization and routing
- ✅ Inventory function parts analysis and shopping list generation
- ✅ Hardware store job creation and insertion logic
- ✅ Mobile app workflow from start to execution
- ✅ User confirmation and modification capabilities
- ✅ Error handling and edge cases
- ✅ Performance benchmarks for both edge functions

### Detailed Testing
See `test-edge-functions-integration.ts` and `test-mobile-app-workflow.ts` for comprehensive testing instructions and performance monitoring.

## 🔗 API Endpoints

### Dispatcher Function
- **Endpoint**: `/functions/v1/dispatcher`
- **Method**: POST
- **Purpose**: Prioritize jobs and optimize routes
- **Input**: `{ userId, jobIds, planDate }`
- **Output**: `{ prioritized_jobs, optimization_summary }`

### Inventory Function
- **Endpoint**: `/functions/v1/inventory`
- **Method**: POST
- **Purpose**: Analyze parts requirements and create hardware store jobs
- **Input**: `{ userId, jobIds, dispatchOutput }`
- **Output**: `{ inventory_analysis, hardware_store_job? }`

## 📊 Workflow States

The daily planning workflow uses these states:

1. `pending` - Initial state
2. `dispatcher_complete` - Dispatcher has prioritized jobs
3. `awaiting_confirmation` - Waiting for user confirmation
4. `inventory_analyzing` - Analyzing parts requirements
5. `inventory_complete` - Inventory analysis complete
6. `hardware_store_added` - Hardware store job created and inserted
7. `ready_for_execution` - Final state, ready for job execution
8. `approved` - User has approved the final plan

## 🎯 Job Priority System

### Business Priority Tiers (High to Low)
1. **Emergency Jobs**: Urgent issues requiring immediate attention
2. **Inspection Jobs**: Scheduled inspections and maintenance
3. **Hardware Store Jobs**: Parts pickup (inserted automatically)
4. **Service Jobs**: Regular service calls and repairs

### Hardware Store Job Insertion Rules
- **Standard Case**: Insert after Emergency + Inspection jobs, before Service jobs
- **Emergency Case**: If emergency job needs immediate parts, hardware store goes first
- **Cost Optimization**: Consolidate multiple parts requirements into single store visit

## 🤝 Contributing
Please see `_docs/project-rules.md` for details on our version control conventions and pull request process. We welcome contributions that adhere to our established standards.

## 📄 License
This project is licensed under the MIT License. 