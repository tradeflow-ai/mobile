# MVP Testing Checklist - Verify Yesterday's Implementation

## 🎯 Testing Strategy

Based on your completed work, we need to test **5 major systems** that unblock your teammates:

1. **✅ RLS Policies & Auth** (Josh dependency)
2. **🔍 TanStack Query Data Layer** (Everyone dependency) 
3. **👥 Client Management** (MVP core feature)
4. **📋 Bill of Materials (BoM)** (MVP core feature)
5. **🗺️ Routing Engine Service** (Jeremiah dependency)

---

## 📱 **TESTING SECTION 1: RLS & Profile Management (Josh Dependency)**

### Test 1.1: Profile Creation During Signup ✅ ALREADY TESTED
**Status:** ✅ PASSED - We just verified this works!

### Test 1.2: Profile Updates
**What we're testing:** Authenticated profile updates

```bash
# Test Steps:
1. Go to Profile tab
2. Tap edit icon (pencil)
3. Change first name to "Updated"
4. Save changes
```

**✅ Expected Results:**
- Profile updates successfully
- Name changes to "Updated User"
- No errors in console

---

## 🔍 **TESTING SECTION 2: TanStack Query Integration (Everyone Dependency)**

### Test 2.1: Query Client Setup Verification
**What we're testing:** Base TanStack Query configuration

```bash
# In app - check console logs:
1. Open app and watch console
2. Look for TanStack Query initialization
3. Navigate between tabs to trigger data fetching
```

**✅ Expected Results:**
- No "QueryClient not found" errors
- Data hooks executing without errors
- Loading states work properly

### Test 2.2: Core Data Hooks (Console Testing)
**What we're testing:** All the hooks Josh/Jack need

```javascript
// Test in browser console or add to a component temporarily:

// Profile hooks test
const profile = useProfile();
console.log('Profile hook:', profile);

// Inventory hooks test  
const inventory = useInventory();
console.log('Inventory hook:', inventory);

// Jobs hooks test
const jobs = useJobs();
console.log('Jobs hook:', jobs);
```

**✅ Expected Results:**
- All hooks return proper objects with data, loading, error states
- No "hook not found" or import errors
- Data fetching attempts visible (even if empty results)

---

## 👥 **TESTING SECTION 3: Client Management System (MVP Core)**

### Test 3.1: Client Data Hooks Testing
**What we're testing:** Client management hooks for MVP

```javascript
// Test client hooks in console:
import { useClients, useCreateClient } from '@/hooks/useClients';

// Test fetching clients
const clients = useClients();
console.log('Clients:', clients);

// Test creating client (mock data)
const createClient = useCreateClient();
```

### Test 3.2: Client Database Schema
**What we're testing:** Client table exists with proper structure

```sql
-- Run in Supabase SQL Editor:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;
```

**✅ Expected Results:**
- Table exists with all required columns
- RLS policies applied correctly
- Foreign key to profiles table works

### Test 3.3: Client-Job Relationship
**What we're testing:** Jobs can be associated with clients

```sql
-- Check if client_id column exists in job_locations:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'job_locations' AND column_name = 'client_id';
```

---

## 📋 **TESTING SECTION 4: Bill of Materials (BoM) System (MVP Core)**

### Test 4.1: BoM Tables Schema Verification
**What we're testing:** BoM tables exist with proper structure

```sql
-- Run in Supabase SQL Editor:
-- Check job_types table
SELECT 'job_types' as table_name, COUNT(*) as exists 
FROM information_schema.tables 
WHERE table_name = 'job_types'
UNION ALL
-- Check part_templates table  
SELECT 'part_templates' as table_name, COUNT(*) as exists
FROM information_schema.tables
WHERE table_name = 'part_templates'
UNION ALL
-- Check job_type_parts table
SELECT 'job_type_parts' as table_name, COUNT(*) as exists
FROM information_schema.tables
WHERE table_name = 'job_type_parts';
```

**✅ Expected Results:**
- All three tables return exists = 1
- Tables have proper columns and relationships

### Test 4.2: BoM Data Hooks Testing
**What we're testing:** BoM hooks work correctly

```javascript
// Test BoM hooks in app:
import { useJobTypes, usePartTemplates, useJobTypeParts } from '@/hooks/useBom';

const jobTypes = useJobTypes();
console.log('Job Types:', jobTypes);

const partTemplates = usePartTemplates();
console.log('Part Templates:', partTemplates);
```

### Test 4.3: Sample BoM Data Verification
**What we're testing:** Sample data was loaded correctly

```sql
-- Check sample job types exist:
SELECT name, category, estimated_duration FROM job_types LIMIT 5;

-- Check sample part templates exist:
SELECT name, category, estimated_cost FROM part_templates LIMIT 5;

-- Check BoM associations exist:
SELECT COUNT(*) as associations FROM job_type_parts;
```

**✅ Expected Results:**
- Sample job types exist (HVAC, Plumbing, Electrical, etc.)
- Sample part templates exist with realistic data
- BoM associations link job types to required parts

---

## 🗺️ **TESTING SECTION 5: Routing Engine Service (Jeremiah Dependency)**

### Test 5.1: Routing Service Health Check
**What we're testing:** Routing service is accessible and functional

