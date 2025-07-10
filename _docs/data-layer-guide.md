# TradeFlow Data Layer Guide

**Version:** 1.0.0  
**Last Updated:** February 2024  
**Target Audience:** Development Team (Josh, Jack, Jeremiah)

## Overview

TradeFlow uses a modern, robust data layer architecture built on **TanStack Query** for server state management and **Supabase** for the backend. This guide provides comprehensive documentation for all data hooks, services, and patterns implemented in the MVP.

## Architecture Overview

### Core Technologies
- **TanStack Query** - Server state management, caching, and synchronization
- **Supabase** - Backend-as-a-Service (database, auth, real-time subscriptions)
- **TypeScript** - Type safety throughout the data layer
- **Jotai** - Client-side state management (UI state only)

### Data Layer Structure
```
services/
├── supabase.ts          # Supabase client and auth services
├── authManager.ts       # Authentication state management
├── profileService.ts    # Profile-specific operations
├── routing.ts          # Coordinate utilities for AI spatial reasoning
└── queryClient.ts      # TanStack Query configuration

hooks/
├── useProfile.ts       # Profile data hooks
├── useInventory.ts     # Inventory management hooks
├── useJobs.ts          # Job location hooks
├── useClients.ts       # Client management hooks
├── useBom.ts           # Bill of Materials hooks
└── useRoutes.ts        # Route optimization hooks
```

### Key Patterns

#### 1. **Query Key Structure**
All query keys follow a consistent hierarchical pattern:
```typescript
// Pattern: [entity, user_id, ...filters]
const queryKeys = {
  profile: (userId: string) => ['profile', userId],
  inventory: (userId: string) => ['inventory', userId],
  jobs: (userId: string) => ['jobs', userId],
  clients: (userId: string) => ['clients', userId],
  // ... etc
}
```

#### 2. **Error Handling**
All hooks implement consistent error handling:
```typescript
const { data, error, isLoading, isError } = useInventory();

if (isError) {
  console.error('Inventory fetch failed:', error);
  // Handle error in UI
}
```

#### 3. **Optimistic Updates**
Critical operations use optimistic updates for instant feedback:
```typescript
const updateInventoryMutation = useMutation({
  mutationFn: InventoryService.updateInventoryItem,
  onMutate: async (newData) => {
    // Optimistically update cache
    await queryClient.cancelQueries({ queryKey: ['inventory', userId] });
    const previousData = queryClient.getQueryData(['inventory', userId]);
    queryClient.setQueryData(['inventory', userId], (old) => {
      // Update optimistically
    });
    return { previousData };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['inventory', userId], context?.previousData);
  },
});
```

## Data Hooks Reference

### Profile Hooks (`hooks/useProfile.ts`)

#### Core Profile Operations
```typescript
// Get current user profile
const { data: profile, isLoading, error } = useProfile();

// Update profile information
const updateProfile = useUpdateProfile();
await updateProfile.mutateAsync({ 
  first_name: 'John', 
  last_name: 'Doe' 
});

// Check if profile exists
const { data: hasProfile } = useHasProfile();
```

**Key Features:**
- Automatic profile creation during signup
- Real-time profile updates
- Profile completion tracking
- Optimistic updates for instant feedback

### Inventory Hooks (`hooks/useInventory.ts`)

#### Inventory Management
```typescript
// Get all inventory items
const { data: inventory, isLoading } = useInventory();

// Filtered inventory
const { data: lowStock } = useLowStockItems();
const { data: outOfStock } = useOutOfStockItems();

// CRUD operations
const createItem = useCreateInventoryItem();
const updateItem = useUpdateInventoryItem();
const deleteItem = useDeleteInventoryItem();

// Usage examples
await createItem.mutateAsync({
  name: 'PVC Pipe',
  quantity: 25,
  category: 'Plumbing',
  status: 'available'
});

await updateItem.mutateAsync({
  id: 'item-id',
  quantity: 20
});
```

**Key Features:**
- Real-time inventory tracking
- Stock level monitoring (low stock, out of stock)
- Category-based filtering
- Optimistic quantity updates
- Search and filtering capabilities

### Job Location Hooks (`hooks/useJobs.ts`)

#### Job Management
```typescript
// Get all jobs
const { data: jobs, isLoading } = useJobs();

// Filtered jobs
const { data: pendingJobs } = usePendingJobs();
const { data: todaysJobs } = useTodaysJobs();
const { data: urgentJobs } = useUrgentJobs();

// CRUD operations
const createJob = useCreateJob();
const updateJob = useUpdateJob();
const deleteJob = useDeleteJob();

// Usage examples
await createJob.mutateAsync({
  title: 'HVAC Maintenance',
  client_id: 'client-id',
  job_type: 'service',
  priority: 'high',
  latitude: 37.7749,
  longitude: -122.4194
});
```

