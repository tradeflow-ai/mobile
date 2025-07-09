# Schema Analysis Report - Bill of Materials Verification
*Generated during Step 1 of Backend Checklist*

## ✅ **EXISTING SCHEMA STRENGTHS**

### Core Tables Present:
1. **`profiles`** - User management (✅ matches auth implementation)
2. **`inventory_items`** - Parts/inventory tracking
3. **`job_locations`** - Individual jobs/work orders
4. **`routes`** - Route planning and optimization
5. **`inventory_movements`** - Inventory tracking/auditing

### Auth Integration:
- ✅ Profiles table has `first_name`, `last_name` fields (matches current auth)
- ✅ Proper UUID foreign key to `auth.users`
- ⚠️ **ISSUE**: Role constraint limits to 'user'/'admin' (needs occupation support)

### Current Job Type Support:
- `job_locations.job_type` enum: 'delivery', 'pickup', 'service', 'inspection', 'maintenance', 'emergency'
- `job_locations.required_items` as UUID array pointing to inventory

## ❌ **MISSING BILL OF MATERIALS STRUCTURE**

### Critical Missing Tables:

#### 1. **`job_types` Table** (Missing)
```sql
-- NEEDED: Formal job type definitions
CREATE TABLE public.job_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL, -- e.g., "HVAC Installation", "Plumbing Repair"
  category TEXT NOT NULL, -- e.g., "Demand", "Maintenance" 
  description TEXT,
  estimated_duration INTEGER, -- default duration in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. **`job_type_parts` Join Table** (Missing)
```sql
-- NEEDED: Bill of Materials - what parts each job type typically needs
CREATE TABLE public.job_type_parts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_type_id UUID REFERENCES public.job_types(id) ON DELETE CASCADE,
  part_template_id UUID REFERENCES public.part_templates(id) ON DELETE CASCADE,
  quantity_needed INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. **`part_templates` Table** (Missing)
```sql
-- NEEDED: Standard part definitions for Bill of Materials
CREATE TABLE public.part_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit TEXT DEFAULT 'each',
  estimated_cost DECIMAL(10, 2),
  supplier_recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ⚠️ **SCHEMA ISSUES TO FIX**

### 1. Profile Role Constraint
**Current Problem:**
```sql
role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'))
```

**Needs to be:**
```sql
role TEXT DEFAULT 'user' -- Remove check constraint to allow occupations
```

### 2. Job Type Mismatch
**Current:** Operational categories (delivery, pickup, service)
**Phase 1 Requires:** Business categories (Demand, Maintenance)

**Recommendation:** Keep current enum, add new `business_category` field

## 📋 **STEP 1 ACTION ITEMS**

### Immediate Fixes Needed:
1. **Fix role constraint** in profiles table
2. **Add missing Bill of Materials tables**
3. **Update job_locations** to support business categories
4. **Add foreign key relationships** for proper BoM structure

### Safe Additions (No Auth Conflicts):
- Add `job_types` table
- Add `part_templates` table  
- Add `job_type_parts` join table
- Add `business_category` to job_locations

### Database Changes Required:
```sql
-- 1. Fix profiles role constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Add business category to jobs
ALTER TABLE public.job_locations ADD COLUMN business_category TEXT 
CHECK (business_category IN ('Demand', 'Maintenance'));

-- 3. Add new BoM tables (see full definitions above)
```

## 🚨 **RISK ASSESSMENT**

### ⚠️ **HIGH RISK:**
- Changing role constraint (affects auth, test thoroughly)

### ✅ **LOW RISK:**
- Adding new tables (won't affect existing code)
- Adding new columns with defaults (backward compatible)

## 📊 **COMPLETION STATUS**

**Schema Foundation:** 60% Complete
- ✅ Core tables exist
- ✅ Auth integration works
- ❌ Bill of Materials structure missing
- ⚠️ Role constraint needs fix

**Next Steps:** Implement missing BoM tables and fix role constraint 