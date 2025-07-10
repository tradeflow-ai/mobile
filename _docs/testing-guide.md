# TradeFlow Testing Guide

## 🚀 Quick Validation Checklist

### Environment Setup
- [ ] Start Docker: `docker-compose up -d`
- [ ] Test VROOM: `curl http://localhost:3000/health`
- [ ] Run agent test: `cd agent && npx tsx test-graph.ts`
- [ ] Test mobile app: `npm start` → "Plan Your Day"

### Core Functionality Tests
- [ ] Verify Dispatch agent completes successfully
- [ ] Verify Route agent completes successfully  
- [ ] Verify Inventory agent completes successfully
- [ ] Verify total execution time <5 seconds

## 🧪 Detailed Testing Instructions

### 1. VROOM Routing Engine Test
```bash
# Start the routing engine
docker-compose up -d

# Test health endpoint
curl http://localhost:3000/health

# Test routing functionality
curl -X POST http://localhost:3000/vroom \
  -H "Content-Type: application/json" \
  -d '{
    "jobs": [
      {"id": 1, "location": [-122.4194, 37.7749], "service": 3600}
    ],
    "vehicles": [
      {"id": 1, "start": [-122.4194, 37.7749], "end": [-122.4194, 37.7749]}
    ]
  }'
```

**Expected Results:**
- Health endpoint returns `{"status": "healthy"}`
- Routing endpoint returns valid route data
- Response time <2 seconds

### 2. AI Agent Workflow Test
```bash
# Navigate to agent directory
cd agent

# Run complete workflow test
npx tsx test-graph.ts

# Test individual agents (if available)
npx tsx test-dispatch.ts
npx tsx test-route.ts
npx tsx test-inventory.ts
```

**Expected Results:**
- All three agents execute successfully
- Complete workflow finishes in <5 seconds
- Real-time database updates occur
- Generated outputs include job prioritization, routes, and shopping lists

### 3. Mobile App Integration Test
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
- Real-time progress updates appear in UI
- Final plan displays correctly

### 4. Database Integration Test
1. Open Supabase dashboard
2. Navigate to `daily_plans` table
3. Trigger a plan creation via mobile app
4. Verify new record appears in real-time
5. Verify status transitions: `pending` → `dispatch_complete` → `route_complete` → `inventory_complete`

**Expected Results:**
- Real-time database updates
- Proper JSON data in output fields
- Correct state transitions
- Hardware store jobs created when needed

## 📊 Performance Requirements

| Component | Requirement | Validation Method |
|-----------|-------------|-------------------|
| Complete agent workflow | <5 seconds | Time from trigger to completion |
| VROOM response time | <2 seconds | API call timing |
| Real-time UI updates | Immediate | Visual verification |
| Database operations | <1 second | Query timing |

## 🔧 Troubleshooting

### Common Issues & Solutions

**VROOM Engine Fails:**
- Check Docker container status: `docker ps`
- Restart containers: `docker-compose restart`
- Check logs: `docker-compose logs vroom`

**Agents Timeout:**
- Verify OpenAI API key in environment variables
- Check network connectivity
- Review agent logs in mobile app console

**UI Doesn't Update:**
- Verify Supabase connection
- Check real-time subscription setup
- Confirm user authentication

**Performance Issues:**
- Monitor network latency
- Check Docker resource allocation
- Review agent prompt complexity

### Debug Commands
```bash
# Check Docker status
docker ps
docker-compose logs

# Test database connection
# (Use Supabase dashboard or direct SQL queries)

# Monitor network requests
# (Use browser dev tools or React Native Flipper)

# Check mobile app logs
# (Use Expo dev tools or device console)
```

## 🎯 Success Criteria

### Core Functionality ✅
- [ ] User can trigger "Plan Your Day" workflow
- [ ] Three agents execute in sequence with real-time updates
- [ ] Generated plans respect user preferences and constraints
- [ ] VROOM routing engine provides optimized routes
- [ ] Inventory analysis generates accurate shopping lists

### Technical Requirements ✅
- [ ] Sub-5 second agent response times
- [ ] Real-time UI updates during agent execution
- [ ] Robust error handling and recovery
- [ ] Scalable architecture for multiple users
- [ ] Comprehensive logging and monitoring

### Integration Success ✅
- [ ] Seamless handoff to frontend team for UI implementation
- [ ] Clear API contracts for backend team integration
- [ ] Documented deployment process for production
- [ ] Comprehensive testing coverage

## 📝 Test Results Template

Use this template to document test results:

```markdown
## Test Execution Results - [Date]

### Performance Metrics
- Dispatch agent execution time: _____ seconds
- Route agent execution time: _____ seconds
- Inventory agent execution time: _____ seconds
- Total workflow time: _____ seconds
- VROOM response time: _____ seconds

### Functionality Tests
- [ ] ✅/❌ VROOM engine health check
- [ ] ✅/❌ Complete agent workflow
- [ ] ✅/❌ Real-time UI updates
- [ ] ✅/❌ Database state transitions
- [ ] ✅/❌ Hardware store job creation
- [ ] ✅/❌ User preferences integration

### Issues Found
- Issue 1: Description and resolution
- Issue 2: Description and resolution

### Recommendations
- Recommendation 1
- Recommendation 2
``` 