**Key Features:**
- Job status tracking (pending, scheduled, in_progress, completed)
- Priority management (low, medium, high, urgent)
- Geographic data for mapping
- Client relationship management
- Date-based filtering

### Client Management Hooks (`hooks/useClients.ts`)

#### Client Operations
```typescript
// Get all clients
const { data: clients, isLoading } = useClients();

// Filtered clients
const { data: activeClients } = useActiveClients();
const { data: searchResults } = useSearchClients('company name');

// CRUD operations
const createClient = useCreateClient();
const updateClient = useUpdateClient();
const deleteClient = useDeleteClient();

// Client analytics
const { data: clientStats } = useClientStats();
const { data: clientJobs } = useJobsByClient('client-id');

// Usage examples
await createClient.mutateAsync({
  name: 'John Smith',
  company_name: 'Building Corp',
  email: 'john@buildingcorp.com',
  phone: '555-123-4567',
  business_type: 'Commercial'
});
```

**Key Features:**
- Complete client profiles with contact information
- Business type categorization
- Client-job relationship tracking
- Search and filtering capabilities
- Client analytics and statistics

### Bill of Materials Hooks (`hooks/useBom.ts`)

#### Job Types and Parts Management
```typescript
// Job Types
const { data: jobTypes } = useJobTypes();
const { data: activeJobTypes } = useActiveJobTypes();
const createJobType = useCreateJobType();

// Part Templates
const { data: partTemplates } = usePartTemplates();
const { data: commonParts } = useCommonPartTemplates();
const createPartTemplate = useCreatePartTemplate();

// Bill of Materials
const { data: jobTypeParts } = useJobTypeParts('job-type-id');
const { data: requiredParts } = useRequiredJobTypeParts('job-type-id');
const { data: estimatedCost } = useJobTypePartsCost('job-type-id');

// Usage examples
await createJobType.mutateAsync({
  name: 'HVAC Maintenance',
  category: 'hvac',
  estimated_duration: 120,
  labor_rate: 85.00,
  instructions: 'Check all units, replace filters...'
});

await createPartTemplate.mutateAsync({
  name: 'HVAC Filter 16x20',
  category: 'HVAC',
  estimated_cost: 8.99,
  is_common: true
});
```

**Key Features:**
- Job type definitions with labor rates
- Part template catalog
- Bill of Materials associations
- Cost estimation
- Common parts tracking

### Route Optimization Hooks (`hooks/useRoutes.ts`)

#### Route Management
```typescript
// Get routes
const { data: routes } = useRoutes();
const { data: activeRoute } = useActiveRoute();
const { data: todaysRoutes } = useTodaysRoutes();

// Route operations
const createRoute = useCreateRoute();
const startRoute = useStartRoute();
const completeRoute = useCompleteRoute();
const optimizeRoute = useOptimizeRoute();

// Usage examples
await createRoute.mutateAsync({
  name: 'Daily Route - Feb 15',
  job_location_ids: ['job1', 'job2', 'job3'],
  planned_date: '2024-02-15'
});

// Route optimization using AI spatial reasoning
const coordinateService = CoordinateService.getInstance();
const distance = coordinateService.calculateDistance(
  { latitude: 37.7749, longitude: -122.4194 },
  { latitude: 37.7849, longitude: -122.4094 }
);
```

**Key Features:**
- Route planning and optimization
- Coordinate utilities for AI spatial reasoning
- Route status tracking
- Geographic optimization
- Route statistics and analytics

## Services Reference

### Authentication Service (`services/supabase.ts`)

```typescript
// Sign up new user
const { user, error } = await AuthService.signUp(email, password);

// Sign in existing user
const { user, error } = await AuthService.signIn(email, password);

// Sign out current user
const { error } = await AuthService.signOut();

// Get current user
const user = await AuthService.getCurrentUser();

// Listen for auth changes
const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
  console.log('Auth state changed:', user);
});
```

### Routing Service (`services/routing.ts`)

```typescript
// Health check
const isHealthy = await routingService.healthCheck();

// Optimize route
const optimizedRoute = await routingService.optimizeRoute({
  jobs: [
    { id: 'job1', location: [37.7749, -122.4194] },
    { id: 'job2', location: [37.7849, -122.4094] }
  ],
  startLocation: [37.7749, -122.4194],
  vehicleProfile: 'driving'
});
```

## Database Schema Overview

### Core Tables
- **profiles** - User profile information
- **inventory_items** - Inventory management
- **job_locations** - Job scheduling and tracking
- **clients** - Client relationship management
- **routes** - Route planning and optimization