```javascript
// Test routing service in app console:
import { routingService } from '@/services/routing';

// Test health check
const health = await routingService.healthCheck();
console.log('Routing service health:', health);
```

**✅ Expected Results:**
- Returns `{ status: 'healthy', message: 'Mock routing service active' }`
- No import or instantiation errors

### Test 5.2: Route Optimization Mock Test
**What we're testing:** Route optimization works with mock data

```javascript
// Test route optimization with sample data:
const sampleJobs = [
  {
    id: '1',
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Main St',
    job_type: 'maintenance',
    estimated_duration: 60
  },
  {
    id: '2', 
    latitude: 40.7580,
    longitude: -73.9855,
    address: '456 Oak Ave',
    job_type: 'service',
    estimated_duration: 90
  }
];

const samplePreferences = {
  home_location: { latitude: 40.7500, longitude: -73.9850 },
  work_schedule: { start_time: '08:00', end_time: '17:00' },
  vehicle_capacity: { max_items: 50 }
};

const result = await routingService.optimizeRoute(sampleJobs, samplePreferences);
console.log('Optimized route:', result);
```

**✅ Expected Results:**
- Returns optimized route object with stops, timing, distance
- Mock data shows realistic route optimization
- No API call errors (uses mock in development)

### Test 5.3: AI Agent Interface Test
**What we're testing:** Simple interface for Jeremiah's AI agents

```javascript
// Test AI agent interface:
const agentResult = await routingService.optimizeRouteForAgent(sampleJobs, samplePreferences);
console.log('Agent optimized route:', agentResult);
```

**✅ Expected Results:**
- Returns same structure as main optimization
- Includes geometry for map display
- Simple interface suitable for AI consumption

---

## 🧪 **TESTING SECTION 6: Integration Tests**

### Test 6.1: Data Flow Integration
**What we're testing:** Complete data flow from hooks to UI

```bash
# In app:
1. Navigate to each tab (Home, Inventory, Schedule, Map)
2. Check console for data loading
3. Verify no hook errors or failed queries
4. Test any CRUD operations available in UI
```

### Test 6.2: Database Integrity Check
**What we're testing:** All tables and relationships work

```sql
-- Run comprehensive integrity check:
SELECT 
  t.table_name,
  p.policyname as rls_policy,
  c.constraint_name as foreign_key
FROM information_schema.tables t
LEFT JOIN pg_policies p ON p.tablename = t.table_name
LEFT JOIN information_schema.table_constraints c 
  ON c.table_name = t.table_name AND c.constraint_type = 'FOREIGN KEY'
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('profiles', 'clients', 'job_locations', 'inventory_items', 'routes', 'job_types', 'part_templates', 'job_type_parts', 'daily_plans')
ORDER BY t.table_name;
```

**✅ Expected Results:**
- All MVP tables exist
- RLS policies applied to each table
- Foreign key relationships properly defined

---

## 📋 **QUICK VERIFICATION CHECKLIST**

### Josh (Auth & Onboarding) Dependencies:
- [ ] **Profile creation during signup works** ✅ VERIFIED
- [ ] **Profile update hooks available** (useProfile, useUpdateProfile)
- [ ] **No RLS errors** ✅ VERIFIED
- [ ] **Profile data displays correctly in app** ✅ VERIFIED

### Jack (CRUD UIs) Dependencies:
- [ ] **Inventory hooks working** (useInventory, useCreateInventoryItem, etc.)
- [ ] **Job management hooks working** (useJobs, useCreateJob, etc.)  
- [ ] **Client management hooks working** (useClients, useCreateClient, etc.)
- [ ] **All mutation hooks have proper error handling**

### Jeremiah (AI Agent Crew) Dependencies:
- [ ] **Routing service accessible** (routingService.getInstance())
- [ ] **Route optimization works** (mock responses in development)
- [ ] **AI agent interface available** (optimizeRouteForAgent method)
- [ ] **Health check works** (returns healthy status)

### MVP Core Features:
- [ ] **Client management system complete** (tables, hooks, relationships)
- [ ] **BoM system complete** (job types, part templates, associations)
- [ ] **TanStack Query integration complete** (all data hooks working)
- [ ] **Sample data loaded** (realistic test data available)

---

## 🚀 **TESTING EXECUTION PLAN**

### Phase 1: Critical Dependencies (30 minutes)
1. **Run Profile tests** (Josh unblocked) ✅ DONE
2. **Verify TanStack Query setup** (Everyone unblocked)
3. **Test routing service health** (Jeremiah unblocked)

### Phase 2: MVP Features (45 minutes)  
4. **Test client management hooks**
5. **Verify BoM system functionality**
6. **Run integration tests**

### Phase 3: Documentation (15 minutes)
7. **Document any issues found**
8. **Create status report for teammates**
9. **Update this checklist with results**

---

## 🎯 **SUCCESS CRITERIA**

**MVP COMPLETE when:**
- ✅ All teammates unblocked (no critical dependency failures)
- ✅ Core data hooks working (TanStack Query integration)
- ✅ Client management system functional
- ✅ BoM system operational  
- ✅ Routing service available for AI agents
- ✅ No breaking RLS or authentication issues
- ✅ Database schema supports all planned features

**START TESTING NOW** - Each section can be tested independently!
