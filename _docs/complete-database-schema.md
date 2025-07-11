# TradeFlow Mobile App - Complete Database Schema Documentation

*Last Updated: January 2025*

## 📋 Overview

This document provides a comprehensive overview of the TradeFlow mobile app's Supabase database schema. The database supports intelligent tradesmen tracking with maps, GPS tracking, user routes, and AI-powered daily planning.

## 🏗️ Database Architecture

### **Core Business Tables**

#### 1. **`profiles`** - User Management
Extended user profiles with business context.

**Key Fields:**
- `id` (UUID, PK) - Links to `auth.users`
- `email` (TEXT, UNIQUE) - User email address
- `first_name`, `last_name` (TEXT) - User names
- `full_name` (TEXT) - Computed full name
- `phone` (TEXT) - Contact number
- `business_name` (TEXT) - Company name
- `role` (TEXT) - User role (tradesman, admin, etc.)
- `preferences` (JSONB) - User preferences and settings
- `created_at`, `updated_at` - Timestamps

**Business Context:** Central user management with role-based access control.

---

#### 2. **`inventory_items`** - Parts & Inventory Tracking
Comprehensive inventory management system.

**Key Fields:**
- `id` (UUID, PK) - Unique identifier
- `user_id` (UUID, FK) - Owner reference
- `name` (TEXT) - Item name
- `description` (TEXT) - Detailed description
- `category` (TEXT) - Item category
- `subcategory` (TEXT) - Sub-classification
- `quantity` (INTEGER) - Current stock
- `unit_price` (DECIMAL) - Cost per unit
- `supplier` (TEXT) - Supplier information
- `location` (TEXT) - Storage location
- `status` (TEXT) - Available/low_stock/out_of_stock
- `created_at`, `updated_at` - Timestamps

**Business Context:** Real-time inventory tracking with low-stock alerts.

---

#### 3. **`job_locations`** - Jobs & Work Orders
Job management and location tracking.

**Key Fields:**
- `id` (UUID, PK) - Unique identifier
- `user_id` (UUID, FK) - Assigned user
- `client_id` (UUID, FK) - Client reference
- `title` (TEXT) - Job title
- `description` (TEXT) - Job details
- `address` (TEXT) - Job site address
- `latitude`, `longitude` (DECIMAL) - GPS coordinates
- `scheduled_date` (DATE) - Planned date
- `status` (TEXT) - Job status
- `estimated_duration` (INTEGER) - Minutes
- `created_at`, `updated_at` - Timestamps

**Business Context:** Complete job lifecycle management with GPS integration.

---

#### 4. **`routes`** - Route Planning & GPS Tracking
Intelligent route planning and tracking.

**Key Fields:**
- `id` (UUID, PK) - Unique identifier
- `user_id` (UUID, FK) - Route owner
- `name` (TEXT) - Route name
- `description` (TEXT) - Route description
- `waypoints` (JSONB) - GPS waypoints array
- `estimated_duration` (INTEGER) - Minutes
- `estimated_distance` (DECIMAL) - Miles/kilometers
- `status` (TEXT) - Route status
- `created_at`, `updated_at` - Timestamps

**Business Context:** GPS-optimized route planning with real-time tracking.

---

#### 5. **`inventory_movements`** - Inventory Audit Trail
Complete audit trail for inventory changes.

**Key Fields:**
- `id` (UUID, PK) - Unique identifier
- `inventory_item_id` (UUID, FK) - Item reference
- `user_id` (UUID, FK) - User who made change
- `movement_type` (TEXT) - Type of movement
- `quantity_change` (INTEGER) - Change amount
- `previous_quantity` (INTEGER) - Previous stock
- `new_quantity` (INTEGER) - New stock
- `notes` (TEXT) - Movement notes
- `created_at` - Timestamp

**Business Context:** Complete inventory accountability and auditing.

---

### **Advanced Features**

#### 6. **`clients`** - Client Management
Customer relationship management.

