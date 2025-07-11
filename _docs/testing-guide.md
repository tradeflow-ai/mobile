# TradeFlow Testing Guide

**Complete Agent Reasoning Validation Checklist**

### Environment Setup
- [ ] Test agent workflow: `npm run test:workflow`
- [ ] Test individual agents: `npm run test:phase2`
- [ ] Run mobile app: `npm start` → "Plan Your Day"

### Core Functionality Tests
- [ ] Verify Dispatch agent completes successfully
- [ ] Verify Route agent completes successfully  
- [ ] Verify Inventory agent completes successfully
- [ ] Verify total execution time <5 seconds

## 🧪 Detailed Testing Instructions

### 1. AI Agent Workflow Test
```bash
# Test complete agent workflow
npm run test:workflow

# Test individual agent components
npm run test:phase2

# Test agent reasoning quality
npm run test:agent-routing
```

**Expected Results:**
- All three agents execute successfully
- Complete workflow finishes in <5 seconds
- Real-time database updates occur
- Generated outputs include job prioritization, routes, and shopping lists

### 2. Mobile App Integration Test
```bash
# Start the mobile app
npm start

# In Expo app:
# 1. Navigate to Home screen
# 2. Tap "Plan Your Day" button
# 3. Observe real-time agent execution
# 4. Verify UI updates during workflow
```

**Expected Results:**
- "Plan Your Day" button exists and is functional
- Agent workflow starts without errors
- Real-time updates show agent progress
- UI displays agent outputs correctly

### 3. Agent Reasoning Quality Test
Test the AI agents with sample job data to verify spatial reasoning and decision quality.

```bash
# Test with sample data
cd agent
npx tsx test-complete-workflow.ts
```

**Expected Results:**
- Dispatch agent prioritizes jobs logically
- Route agent provides efficient spatial routing
- Inventory agent generates accurate parts lists
- Agent reasoning explanations are clear and helpful

## 📊 Performance Benchmarks

| Metric | Target | Description |
|--------|--------|-------------|
| Agent response time | <2 seconds | Individual agent execution |
| Complete workflow time | <5 seconds | End-to-end planning |
| Route efficiency | Logical routing | Spatial reasoning quality |

## 🔧 Troubleshooting Agent Issues

**Agent Workflow Fails:**
- Check OpenAI API key in environment variables
- Verify Supabase connection is working
- Review agent logs in mobile app console
- Check edge function state transitions
- Review agent execution flow 
- Review prompt templates in `supabase/functions/`

**Invalid Agent Responses:**
- Review prompt templates in `supabase/functions/`
- Check LLM temperature settings (should be ~0.1)
- Verify agent output validation logic
- Test with different input scenarios

**State Transitions Fail:**
- Check edge function workflow orchestration
- Verify Supabase real-time subscriptions
- Review state validation logic
- Check for race conditions in state updates

## ✅ Testing Checklist

### Agent Quality Validation
- [ ] Agent spatial reasoning produces logical routes
- [ ] Dispatch prioritization follows business rules
- [ ] Inventory analysis is accurate and complete
- [ ] Agent explanations are clear and helpful

### Performance Validation  
- [ ] Individual agents respond in <2 seconds
- [ ] Complete workflow completes in <5 seconds
- [ ] Real-time updates work smoothly
- [ ] UI remains responsive during processing

### Integration Validation
- [ ] Mobile app integrates with agent workflow
- [ ] Database state persists correctly
- [ ] Error handling works properly
- [ ] User modifications are saved correctly

### System Validation
- [ ] Agent reasoning quality meets expectations
- [ ] Spatial calculations are accurate
- [ ] All agent outputs are well-formatted
- [ ] Workflow handles edge cases gracefully

## 📋 Test Results Template

Date: ___________
Tester: ___________

### Core Functionality
- Agent workflow execution: _____ seconds
- Dispatch reasoning: ✅/❌
- Route optimization: ✅/❌
- Inventory analysis: ✅/❌

### Performance Results
- [ ] ✅/❌ Agent workflow completes in <5 seconds
- [ ] ✅/❌ Individual agents respond in <2 seconds  
- [ ] ✅/❌ Real-time UI updates work smoothly
- [ ] ✅/❌ Spatial reasoning produces logical results

### Issues Found
1. _______________
2. _______________
3. _______________

### Overall Assessment
- [ ] ✅ Ready for production
- [ ] ⚠️ Minor issues to address
- [ ] ❌ Major issues require fixes 