
# TradeFlow: The AI-First OS for Tradespeople

TradeFlow is an industry-specific AI agent that brings the "Cursor experience" to independent tradespeople. It acts as an "AI Admin," intelligently automating and optimizing the complex, dynamic context of a contractor's day to maximize their revenue-generating "wrench time" and minimize administrative overhead.

## 🎯 The Problem
Independent contractors are often bogged down by non-revenue-generating activities like scheduling, routing, and inventory management. This disorganization directly reduces their earning potential. TradeFlow is a lightweight, intelligent solution that optimizes their daily workflow without the complexity of enterprise-grade software.

## ✨ Core Features
The application's intelligence is powered by a collaborative crew of specialized AI agents, orchestrated by LangGraph:

-   **The Dispatch Strategist:** Analyzes all pending jobs and prioritizes them based on urgency and user-defined rules to create the most logical and profitable job sequence for the day.
-   **The Route Optimizer:** Takes the approved job list and calculates the most time and fuel-efficient travel route using a self-hosted VROOM routing engine.
-   **The Inventory & Prep Specialist:** Creates a manifest of all required parts for the day's jobs, cross-references it with on-hand inventory, and generates a precise shopping list.

## 🛠️ Tech Stack
Our architecture is designed to be robust, scalable, and AI-first.

- **Framework:** TypeScript, Node.js, React Native (with Expo)
- **State Management:** Jotai (UI State) & TanStack Query (Server State)
- **Backend & Database:** Supabase
- **AI Orchestration:** LangGraph
- **Language Model:** OpenAI GPT-4o
- **Proprietary Routing Engine:** VROOM & OSRM
- **Deployment:** Docker & AWS Lightsail (Routing Engine), EAS (Mobile App)

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
- Docker (for running the routing engine locally)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/tradeflow.git
    ```
2.  **Install dependencies:**
    ```bash
    cd tradeflow
    npm install
    ```
3.  **Set up environment variables:**
    -   Create a `.env` file in the root directory.
    -   Add your Supabase URL and Anon Key.
        ```
        EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
        EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```
4.  **Start the development server:**
    ```bash
    npm start
    ```

## 🤝 Contributing
Please see `_docs/project-rules.md` for details on our version control conventions and pull request process. We welcome contributions that adhere to our established standards.

## 📄 License
This project is licensed under the MIT License. 