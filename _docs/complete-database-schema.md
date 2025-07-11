# TradeFlow Mobile App - Complete Database Schema Documentation

*Last Updated: January 2025*

## 📋 Overview

This document provides a comprehensive overview of the TradeFlow mobile app's Supabase database schema. The database supports intelligent tradesmen tracking with maps, GPS tracking, user routes, AI-powered daily planning, and user onboarding systems.

## 🏗️ Database Architecture

### **Core Business Tables**

#### 1. **`profiles`** - User Management
Extended user profiles with business context.

**Key Fields:**
- `id` (UUID, PK) - Links to `auth.users`
- `email` (TEXT, UNIQUE) - User email address
- `first_name`, `last_name` (TEXT) - User names
- `full_name` (TEXT) - Complete name
- `company_name` (TEXT) - Business information
- `phone`, `address`, `city`, `state`, `zip_code` (TEXT) - Contact info
- `timezone` (TEXT, default: 'America/New_York')
- `preferences` (JSONB) - User preferences and settings
- `onboarding_completed_at` (TIMESTAMPTZ) - Onboarding completion time
- `role` (TEXT, default: 'user') - User role

**Relationships:**
- Parent to all user-specific data tables
- Foreign key to `auth.users(id)`

---

#### 2. **`inventory_items`** - Parts and Inventory Management
Complete inventory tracking with supplier information.

**Key Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `name` (TEXT) - Item name
- `description` (TEXT) - Item description
- `quantity` (INTEGER) - Current stock
- `unit` (TEXT, default: 'each') - Unit of measurement
- `category` (TEXT) - Item category
- `status` (TEXT) - 'available', 'low_stock', 'out_of_stock', 'discontinued'
- `min_quantity`, `max_quantity` (INTEGER) - Stock thresholds
- `cost_per_unit` (NUMERIC) - Unit cost
- `supplier` (TEXT) - Supplier name
- `supplier_part_number` (TEXT) - Supplier SKU
- `barcode` (TEXT) - Barcode for scanning
- `image_url` (TEXT) - Product image
- `tags` (TEXT[]) - Searchable tags

**Business Logic:**
- Automatic status updates based on quantity thresholds
- Integration with job requirements and inventory movements

---

#### 3. **`job_locations`** - Work Orders and Jobs
Individual job/work order management with comprehensive tracking.

**Key Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `title` (TEXT) - Job title
- `description` (TEXT) - Job description
- `job_type` (TEXT) - 'delivery', 'pickup', 'service', 'inspection', 'maintenance', 'emergency'
- `priority` (TEXT) - 'low', 'medium', 'high', 'urgent'
- `status` (TEXT) - 'pending', 'scheduled', 'in_progress', 'completed', 'cancelled'
- `latitude`, `longitude` (NUMERIC) - GPS coordinates
- `address`, `city`, `state`, `zip_code` (TEXT) - Location details
- `scheduled_date` (TIMESTAMPTZ) - Scheduled appointment time
- `estimated_duration` (INTEGER) - Expected duration in minutes
- `actual_start_time`, `actual_end_time` (TIMESTAMPTZ) - Actual timing
- `customer_name`, `customer_phone`, `customer_email` (TEXT) - Customer info
- `instructions` (TEXT) - Special instructions
- `required_items` (UUID[]) - Required inventory items
- `completion_notes` (TEXT) - Job completion notes
- `completion_photos` (TEXT[]) - Photo URLs

**Integration:**
- Links to inventory items for material requirements
- Used in route optimization and daily planning
- Tracks actual vs estimated performance

---

#### 4. **`routes`** - Route Planning and Optimization
Optimized route management for efficient job scheduling.

**Key Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `name` (TEXT) - Route name
- `description` (TEXT) - Route description
- `status` (TEXT) - 'planned', 'active', 'completed', 'cancelled'
- `job_location_ids` (UUID[]) - Ordered list of job locations
- `optimized_order` (UUID[]) - AI-optimized job order
- `total_distance` (NUMERIC) - Total route distance
- `estimated_time` (INTEGER) - Estimated total time
- `planned_date` (DATE) - Route execution date
- `start_time`, `end_time` (TIMESTAMPTZ) - Actual execution times

**AI Integration:**
- Optimized by route optimization AI agent
- Considers traffic, job priorities, and time windows

---

#### 5. **`inventory_movements`** - Inventory Audit Trail
Complete audit trail for inventory changes.

**Key Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `inventory_item_id` (UUID, FK to inventory_items)
- `movement_type` (TEXT) - 'stock_in', 'stock_out', 'adjustment', 'transfer', 'job_used'
- `quantity_change` (INTEGER) - Quantity changed (positive or negative)
- `previous_quantity`, `new_quantity` (INTEGER) - Before/after quantities
- `reason` (TEXT) - Reason for movement
- `job_location_id` (UUID, FK to job_locations) - Associated job (if applicable)
- `notes` (TEXT) - Additional notes

**Business Value:**
- Complete inventory tracking and auditing
- Job-specific material usage tracking
- Automated stock level management

---

### **AI & Planning System**

#### 6. **`daily_plans`** - AI-Powered Daily Planning
Central table for AI agent daily planning workflow.

**Key Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `status` (TEXT) - 'pending', 'dispatch_complete', 'route_complete', 'inventory_complete', 'approved', 'cancelled', 'error'
- `current_step` (TEXT) - 'dispatch', 'route', 'inventory', 'complete'
- `planned_date` (DATE) - Date for the plan
- `dispatch_output` (JSONB) - AI dispatch strategist output
- `route_output` (JSONB) - AI route optimizer output
- `inventory_output` (JSONB) - AI inventory specialist output
- `user_modifications` (JSONB) - User changes to AI recommendations
- `preferences_snapshot` (JSONB) - User preferences at planning time
- `job_ids` (UUID[]) - Jobs included in plan
- `created_job_ids` (UUID[]) - Jobs created by AI
- `error_state` (JSONB) - Error information if planning fails
- `retry_count` (INTEGER) - Number of retry attempts
- `total_estimated_duration` (INTEGER) - Total planned duration
- `total_distance` (NUMERIC) - Total planned distance
- `started_at`, `completed_at` (TIMESTAMPTZ) - Execution timing

