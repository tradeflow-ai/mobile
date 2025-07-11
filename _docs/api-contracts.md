# API Contracts Documentation

This document outlines the API contracts for TradeFlow's edge functions and their integration with the frontend.

## Inventory Edge Function

### Endpoint
```
POST /functions/v1/inventory
```

### Authentication
- **Method**: Bearer Token
- **Header**: `Authorization: Bearer [SUPABASE_ANON_KEY]`
- **Content-Type**: `application/json`

### Request Body
```json
{
  "userId": "string",
  "jobIds": ["string"],
  "dispatchOutput": {
    "prioritized_jobs": [
      {
        "job_id": "string",
        "priority_rank": "number",
        "estimated_start_time": "string",
        "estimated_end_time": "string",
        "priority_reason": "string",
        "job_type": "emergency" | "inspection" | "service",
        "buffer_time_minutes": "number",
        "priority_score": "number",
        "scheduling_notes": "string",
        "business_priority_tier": "string",
        "geographic_reasoning": "string",
        "travel_time_to_next": "number"
      }
    ],
    "scheduling_constraints": {
      "work_start_time": "string",
      "work_end_time": "string",
      "lunch_break_start": "string",
      "lunch_break_end": "string",
      "total_work_hours": "number",
      "total_jobs_scheduled": "number",
      "schedule_conflicts": ["string"]
    },
    "recommendations": ["string"],
    "agent_reasoning": "string",
    "execution_time_ms": "number",
    "optimization_summary": {
      "emergency_jobs": "number",
      "inspection_jobs": "number",
      "service_jobs": "number",
      "total_travel_time": "number",
      "route_efficiency": "number"
    }
  }
}
```

### Response Body
```json
{
  "success": "boolean",
  "inventory_output": {
    "parts_needed": [
      {
        "item_name": "string",
        "quantity": "number",
        "category": "string",
        "priority": "critical" | "important" | "optional",
        "reason": "string",
        "job_ids": ["string"]
      }
    ],
    "current_stock": [
      {
        "item_name": "string",
        "quantity_available": "number",
        "quantity_needed": "number",
        "sufficient": "boolean"
      }
    ],
    "shopping_list": [
      {
        "item_name": "string",
        "quantity_to_buy": "number",
        "estimated_cost": "number",
        "preferred_supplier": "string",
        "priority": "critical" | "important" | "optional",
        "alternative_suppliers": ["string"]
      }
    ],
    "total_shopping_cost": "number",
    "supplier_breakdown": [
      {
        "supplier": "string",
        "items": ["string"],
        "estimated_cost": "number",
        "store_location": "string"
      }
    ]
  },
  "hardware_store_job": {
    "id": "string",
    "title": "string",
    "job_type": "hardware_store",
    "priority": "high",
    "estimated_duration": "number",
    "address": "string",
    "latitude": "number",
    "longitude": "number",
    "description": "string",
    "shopping_list": ["object"],
    "preferred_supplier": "string",
    "estimated_cost": "number",
    "scheduling_notes": "string"
  },
  "error": "string"
}
```

### Error Responses
- **400 Bad Request**: Missing required fields (userId, jobIds, dispatchOutput)
- **405 Method Not Allowed**: Non-POST requests
- **500 Internal Server Error**: Processing errors

### Usage Example
```javascript
const response = await fetch('/functions/v1/inventory', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`
  },
  body: JSON.stringify({
    userId: 'user-uuid-123',
    jobIds: ['job-1', 'job-2', 'job-3'],
    dispatchOutput: {
      // ... dispatch output from dispatcher function
    }
  })
});

const data = await response.json();

