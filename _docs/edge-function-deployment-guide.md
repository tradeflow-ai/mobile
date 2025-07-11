# Edge Function Deployment Guide

## Overview

This guide covers the deployment and management of TradeFlow's 2-step edge function architecture:
- **Dispatcher Function**: Job prioritization and route optimization
- **Inventory Function**: Parts analysis and hardware store job creation

## Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Supabase project set up with database tables
- OpenAI API key configured

## Environment Setup

### 1. Supabase Environment Variables

Configure these environment variables in your Supabase dashboard:

**Dashboard → Settings → Edge Functions → Environment Variables**

```
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Local Development Environment

Create `.env.local` file in project root:

```bash
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Deployment Steps

### 1. Deploy Dispatcher Function

```bash
# Deploy dispatcher function
supabase functions deploy dispatcher

# Verify deployment
supabase functions list
```

### 2. Deploy Inventory Function

```bash
# Deploy inventory function
supabase functions deploy inventory

# Verify deployment
supabase functions list
```

### 3. Test Deployed Functions

```bash
# Test dispatcher function
curl -X POST https://your-project.supabase.co/functions/v1/dispatcher \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "userId": "test-user",
    "jobIds": ["job-1", "job-2"],
    "planDate": "2024-12-21"
  }'

# Test inventory function
curl -X POST https://your-project.supabase.co/functions/v1/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "userId": "test-user",
    "jobIds": ["job-1", "job-2"],
    "dispatchOutput": {
      "prioritized_jobs": [
        {
          "job_id": "job-1",
          "job_type": "emergency",
          "priority_rank": 1
        }
      ]
    }
  }'
```

## Function Architecture

### Dispatcher Function Structure

```
supabase/functions/dispatcher/
├── index.ts              # Main entry point
├── dispatcher-agent.ts   # Agent implementation
├── dispatcher-prompt.ts  # AI prompt (preserved exactly)
├── deno.json            # Deno configuration
└── import_map.json      # Import mappings
```

### Inventory Function Structure

```
supabase/functions/inventory/
├── index.ts              # Main entry point
├── inventory-agent.ts    # Agent implementation
├── inventory-prompt.ts   # AI prompt (preserved exactly)
├── mock-supplier.ts      # Supplier API mock
├── deno.json            # Deno configuration
└── import_map.json      # Import mappings
```

## API Specifications

### Dispatcher Function

**Endpoint**: `POST /functions/v1/dispatcher`

**Input Schema**:
```typescript
{
  userId: string;
  jobIds: string[];
  planDate: string; // YYYY-MM-DD format
}
```

**Output Schema**:
```typescript
{
  prioritized_jobs: Array<{
    job_id: string;
    priority_rank: number;
    job_type: 'emergency' | 'inspection' | 'service';
    estimated_start_time: string;
    estimated_end_time: string;
    priority_reason: string;
    scheduling_notes: string;
    business_priority_tier: string;
    geographic_reasoning: string;
    travel_time_to_next: number;
  }>;
  scheduling_constraints: {
    work_start_time: string;
    work_end_time: string;
    lunch_break_start: string;
    lunch_break_end: string;
    total_work_hours: number;
    total_jobs_scheduled: number;
  };
  optimization_summary: {
    emergency_jobs: number;
    inspection_jobs: number;
    service_jobs: number;
    total_travel_time: number;
    route_efficiency: number;
  };
}
```

### Inventory Function

**Endpoint**: `POST /functions/v1/inventory`

**Input Schema**:
```typescript
{
  userId: string;
  jobIds: string[];
  dispatchOutput: DispatcherOutput; // Output from dispatcher function
}
```

**Output Schema**:
```typescript
{
  inventory_analysis: {
    shopping_list: Array<{
      item_name: string;
      quantity_to_buy: number;
      estimated_cost: number;
      preferred_supplier: string;
      priority: 'critical' | 'important' | 'optional';
    }>;
    total_shopping_cost: number;
    inventory_status: string;
    parts_availability: string;
  };
  hardware_store_job?: {
    id: string;
    title: string;
    job_type: 'hardware_store';
    priority: string;
    address: string;
    latitude: number;
    longitude: number;
    estimated_duration: number;
    estimated_cost: number;
    shopping_list: Array<ShoppingListItem>;
  };
}
```

