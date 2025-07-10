# AI Agent Crew Testing

## 🧠 Overview
The TradeFlow AI agent crew consists of three specialized agents orchestrated by LangGraph:

1. **Dispatch Strategist** - Prioritizes and sequences jobs
2. **Route Optimizer** - Calculates optimal travel routes using AI spatial reasoning
3. **Inventory Specialist** - Generates parts lists and shopping lists

## 🧪 Testing Individual Agents

### Test Agent Components
```bash
# From the agent directory
cd agent

# Test individual agent logic (when available)
node test-dispatch.ts    # Test Dispatch Strategist
node test-route.ts       # Test Route Optimizer  
node test-inventory.ts   # Test Inventory Specialist
```

### Test Complete Workflow
```bash
# Test full LangGraph workflow
node test-graph.ts       # Test complete agent crew workflow
```

**Note:** Agent tests require TypeScript/React Native environment setup and may need to be run via the mobile app for full integration testing.

## 🔧 Agent Architecture

### Graph Definition (`graph.ts`)
The core LangGraph state machine that orchestrates all three agents:
- Manages state transitions
- Handles error recovery
- Coordinates real-time updates
- Integrates with Supabase for persistence

### Agent Implementations (`agents/`)
Individual agent classes with specialized logic:
- **DispatchStrategistAgent**: Job prioritization and scheduling
- **RouteOptimizerAgent**: AI-powered spatial reasoning for route optimization
- **InventorySpecialistAgent**: Parts analysis and shopping list generation

### Prompts (`prompts/`)
LLM prompt templates for consistent agent behavior:
- Agent personas and backstories
- Task-specific instructions
- Output format specifications

### Tools (`tools/`)
External integrations and utilities:
- Coordinate formatting tools for spatial reasoning
- Mock supplier APIs
- Database query helpers

## 📊 Testing Through Mobile App

### Integration Testing
The most reliable way to test the complete agent workflow:

1. **Start the mobile app:**
   ```bash
   npm start
   ```

2. **Navigate to Home screen and tap "Plan Your Day"**

3. **Verify agent execution:**
   - ✅ Dispatch agent completes with job prioritization
   - ✅ Route agent completes with optimized route using AI spatial reasoning
   - ✅ Inventory agent completes with shopping list
   - ✅ Real-time UI updates show progress

### Expected Workflow States
```
pending → dispatch_complete → route_complete → inventory_complete → approved
```

## 🔍 Debugging Agent Issues

### Common Problems & Solutions

#### Agent Timeout
**Issue:** Agents don't complete within 5 seconds
**Debug:**
1. Check OpenAI API key in environment variables
2. Verify network connectivity to OpenAI
3. Check Supabase connection for state persistence
4. Review agent logs in mobile app console

#### Invalid Agent Responses
**Issue:** Agents return malformed or unexpected data
**Debug:**
1. Review prompt templates in `prompts/`
2. Check LLM temperature settings (should be low ~0.1-0.2)
3. Verify agent output validation logic
4. Test with different input scenarios

#### State Transitions Fail
**Issue:** Workflow gets stuck between states
**Debug:**
1. Check LangGraph state machine definition
2. Verify Supabase real-time subscriptions
3. Review state validation logic
4. Check for race conditions in state updates

### Agent Performance Monitoring

#### Key Metrics
- **Individual Agent Response Time:** <2 seconds per agent
- **Complete Workflow Time:** <5 seconds total
- **Agent Success Rate:** >99% completion rate
- **State Transition Reliability:** No lost state updates

#### Performance Testing
```bash
# Run validation tests to benchmark performance
node ../validation-test.js

# Expected results:
# - Agent workflow: <5000ms total time
# - All tests passing: 3/3
```

## 🛠️ Development Tips

### Agent Development Best Practices
1. **Keep prompts specific and structured**
2. **Use low LLM temperature for consistency**
3. **Test with various input scenarios**
4. **Monitor token usage and costs**
5. **Implement proper error handling**

### Debugging Workflow Issues
1. **Check agent logs in mobile app console**
2. **Verify real-time state updates in Supabase dashboard**
3. **Test individual agents before full workflow**
4. **Monitor network requests and API responses**

### Agent Reasoning Quality
1. **Spatial reasoning for route optimization**
2. **Business logic for job prioritization**
3. **Inventory analysis accuracy**
4. **Clear explanation of decisions**

## 🚀 Deployment

### Supabase Edge Functions
The agents are deployed as serverless functions:
- Zero infrastructure management
- Automatic scaling
- Real-time database integration
- Cost-effective execution

### Environment Variables
Required for agent execution:
- `OPENAI_API_KEY`: OpenAI API access
- `SUPABASE_URL`: Database connection
- `SUPABASE_ANON_KEY`: Database authentication

## 📈 Performance Optimization

### Response Time Targets
- **Individual Agent:** <2 seconds
- **Complete Workflow:** <5 seconds
- **Real-time Updates:** <1 second

### Cost Optimization
- Efficient prompt design
- Appropriate model selection (GPT-4o)
- Smart caching where applicable
- Minimal token usage

## 🔬 Testing Strategy

### Unit Testing
- Individual agent logic
- Prompt template validation
- Output format verification

### Integration Testing
- End-to-end workflow testing
- Real-time state updates
- Error handling scenarios

### Performance Testing
- Response time benchmarks
- Load testing for multiple users
- Memory and resource usage

This architecture provides a robust, scalable AI agent system that delivers intelligent daily planning without external infrastructure dependencies. 