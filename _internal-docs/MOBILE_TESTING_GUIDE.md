# Mobile Testing Guide - React Native/Expo

## 📱 **How to Test Your MVP Systems on Mobile**

### **Setup: Enable Console Logging**

1. **Start your app with logging:**
```bash
npm start
# Keep this terminal open - it shows console output
```

2. **Optional: Add temporary logging to components:**
```javascript
// Add to any screen component for testing:
import { useProfile } from '@/hooks/useProfile';

export default function TestScreen() {
  const profile = useProfile();
  
  // This will show in terminal:
  console.log('Profile hook result:', profile);
  
  return (
    // Your component JSX
  );
}
```

---

## 🔍 **MOBILE TESTING SECTION 1: TanStack Query Verification**

### Test 1.1: Basic Hook Testing
**Add this to any screen component temporarily:**

```javascript
// Add to app/(tabs)/index.tsx:
import { useProfile } from '@/hooks/useProfile';
import { useInventory } from '@/hooks/useInventory';
import { useJobs } from '@/hooks/useJobs';

export default function HomeScreen() {
  const profile = useProfile();
  const inventory = useInventory();
  const jobs = useJobs();
  
  // Check terminal for these logs:
  console.log('=== HOOK TESTING ===');
  console.log('Profile:', profile.data, 'Loading:', profile.isLoading);
  console.log('Inventory:', inventory.data, 'Loading:', inventory.isLoading);
  console.log('Jobs:', jobs.data, 'Loading:', jobs.isLoading);
  
  return (
    // Your existing JSX
  );
}
```

### Test 1.2: Error Detection
**Watch terminal for these patterns:**
- ✅ `Profile: { id: "...", first_name: "..." } Loading: false`
- ✅ `Inventory: [] Loading: false` (empty array is fine)
- ✅ `Jobs: [] Loading: false` (empty array is fine)
- ❌ `Error: QueryClient not found`
- ❌ `Error: No authenticated user`

---

## 🗺️ **MOBILE TESTING SECTION 2: Routing Service**

### Test 2.1: Import Test
**Add to any screen component:**

```javascript
// Add to app/(tabs)/index.tsx:
import { routingService } from '@/services/routing';
import { useEffect } from 'react';

export default function HomeScreen() {
  useEffect(() => {
    // Test routing service health
    const testRouting = async () => {
      try {
        const health = await routingService.healthCheck();
        console.log('=== ROUTING SERVICE TEST ===');
        console.log('Health check:', health);
      } catch (error) {
        console.log('Routing service error:', error);
      }
    };
    
    testRouting();
  }, []);
  
  return (
    // Your existing JSX
  );
}
```

### Test 2.2: Expected Terminal Output
**Watch terminal for:**
- ✅ `Health check: { status: 'healthy', message: 'Mock routing service active' }`
- ❌ `Routing service error: ...`

---

## 👥 **MOBILE TESTING SECTION 3: Client Management**

### Test 3.1: Client Hooks Test
**Add to any screen component:**

```javascript
// Add to app/(tabs)/index.tsx:
import { useClients } from '@/hooks/useClients';

export default function HomeScreen() {
  const clients = useClients();
  
  console.log('=== CLIENT MANAGEMENT TEST ===');
  console.log('Clients:', clients.data, 'Loading:', clients.isLoading);
  
  return (
    // Your existing JSX
  );
}
```

### Test 3.2: Expected Results
**Watch terminal for:**
- ✅ `Clients: [] Loading: false` (empty array is fine)
- ❌ `Error: relation "clients" does not exist`

---

## 📋 **MOBILE TESTING SECTION 4: Bill of Materials**

### Test 4.1: BoM Hooks Test
**Add to any screen component:**

```javascript
// Add to app/(tabs)/index.tsx:
import { useJobTypes, usePartTemplates } from '@/hooks/useBom';

export default function HomeScreen() {
  const jobTypes = useJobTypes();
  const partTemplates = usePartTemplates();
  
  console.log('=== BOM SYSTEM TEST ===');
  console.log('Job Types:', jobTypes.data, 'Loading:', jobTypes.isLoading);
  console.log('Part Templates:', partTemplates.data, 'Loading:', partTemplates.isLoading);
  
  return (
    // Your existing JSX
  );
}
```