### Bill of Materials Tables
- **job_types** - Job type definitions
- **part_templates** - Parts catalog
- **job_type_parts** - Bill of Materials associations

### Relationships
- `profiles.user_id` → `auth.users.id`
- `job_locations.client_id` → `clients.id`
- `job_locations.user_id` → `auth.users.id`
- `inventory_items.user_id` → `auth.users.id`
- `job_type_parts.job_type_id` → `job_types.id`
- `job_type_parts.part_template_id` → `part_templates.id`

## Best Practices

### 1. **Always Use Hooks**
```typescript
// ✅ Good
const { data: inventory } = useInventory();

// ❌ Bad - Direct service calls in components
const [inventory, setInventory] = useState([]);
useEffect(() => {
  InventoryService.getInventoryItems().then(setInventory);
}, []);
```

### 2. **Handle Loading States**
```typescript
const { data: jobs, isLoading, error } = useJobs();

if (isLoading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage error={error} />;
}

return <JobsList jobs={jobs} />;
```

### 3. **Use Optimistic Updates for Critical Operations**
```typescript
// Inventory quantity updates
const updateQuantity = useUpdateInventoryItem();

const handleQuantityChange = async (id: string, newQuantity: number) => {
  await updateQuantity.mutateAsync({
    id,
    quantity: newQuantity
  });
};
```

### 4. **Leverage Query Invalidation**
```typescript
// After creating a new job, invalidate jobs query
const createJob = useCreateJob({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['jobs', userId] });
  }
});
```

### 5. **Use Prefetching for Better UX**
```typescript
// Prefetch related data
const prefetchJobTypeParts = usePrefetchJobTypeParts();

const handleJobTypeSelect = (jobTypeId: string) => {
  prefetchJobTypeParts(jobTypeId);
};
```

## Performance Optimizations

### 1. **Caching Strategy**
- **Background Sync**: Critical data (jobs, inventory) refreshes every 1 minute
- **Regular Sync**: Less critical data refreshes every 5 minutes
- **Manual Refresh**: Pull-to-refresh available on all lists

### 2. **Query Optimization**
- Selective field fetching with Supabase `.select()`
- Pagination for large datasets
- Debounced search queries

### 3. **Memory Management**
- Automatic cache garbage collection
- Query result limits
- Efficient data structures

## Debugging Tips

### 1. **TanStack Query DevTools**
```typescript
// Enable in development
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Add to your app
<ReactQueryDevtools initialIsOpen={false} />
```

### 2. **Error Logging**
```typescript
// All hooks include error logging
const { error } = useInventory();

if (error) {
  console.error('Inventory error:', error);
}
```

### 3. **Query Inspection**
```typescript
// Check query state
const queryClient = useQueryClient();
const queryData = queryClient.getQueryData(['inventory', userId]);
const queryState = queryClient.getQueryState(['inventory', userId]);
```

## Migration Guide

### From Jotai to TanStack Query
```typescript
// ✅ Old (Jotai)
const [inventory, setInventory] = useAtom(inventoryAtom);

// ✅ New (TanStack Query)
const { data: inventory } = useInventory();
```

### Error Handling Migration
```typescript
// ✅ Old
try {
  const result = await InventoryService.getInventoryItems();
  setInventory(result);
} catch (error) {
  console.error(error);
}

// ✅ New
const { data: inventory, error } = useInventory();
if (error) {
  console.error('Inventory error:', error);
}
```

## FAQ

### Q: How do I add a new data hook?
A: Follow the established pattern:
1. Create the hook in the appropriate file (e.g., `hooks/useNewEntity.ts`)
2. Use consistent query keys
3. Implement error handling
4. Add TypeScript types
5. Include cache invalidation logic

### Q: When should I use optimistic updates?
A: Use optimistic updates for:
- Quantity changes (inventory, parts)
- Status updates (job status, route status)
- Simple field updates (names, descriptions)

### Q: How do I handle offline scenarios?
A: TanStack Query provides built-in offline support:
- Cached data remains available
- Mutations are retried when connection returns
- Background sync resumes automatically

### Q: Can I use multiple hooks in one component?
A: Yes! Hooks are designed to be composable:
```typescript
const { data: jobs } = useJobs();
const { data: clients } = useClients();
const { data: inventory } = useInventory();
```

## Support

For questions or issues with the data layer:
1. Check this documentation first
2. Review the hook implementation in `/hooks/`
3. Check the service implementation in `/services/`
4. Consult the TanStack Query documentation
5. Reach out to Trevor for data layer specific questions

---

**Remember:** The data layer is designed to be predictable, type-safe, and efficient. When in doubt, follow the established patterns and leverage the existing hooks rather than creating custom data fetching logic. 