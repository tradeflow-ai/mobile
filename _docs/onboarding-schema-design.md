# Onboarding Configuration System - Schema Design & Analysis

## Executive Summary

This document provides a comprehensive analysis of Josh's completed onboarding UI flow and designs the database schema for the onboarding configuration system that will support:
- User onboarding progress tracking
- Completion analytics and scoring
- Dynamic configuration management
- Seamless signup-to-onboarding flow integration

## Current State Analysis

### Josh's Completed Onboarding UI Flow

**Screen 1: Work Schedule** (`/onboarding/work-schedule`)
- **Data Collected**: Work days, start/end times, break preferences
- **Form Fields**: `workDays[]`, `startTime`, `endTime`, `hasBreak`, `breakStartTime`, `breakEndTime`
- **Integration**: Uses React Hook Form with Zod validation
- **Navigation**: Manual navigation to `/onboarding/time-buffers`

**Screen 2: Time Buffers** (`/onboarding/time-buffers`)
- **Data Collected**: Travel buffer, job buffer, smart buffers toggle
- **Form Fields**: `travelBufferMinutes`, `jobBufferMinutes`, `enableSmartBuffers`
- **Integration**: Uses React Hook Form with Zod validation
- **Navigation**: Manual navigation to `/onboarding/suppliers`

**Screen 3: Suppliers** (`/onboarding/suppliers`)
- **Data Collected**: Preferred suppliers, priority order (price, location, stock)
- **Form Fields**: `preferredSuppliers[]`, `priorityOrder[]`
- **Integration**: Uses React Hook Form with Zod validation
- **Navigation**: Redirects to `/(tabs)` on completion

### Current Data Flow

```
Signup → Login → Manual Onboarding → PreferencesService → profiles.preferences (JSONB)
```

**Current Issues:**
1. No automatic signup-to-onboarding flow
2. No progress tracking or completion detection
3. No analytics or completion scoring
4. All configuration is hardcoded
5. No first-time user detection

## Missing Configuration Points

### 1. Signup-to-Onboarding Flow Integration
- No automatic redirection from signup to onboarding
- No first-time user detection logic
- No onboarding requirement checking

### 2. Progress Tracking & Completion
- No step-by-step progress tracking
- No completion status detection
- No ability to resume partial onboarding

### 3. Analytics & Monitoring
- No completion rate tracking
- No drop-off point identification
- No user flow analytics

### 4. Configuration Management
- No dynamic step configuration
- No validation rule management
- No default value configuration

## Database Schema Design

### Table 1: `onboarding_preferences`

**Purpose**: Track user onboarding progress and store step-specific preferences.

```sql
CREATE TABLE IF NOT EXISTS public.onboarding_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Completion Status
  is_completed BOOLEAN DEFAULT FALSE,
  completion_score INTEGER DEFAULT 0, -- 0-100 percentage
  current_step TEXT DEFAULT 'work-schedule',
  steps_completed TEXT[] DEFAULT '{}',
  
  -- Work Schedule Step Data
  work_schedule_data JSONB DEFAULT '{}',
  work_schedule_completed BOOLEAN DEFAULT FALSE,
  work_schedule_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Time Buffers Step Data
  time_buffers_data JSONB DEFAULT '{}',
  time_buffers_completed BOOLEAN DEFAULT FALSE,
  time_buffers_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Suppliers Step Data
  suppliers_data JSONB DEFAULT '{}',
  suppliers_completed BOOLEAN DEFAULT FALSE,
  suppliers_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Configuration
  onboarding_version TEXT DEFAULT '1.0',
  skip_reasons JSONB DEFAULT '{}', -- reasons for skipping steps
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table 2: `onboarding_analytics`

**Purpose**: Track completion rates, drop-off points, and user flow analytics.

```sql
CREATE TABLE IF NOT EXISTS public.onboarding_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Event Tracking
  event_type TEXT NOT NULL CHECK (event_type IN (
    'onboarding_started', 'step_started', 'step_completed', 'step_skipped', 
    'onboarding_completed', 'onboarding_abandoned'
  )),
  step_name TEXT, -- work-schedule, time-buffers, suppliers
  
  -- Timing Data
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent_seconds INTEGER, -- time spent on step
  
  -- Context Data
  user_agent TEXT,
  platform TEXT, -- ios, android, web
  onboarding_version TEXT DEFAULT '1.0',
  
  -- Step-specific Data
  form_data JSONB DEFAULT '{}', -- form data at time of event
  validation_errors JSONB DEFAULT '{}', -- validation errors encountered
  
  -- Session Data
  session_id TEXT, -- track user session
  previous_step TEXT,
  next_step TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table 3: `onboarding_configurations`

