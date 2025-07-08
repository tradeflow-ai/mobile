/**
 * TradeFlow AI Agent Crew - LangGraph State Machine
 * 
 * Phase 1 Setup: Basic LangGraph demonstration
 * This is a minimal working example to verify LangGraph integration
 */

import { StateGraph, START, END, Annotation } from "@langchain/langgraph";

/**
 * Simple state definition for Phase 1 setup
 */
export const AgentStateAnnotation = Annotation.Root({
  step: Annotation<number>,
  message: Annotation<string>,
});

/**
 * Type alias for the agent state
 */
export type AgentState = typeof AgentStateAnnotation.State;

/**
 * Simple demonstration node for Phase 1
 */
export async function stepNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log(`Executing step ${state.step}: ${state.message}`);
  
  return {
    step: state.step + 1,
    message: `Completed step ${state.step + 1}`,
  };
}

/**
 * Create and configure the LangGraph state machine
 * This is a basic demonstration for Phase 1 setup
 */
export function createAgentGraph() {
  const workflow = new StateGraph(AgentStateAnnotation)
    .addNode("demo", stepNode)
    .addEdge(START, "demo")
    .addEdge("demo", END);

  return workflow.compile();
} 