# AI Agent Crew Testing

## 🧠 Overview
The TradeFlow AI agent crew consists of three specialized agents orchestrated by LangGraph:

1. **Dispatch Strategist** - Prioritizes and sequences jobs
2. **Route Optimizer** - Calculates optimal travel routes  
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
- **RouteOptimizerAgent**: VROOM integration and route optimization
- **InventorySpecialistAgent**: Parts analysis and shopping list generation

### Prompts (`prompts/`)
LLM prompt templates for consistent agent behavior:
- Agent personas and backstories
- Task-specific instructions
- Output format specifications

### Tools (`tools/`)
External integrations and utilities:
- VROOM routing engine client
- Mock supplier APIs
- Database query helpers

## 📊 Testing Through Mobile App

### Integration Testing
The most reliable way to test the complete agent workflow:

1. **Start the routing engine:**
   ```bash
   docker-compose up -d
   ```

2. **Start the mobile app:**
   ```bash
   npm start
   ```

3. **Navigate to Home screen and tap "Plan Your Day"**

4. **Verify agent execution:**
   - ✅ Dispatch agent completes with job prioritization
   - ✅ Route agent completes with optimized route
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
# - VROOM API: <2000ms response time
# - Agent workflow: <5000ms total time
# - All tests passing: 3/3
```

## 🛠️ Development Tips

### Agent Development Best Practices
1. **Keep prompts specific and structured**
2. **Use low LLM temperature for consistency**
3. **Validate all agent outputs**
4. **Handle errors gracefully with fallbacks**
5. **Test with diverse input scenarios**

### Testing Strategy
1. **Unit Tests:** Test individual agent logic
2. **Integration Tests:** Test agent interactions
3. **End-to-End Tests:** Test complete workflow via mobile app
4. **Performance Tests:** Benchmark response times

### Mock Data for Testing
Use consistent test data for reliable testing:
- Sample jobs with different priorities
- Test inventory with known parts
- Predictable locations for routing tests

## 📚 Additional Resources

### Related Documentation
- `_docs/frontend-handoff-josh.md` - Real-time UI integration
- `_docs/daily-plans-data-contract.md` - Database schema
- `_docs/testing-guide.md` - Comprehensive testing guide

### Debug Commands
```bash
# Check agent service status
docker-compose ps

# View VROOM logs
docker logs mobile-vroom-1

# Test VROOM directly
curl http://localhost:3000/health

# Monitor database changes
# Use Supabase dashboard real-time tab
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0 