**Purpose**: Store admin-configurable settings for flexible onboarding management.

```sql
CREATE TABLE IF NOT EXISTS public.onboarding_configurations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Configuration Identity
  config_name TEXT NOT NULL UNIQUE,
  config_version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Step Configuration
  step_definitions JSONB NOT NULL DEFAULT '{}',
  -- Example structure:
  -- {
  --   "work-schedule": {
  --     "title": "Work Schedule",
  --     "description": "Set your work preferences",
  --     "required": true,
  --     "order": 1,
  --     "validation_schema": {...},
  --     "default_values": {...}
  --   },
  --   ...
  -- }
  
  -- Flow Configuration
  flow_configuration JSONB NOT NULL DEFAULT '{}',
  -- Example structure:
  -- {
  --   "completion_threshold": 75,
  --   "allow_skip": true,
  --   "redirect_on_completion": "/(tabs)",
  --   "save_partial_progress": true
  -- }
  
  -- Feature Flags
  feature_flags JSONB DEFAULT '{}',
  -- Example: { "smart_buffers": true, "supplier_priority": false }
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## JSON Schema Structures

### Work Schedule Data Structure
```json
{
  "workDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "startTime": "8:00 AM",
  "endTime": "5:00 PM",
  "hasBreak": true,
  "breakStartTime": "12:00 PM",
  "breakEndTime": "1:00 PM"
}
```

### Time Buffers Data Structure
```json
{
  "travelBufferMinutes": 15,
  "jobBufferMinutes": 15,
  "enableSmartBuffers": true
}
```

### Suppliers Data Structure
```json
{
  "preferredSuppliers": ["home-depot", "lowes"],
  "priorityOrder": [
    {"id": "price", "label": "Price", "priority": 1},
    {"id": "location", "label": "Location", "priority": 2},
    {"id": "stock", "label": "Stock Availability", "priority": 3}
  ]
}
```

## Integration Points

### 1. AuthGuard Integration
- Detect first-time users after signup
- Redirect to onboarding if not completed
- Check onboarding completion status

### 2. PreferencesService Integration
- Transform onboarding data to preferences format
- Maintain backward compatibility
- Support preference updates

### 3. Signup Flow Integration
- Automatically redirect new users to onboarding
- Set onboarding requirement flag
- Track signup-to-onboarding conversion

### 4. Profile Management Integration
- Link onboarding completion to profile status
- Support profile updates during onboarding
- Handle onboarding data persistence

## Completion Scoring Algorithm

### Scoring Criteria
- **Work Schedule**: 40 points (required)
- **Time Buffers**: 30 points (required)
- **Suppliers**: 30 points (required)
- **Bonus Points**: +10 for completing all steps without skipping

### Completion Thresholds
- **Minimum Completion**: 70% (can proceed to main app)
- **Full Completion**: 100% (all steps completed)
- **Partial Completion**: 50% (requires follow-up)

## Next Steps

1. **Step 2**: Implement database migrations for these tables
2. **Step 3**: Create onboarding configuration service
3. **Step 4**: Integrate with existing onboarding UI flow
4. **Step 5**: Add analytics tracking
5. **Step 6**: Implement signup-to-onboarding flow

## Technical Notes

- All tables use UUID primary keys for scalability
- JSONB fields support flexible data structures
- Proper indexes needed for performance
- RLS policies required for security
- Backward compatibility maintained with existing preferences system 