**AI Workflow:**
1. Dispatch Strategist analyzes pending jobs and creates recommendations
2. Route Optimizer creates efficient route plans
3. Inventory Specialist checks material availability
4. User reviews and modifies plan
5. Plan is approved and executed

---

### **Map Integration System**

#### 7. **`supported_map_apps`** - Map Application Registry
Registry of supported map applications with capabilities.

**Key Fields:**
- `id` (UUID, PK)
- `app_name` (TEXT, UNIQUE) - Internal app identifier
- `app_display_name` (TEXT) - User-friendly name
- `app_description` (TEXT) - App description
- Platform availability (`ios_available`, `android_available`, `web_available`)
- Platform-specific identifiers (bundle ID, package name, web URL)
- Feature support flags (directions, search, coordinates, address)
- Configuration (active status, sort order, popularity score)
- `icon_url` (TEXT) - App icon URL

**Integration:**
- Supports multiple map applications
- Platform-specific deep linking
- Feature capability mapping

---

#### 8. **`map_app_deep_links`** - Deep Link Configuration
Deep link URL templates and configuration for map applications.

**Key Fields:**
- `id` (UUID, PK)
- `map_app_id` (UUID, FK to supported_map_apps, UNIQUE)
- URL templates for different functions:
  - `directions_url_template` (TEXT) - Navigation directions
  - `search_url_template` (TEXT) - Location search
  - `coordinate_url_template` (TEXT) - Coordinate-based navigation
  - `address_url_template` (TEXT) - Address-based navigation
- Platform-specific schemes (`ios_url_scheme`, `android_intent_action`)
- Configuration flags (default for platform, app detection, web fallback)
- Testing status and timestamps

**Deep Linking:**
- Template-based URL generation
- Platform-specific handling
- Fallback strategies

---

#### 9. **`user_map_preferences`** - User Map Preferences
User-specific map application preferences and settings.

**Key Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles, UNIQUE)
- Map app preferences by platform:
  - `preferred_map_app_id` (UUID, FK to supported_map_apps) - Overall preference
  - `ios_preferred_app_id` (UUID) - iOS-specific preference
  - `android_preferred_app_id` (UUID) - Android-specific preference
  - `web_preferred_app_id` (UUID) - Web-specific preference
- `fallback_map_apps` (UUID[]) - Fallback options
- Behavior preferences:
  - `auto_open_directions` (BOOLEAN) - Automatically open directions
  - `prompt_before_opening` (BOOLEAN) - Show confirmation dialog
  - `remember_choice` (BOOLEAN) - Remember user choices
  - `prefer_navigation_for_long_routes` (BOOLEAN) - Use navigation apps for long routes
  - `long_route_threshold_miles` (NUMERIC) - Distance threshold
- Privacy settings (`allow_usage_analytics`, `allow_performance_tracking`)
- Usage tracking (`last_used_app_id`, `total_usage_count`)

**Personalization:**
- Platform-specific preferences
- Smart app selection
- Privacy controls

---

## 🔄 **Data Relationships & Flow**

### **Core Business Flow**
```
profiles → job_locations → routes → daily_plans
    ↓           ↓             ↓
inventory_items → inventory_movements
```

### **Map Integration Flow**
```
job_locations → user_map_preferences → supported_map_apps
                        ↓                       ↓
                 map_app_deep_links
```

## 🔒 **Security & Compliance**

### **Row Level Security (RLS)**
- All tables have RLS enabled
- User-specific data isolated by `user_id`
- Admin access for system management
- Analytics access with anonymization

### **Data Privacy**
- GDPR compliance through retention policies
- Automated data anonymization
- User consent tracking
- Right to deletion support

### **Audit Trail**
- Complete inventory movement tracking
- AI decision context preservation
- Change tracking on all critical tables

## 📊 **Analytics & Insights**

### **Business Intelligence**
- User behavior patterns
- AI agent performance metrics
- Workflow efficiency analysis
- Inventory optimization insights

### **System Performance**
- API response times
- Error rates and patterns
- Feature adoption tracking

### **Continuous Improvement**
- AI model training data
- User preference learning
- System optimization recommendations

## 🚀 **Scalability Considerations**

### **Performance Optimizations**
- Strategic indexes on high-query columns
- GIN indexes for JSONB fields
- Partitioning for time-series data
- Materialized views for analytics

### **Data Lifecycle Management**
- Automated data archival
- Retention policy enforcement
- Performance monitoring
- Cost optimization

## 📈 **Migration Status**

### **Completed Migrations**
1. `001-initial-schema.sql` - Core business tables
2. `002-profile-signup-fix.sql` - Profile enhancements
3. `003-daily-plans-table.sql` - AI planning system
4. `004-onboarding-configuration.sql` - Onboarding system
5. `005-onboarding-analytics-functions.sql` - Onboarding analytics
6. `007-map-preferences.sql` - Map integration system

### **Current Schema Completeness**
- ✅ Core business operations (100%)
- ✅ AI agent integration (100%)
- ✅ Map integration (100%)
- ⚠️ Bill of Materials system (planned)
- ⚠️ Advanced inventory optimization (planned)

---

*This documentation reflects the current production state of the TradeFlow Supabase database as of January 2025.* 