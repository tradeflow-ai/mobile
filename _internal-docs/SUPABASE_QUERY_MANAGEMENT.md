# Supabase SQL Query Management Guide

## 📁 Query Organization Strategy

### Naming Convention
Use prefixes to categorize your saved queries:

- `✅ WORKING - [Description] (Date)` - Working solutions
- `🏗️ SCHEMA - [Description]` - Schema setup/migrations  
- `📋 SETUP - [Description]` - Data setup/seeding
- `🔍 DEBUG - [Description]` - Debugging/inspection tools
- `🚧 TEST - [Description]` - Temporary testing (delete after use)

### Example Organization
```
✅ WORKING - Profile Signup Fix (2025-01-09)
✅ WORKING - Daily Plans Migration (2025-01-08)
🏗️ SCHEMA - Initial TradeFlow Setup
📋 SETUP - Sample Data for Development  
🔍 DEBUG - RLS Policy Inspection
🔍 DEBUG - Profile Security Audit
```

## 🗑️ Cleanup Checklist

### Safe to Delete
- [ ] Queries named "Untitled query"
- [ ] Failed RLS bypass attempts
- [ ] Temporary debugging queries
- [ ] Duplicate solutions that didn't work
- [ ] Queries with unclear/generic names

### Keep These
- [ ] Working profile signup fix
- [ ] Schema migrations that worked
- [ ] Sample data setup queries
- [ ] Security audit/inspection tools
- [ ] Any query you'd need to reference again

## 💡 Best Practices

### 1. Version Control Important Queries
Save critical queries in your project repo:
```
/sql-migrations/
  ├── 001-initial-schema.sql
  ├── 002-profile-signup-fix.sql
  ├── 003-daily-plans-table.sql
  └── dev-queries/
      ├── sample-data.sql
      └── debug-tools.sql
```

### 2. Document Working Solutions
When you have a working query, add comments:
```sql
-- ✅ WORKING SOLUTION: Profile Signup Fix
-- Date: 2025-01-09
-- Issue: RLS preventing profile creation during signup
-- Solution: Allow anonymous profile creation, restrict updates
-- Status: PRODUCTION READY

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- ... rest of query
```

### 3. Regular Cleanup Schedule
- **Weekly**: Delete "TEST" queries
- **Monthly**: Review and organize saved queries
- **Before major releases**: Archive old debugging queries

## 📋 Current Cleanup Recommendations

Based on your SQL Editor screenshot:

### 🗑️ Delete These
- "RLS Bypass for User Sign Up Pr..." (failed attempt)
- "Disable Row Level Security for..." (temporary debug)
- "Untitled query" (unclear purpose)
- "Profile Insert Permission" (likely superseded)
- Any other failed RLS attempts

### ✅ Keep & Rename These  
- "Anonymous Profile Creation During Signup" → `✅ WORKING - Profile Signup Fix (2025-01-09)`
- "TradeFlow Sample Data Setup" → `📋 SETUP - Sample Data for Development`
- "RLS Policy Inspection for Profiles" → `🔍 DEBUG - RLS Policy Inspector`
- "Profile Security Audit" → `🔍 DEBUG - Profile Security Audit`

### 🏗️ Archive in Project
Move working solutions to your project's SQL files:
- Copy working queries to `/sql-migrations/` folder
- Version control them with git
- Add proper documentation headers

## 🎯 Goal
Keep your SQL Editor clean and organized while preserving important queries for reference and documentation. 