### Test 4.2: Expected Results
**Watch terminal for:**
- ✅ `Job Types: [...] Loading: false` (should have sample data)
- ✅ `Part Templates: [...] Loading: false` (should have sample data)
- ❌ `Error: relation "job_types" does not exist`

---

## 🧪 **MOBILE TESTING SECTION 5: Integration Test**

### Test 5.1: Complete System Test
**Replace the content of `app/(tabs)/index.tsx` temporarily:**

```javascript
import { useProfile } from '@/hooks/useProfile';
import { useInventory } from '@/hooks/useInventory';
import { useJobs } from '@/hooks/useJobs';
import { useClients } from '@/hooks/useClients';
import { useJobTypes } from '@/hooks/useBom';
import { routingService } from '@/services/routing';
import { useEffect } from 'react';
import { View, Text, SafeAreaView } from 'react-native';

export default function HomeScreen() {
  const profile = useProfile();
  const inventory = useInventory();
  const jobs = useJobs();
  const clients = useClients();
  const jobTypes = useJobTypes();
  
  useEffect(() => {
    const runTests = async () => {
      console.log('=== FULL SYSTEM TEST ===');
      console.log('Profile:', profile.data ? 'LOADED' : 'EMPTY', 'Loading:', profile.isLoading);
      console.log('Inventory:', inventory.data ? 'LOADED' : 'EMPTY', 'Loading:', inventory.isLoading);
      console.log('Jobs:', jobs.data ? 'LOADED' : 'EMPTY', 'Loading:', jobs.isLoading);
      console.log('Clients:', clients.data ? 'LOADED' : 'EMPTY', 'Loading:', clients.isLoading);
      console.log('JobTypes:', jobTypes.data ? 'LOADED' : 'EMPTY', 'Loading:', jobTypes.isLoading);
      
      // Test routing service
      try {
        const health = await routingService.healthCheck();
        console.log('Routing Service:', health.status);
      } catch (error) {
        console.log('Routing Service: ERROR', error);
      }
      
      console.log('=== TEST COMPLETE ===');
    };
    
    runTests();
  }, [profile.data, inventory.data, jobs.data, clients.data, jobTypes.data]);
  
  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>MVP System Test</Text>
      <Text>Check terminal for test results</Text>
      <Text>Profile: {profile.isLoading ? 'Loading...' : 'Loaded'}</Text>
      <Text>Inventory: {inventory.isLoading ? 'Loading...' : 'Loaded'}</Text>
      <Text>Jobs: {jobs.isLoading ? 'Loading...' : 'Loaded'}</Text>
      <Text>Clients: {clients.isLoading ? 'Loading...' : 'Loaded'}</Text>
      <Text>Job Types: {jobTypes.isLoading ? 'Loading...' : 'Loaded'}</Text>
    </SafeAreaView>
  );
}
```

### Test 5.2: Success Criteria
**Watch terminal for:**
```
=== FULL SYSTEM TEST ===
Profile: LOADED Loading: false
Inventory: LOADED Loading: false  
Jobs: LOADED Loading: false
Clients: LOADED Loading: false
JobTypes: LOADED Loading: false
Routing Service: healthy
=== TEST COMPLETE ===
```

---

## 📊 **Quick Status Check**

### **✅ PASS Criteria:**
- All hooks return data (even empty arrays)
- No "QueryClient not found" errors
- No "relation does not exist" errors
- Routing service returns "healthy"
- All loading states work properly

### **❌ FAIL Criteria:**
- Any import errors
- Database table missing errors
- QueryClient configuration errors
- Routing service unavailable

---

## 🚀 **Testing Steps:**

1. **Start app:** `npm start`
2. **Watch terminal** for console output
3. **Add test code** to `app/(tabs)/index.tsx`
4. **Navigate to Home tab** in app
5. **Check terminal** for test results
6. **Remove test code** when done

**Ready to test?** Start with the Integration Test (Section 5) - it tests everything at once! 