if (data.success) {
  // Handle successful inventory analysis
  console.log('Shopping list:', data.inventory_output.shopping_list);
  
  if (data.hardware_store_job) {
    console.log('Hardware store stop needed:', data.hardware_store_job);
  }
} else {
  console.error('Inventory analysis failed:', data.error);
}
```

## Dispatcher Edge Function

### Endpoint
```
POST /functions/v1/dispatcher
```

### Authentication
- **Method**: Bearer Token
- **Header**: `Authorization: Bearer [SUPABASE_ANON_KEY]`
- **Content-Type**: `application/json`

### Request Body
```json
{
  "userId": "string",
  "jobIds": ["string"],
  "planDate": "string"
}
```

### Response Body
```json
{
  "success": "boolean",
  "dispatch_output": {
    "prioritized_jobs": [
      {
        "job_id": "string",
        "priority_rank": "number",
        "estimated_start_time": "string",
        "estimated_end_time": "string",
        "priority_reason": "string",
        "job_type": "emergency" | "inspection" | "service",
        "buffer_time_minutes": "number",
        "priority_score": "number",
        "scheduling_notes": "string",
        "business_priority_tier": "string",
        "geographic_reasoning": "string",
        "travel_time_to_next": "number"
      }
    ],
    "scheduling_constraints": {
      "work_start_time": "string",
      "work_end_time": "string",
      "lunch_break_start": "string",
      "lunch_break_end": "string",
      "total_work_hours": "number",
      "total_jobs_scheduled": "number",
      "schedule_conflicts": ["string"]
    },
    "recommendations": ["string"],
    "agent_reasoning": "string",
    "execution_time_ms": "number",
    "optimization_summary": {
      "emergency_jobs": "number",
      "inspection_jobs": "number",
      "service_jobs": "number",
      "total_travel_time": "number",
      "route_efficiency": "number"
    }
  },
  "error": "string"
}
```

### Usage Example
```javascript
const response = await fetch('/functions/v1/dispatcher', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`
  },
  body: JSON.stringify({
    userId: 'user-uuid-123',
    jobIds: ['job-1', 'job-2', 'job-3'],
    planDate: '2024-01-15'
  })
});

const data = await response.json();

if (data.success) {
  // Handle successful dispatch
  console.log('Prioritized jobs:', data.dispatch_output.prioritized_jobs);
} else {
  console.error('Dispatch failed:', data.error);
}
```

## Integration Workflow

### Typical Usage Pattern
1. **Call Dispatcher**: Get prioritized jobs for the day
2. **Call Inventory**: Analyze inventory needs based on dispatch output
3. **Process Results**: Handle shopping lists and hardware store jobs

```javascript
// Step 1: Dispatch jobs
const dispatchResponse = await fetch('/functions/v1/dispatcher', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`
  },
  body: JSON.stringify({
    userId: userId,
    jobIds: jobIds,
    planDate: planDate
  })
});

const dispatchData = await dispatchResponse.json();

if (dispatchData.success) {
  // Step 2: Analyze inventory
  const inventoryResponse = await fetch('/functions/v1/inventory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({
      userId: userId,
      jobIds: jobIds,
      dispatchOutput: dispatchData.dispatch_output
    })
  });

  const inventoryData = await inventoryResponse.json();

  if (inventoryData.success) {
    // Step 3: Process results
    const finalSchedule = {
      jobs: dispatchData.dispatch_output.prioritized_jobs,
      shoppingList: inventoryData.inventory_output.shopping_list,
      hardwareStoreJob: inventoryData.hardware_store_job
    };
    
    // Use final schedule in your application
    console.log('Complete daily plan:', finalSchedule);
  }
}
```

## Error Handling

### Common Error Patterns
```javascript
async function handleApiCall(url, body) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Unknown API error');
    }

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

## Rate Limiting & Performance

### Recommendations
- **Batch Operations**: Group multiple jobs in single requests
- **Caching**: Cache results for repeated requests with same parameters
- **Error Handling**: Implement retry logic for transient failures
- **Timeouts**: Set appropriate timeouts for edge function calls (30-60 seconds)

### Performance Expectations
- **Dispatcher**: 2-5 seconds for 10-20 jobs
- **Inventory**: 3-7 seconds for comprehensive analysis
- **Combined Workflow**: 5-12 seconds total processing time 