## Local Development

### 1. Start Local Edge Functions

```bash
# Start both functions locally
supabase functions serve --env-file .env.local

# Start specific function
supabase functions serve dispatcher --env-file .env.local
supabase functions serve inventory --env-file .env.local
```

### 2. Test Local Functions

```bash
# Test local dispatcher
curl -X POST http://localhost:54321/functions/v1/dispatcher \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{"userId": "test", "jobIds": ["job-1"], "planDate": "2024-12-21"}'

# Test local inventory
curl -X POST http://localhost:54321/functions/v1/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{"userId": "test", "jobIds": ["job-1"], "dispatchOutput": {}}'
```

## Monitoring & Debugging

### 1. View Function Logs

```bash
# View logs for dispatcher function
supabase functions logs dispatcher

# View logs for inventory function
supabase functions logs inventory

# Follow logs in real-time
supabase functions logs dispatcher --follow
```

### 2. Debug Common Issues

**Issue**: OpenAI API Key not found
```bash
# Check environment variables
supabase functions logs dispatcher | grep "OPENAI_API_KEY"

# Update environment variables in Supabase dashboard
# Dashboard → Settings → Edge Functions → Environment Variables
```

**Issue**: CORS errors
```bash
# Add CORS headers to function response
res.headers.set('Access-Control-Allow-Origin', '*');
res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

**Issue**: Function timeout
```bash
# Increase timeout in function (max 60 seconds)
# Or optimize function performance
```

## Performance Optimization

### 1. Response Time Targets

- **Dispatcher Function**: < 3 seconds average
- **Inventory Function**: < 5 seconds average

### 2. Optimization Strategies

**Dispatcher Optimization**:
- Cache route calculations for similar job sets
- Optimize GPT-4o prompt for faster processing
- Implement fallback algorithms for network issues

**Inventory Optimization**:
- Batch parts lookups to reduce API calls
- Cache inventory data for faster access
- Optimize shopping list generation algorithms

### 3. Performance Monitoring

```bash
# Run performance tests
npm run test:performance

# Monitor function execution times
supabase functions logs dispatcher | grep "execution_time"
```

## Security Considerations

### 1. Authentication

- All functions require valid Supabase authentication
- Use Row Level Security (RLS) for database access
- Validate user permissions before processing

### 2. Rate Limiting

- Implement rate limiting to prevent abuse
- Monitor API usage patterns
- Set up alerts for unusual activity

### 3. Data Validation

- Validate all input parameters
- Sanitize user inputs
- Return appropriate error messages

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Local testing completed
- [ ] All tests passing

### Deployment
- [ ] Dispatcher function deployed
- [ ] Inventory function deployed
- [ ] Functions listed in Supabase dashboard
- [ ] Test endpoints responding

### Post-Deployment
- [ ] Production testing completed
- [ ] Performance benchmarks met
- [ ] Error monitoring set up
- [ ] Documentation updated

## Troubleshooting

### Common Errors

**Error**: "Function not found"
```bash
# Check function deployment
supabase functions list

# Redeploy if necessary
supabase functions deploy dispatcher
```

**Error**: "OpenAI API quota exceeded"
```bash
# Check OpenAI usage dashboard
# Upgrade OpenAI plan if needed
# Implement usage monitoring
```

**Error**: "Database connection failed"
```bash
# Check database connection
# Verify SUPABASE_URL and service role key
# Check database health in Supabase dashboard
```

## Rollback Strategy

### 1. Quick Rollback

```bash
# Redeploy previous version
git checkout previous-commit
supabase functions deploy dispatcher
supabase functions deploy inventory
```

### 2. Emergency Fallback

- Implement manual planning mode in mobile app
- Disable AI features temporarily
- Use cached results for critical operations

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Edge Functions

on:
  push:
    branches: [main]
    paths: ['supabase/functions/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - run: supabase functions deploy dispatcher
      - run: supabase functions deploy inventory
```

## Support & Documentation

- **Function Documentation**: This guide
- **API Reference**: See README.md API Endpoints section
- **Test Examples**: See `test-edge-functions-integration.ts`
- **Performance Tests**: See `run-all-tests.ts`

For additional support, check the function logs and test outputs for detailed error information. 