**Key Fields:**
- `id` (UUID, PK) - Unique identifier
- `user_id` (UUID, FK) - Account owner
- `name` (TEXT) - Client name
- `email` (TEXT) - Contact email
- `phone` (TEXT) - Contact phone
- `address` (TEXT) - Client address
- `preferences` (JSONB) - Client preferences
- `created_at`, `updated_at` - Timestamps

---

#### 7. **`daily_plans`** - AI-Powered Daily Planning
Intelligent daily planning system.

**Key Fields:**
- `id` (UUID, PK) - Unique identifier
- `user_id` (UUID, FK) - Plan owner
- `plan_date` (DATE) - Target date
- `jobs` (JSONB) - Scheduled jobs
- `routes` (JSONB) - Planned routes
- `inventory_checklist` (JSONB) - Required items
- `status` (TEXT) - Plan status
- `ai_recommendations` (JSONB) - AI suggestions
- `created_at`, `updated_at` - Timestamps

---

---

## 🔗 **Relationships & Constraints**

### **Primary Relationships**
- **User-Centric Design**: All tables link to `profiles.id` for user segmentation
- **Job-Client Relationship**: `job_locations.client_id` → `clients.id`
- **Inventory Tracking**: `inventory_movements.inventory_item_id` → `inventory_items.id`
- **Route Integration**: Routes connect to jobs through waypoints


### **Data Integrity**
- **Cascade Deletes**: User deletion removes all associated data
- **Foreign Key Constraints**: Maintain referential integrity
- **Check Constraints**: Validate enum values and data ranges
- **Unique Constraints**: Prevent duplicate entries where required

---

## 📊 **Insights & Features**

### **Business Intelligence**
- **Inventory Optimization**: Track usage patterns and stock levels
- **Route Efficiency**: Analyze route performance and optimization
- **Job Success Metrics**: Track completion rates and timelines


### **AI-Powered Features**
- **Daily Planning**: Intelligent job scheduling and route optimization
- **Inventory Predictions**: Stock level forecasting
- **Route Suggestions**: AI-optimized route planning


### **Integration Capabilities**

- **Real-time Updates**: Live inventory and job status updates
- **Cross-platform Sync**: Seamless experience across devices
- **Offline Support**: Local data caching and sync

---

## 🛠️ **Technical Implementation**

### **Database Features**
- **Row Level Security (RLS)**: User-based data access control
- **Optimized Indexes**: Fast query performance
- **Triggers**: Automated timestamp updates
- **JSONB Storage**: Flexible schema for preferences and configurations

### **Migration Strategy**
Database migrations are organized by feature:
1. `001-initial-schema.sql` - Core business tables
2. `002-profile-signup-fix.sql` - Profile improvements  
3. `003-daily-plans-table.sql` - Daily planning system

### **Performance Optimizations**
- **Strategic Indexing**: Optimized for common query patterns
- **Query Optimization**: Efficient data retrieval
- **Partitioning Ready**: Scalable for large datasets
- **Caching Strategy**: Reduced database load

---

## 🔒 **Security & Privacy**

### **Access Control**
- **Row Level Security**: User-specific data access
- **Role-Based Permissions**: Admin and user role separation
- **API Security**: Authenticated access only
- **Data Encryption**: Sensitive data protection

### **Privacy Features**
- **Consent Management**: User control over data usage
- **Data Minimization**: Collect only necessary information
- **Audit Trails**: Complete activity logging
- **User Data Control**: Export and deletion capabilities

---

## 📈 **Scalability & Future-Proofing**

### **Horizontal Scaling**
- **Microservice Ready**: Service-oriented architecture
- **Database Sharding**: User-based data partitioning
- **Caching Layers**: Redis/Memcached integration
- **CDN Integration**: Global content delivery

### **Extensibility**
- **Plugin Architecture**: Easy feature additions
- **API-First Design**: Integration-friendly
- **Configuration-Driven**: Flexible business logic
- **Event-Driven**: Real-time updates and notifications

---

*This schema represents a production-ready, scalable foundation for the TradeFlow mobile application, designed to support intelligent tradesmen tracking with advanced AI capabilities and comprehensive business intelligence.* 