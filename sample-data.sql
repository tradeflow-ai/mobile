-- Sample Data for TradeFlow Database
-- This version automatically uses the first user's ID from auth.users
-- Run this AFTER you've created your first user account through the app

-- =====================================================
-- SAMPLE INVENTORY ITEMS
-- =====================================================

-- First, let's create a temporary function to get the first user ID
DO $$
DECLARE
    first_user_id UUID;
    client_john_id UUID;
    client_maria_id UUID;
    client_bob_id UUID;
    client_sarah_id UUID;
    client_mike_id UUID;
    -- BoM variables
    jt_hvac_id UUID;
    jt_plumbing_id UUID;
    jt_electrical_id UUID;
    jt_emergency_id UUID;
    pt_filter_id UUID;
    pt_pipe_id UUID;
    pt_valve_id UUID;
    pt_gfci_id UUID;
    pt_wire_id UUID;
    pt_wrench_id UUID;
    pt_tape_id UUID;
BEGIN
    -- Get the first user ID from auth.users
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    -- Only insert sample data if we found a user
    IF first_user_id IS NOT NULL THEN
        
        INSERT INTO public.inventory_items (
          user_id,
          name,
          description,
          quantity,
          unit,
          category,
          status,
          min_quantity,
          cost_per_unit,
          supplier,
          notes
        ) VALUES
          (first_user_id, 'PVC Pipe 1/2"', 'Half-inch PVC pipe for plumbing', 25, 'feet', 'Plumbing', 'available', 10, 2.50, 'Home Depot', 'Standard white PVC'),
          (first_user_id, 'Copper Fittings', '3/4 inch copper elbow fittings', 3, 'each', 'Plumbing', 'low_stock', 5, 4.75, 'Ferguson', 'Need to reorder soon'),
          (first_user_id, 'Ball Valve 3/4"', 'Quarter-turn ball valve', 0, 'each', 'Plumbing', 'out_of_stock', 2, 12.50, 'Ferguson', 'Out of stock - priority reorder'),
          (first_user_id, 'Pipe Wrench', '14-inch pipe wrench', 8, 'each', 'Tools', 'available', 2, 35.00, 'Ridgid', 'Heavy duty'),
          (first_user_id, 'Air Filter 16x20', 'HVAC air filter 16x20x1', 12, 'each', 'HVAC', 'available', 5, 8.99, 'Filtrete', 'MERV 11 rating'),
          (first_user_id, 'Thermostat Digital', 'Programmable digital thermostat', 2, 'each', 'HVAC', 'available', 1, 89.99, 'Honeywell', 'WiFi enabled'),
          (first_user_id, 'Duct Tape', 'Professional grade duct tape', 15, 'roll', 'General', 'available', 5, 12.99, '3M', 'Silver, 2 inch wide'),
          (first_user_id, 'Wire 12 AWG', 'Electrical wire 12 gauge', 0, 'feet', 'Electrical', 'out_of_stock', 50, 0.85, 'Southwire', 'Need for upcoming job'),
          (first_user_id, 'Outlet GFCI', 'Ground fault circuit interrupter outlet', 6, 'each', 'Electrical', 'available', 3, 24.99, 'Leviton', 'White, tamper resistant'),
          (first_user_id, 'Circuit Breaker 20A', '20 amp single pole breaker', 1, 'each', 'Electrical', 'low_stock', 2, 18.50, 'Square D', 'QO series'),
          (first_user_id, 'Wire Nuts', 'Twist-on wire connectors', 45, 'each', 'Electrical', 'available', 20, 0.15, 'Ideal', 'Assorted sizes');

        -- =====================================================
        -- SAMPLE CLIENTS
        -- =====================================================

        INSERT INTO public.clients (
          user_id,
          name,
          email,
          phone,
          company_name,
          address,
          city,
          state,
          zip_code,
          contact_person,
          business_type,
          preferred_contact_method,
          notes
        ) VALUES
          (first_user_id, 'John Smith', 'john.smith@buildingco.com', '(555) 123-4567', 'Downtown Building Management', '123 Market Street', 'San Francisco', 'CA', '94103', 'John Smith', 'Commercial', 'email', 'Regular HVAC maintenance client'),
          (first_user_id, 'Maria Garcia', 'maria.garcia@residentialcomplex.com', '(555) 234-5678', 'Oakwood Residential Complex', '456 Oak Avenue', 'San Francisco', 'CA', '94102', 'Maria Garcia', 'Residential', 'phone', 'Property manager for 200-unit complex'),
          (first_user_id, 'Bob Wilson', 'bob.wilson@industrialcorp.com', '(555) 345-6789', 'Industrial Corp', '789 Industrial Drive', 'San Francisco', 'CA', '94107', 'Bob Wilson', 'Industrial', 'email', 'Warehouse and factory maintenance'),
          (first_user_id, 'Sarah Johnson', 'sarah@techstartup.com', '(555) 456-7890', 'Tech Startup Inc', '321 Mission Street', 'San Francisco', 'CA', '94105', 'Sarah Johnson', 'Commercial', 'text', 'Fast-growing tech company'),
          (first_user_id, 'Mike Chen', 'mike.chen@coffeeshop.com', '(555) 567-8901', 'Valencia Coffee Co', '555 Valencia Street', 'San Francisco', 'CA', '94110', 'Mike Chen', 'Retail', 'phone', 'Local coffee shop chain');

        -- =====================================================
        -- SAMPLE JOB LOCATIONS
        -- =====================================================

        -- Get client IDs for job associations
        SELECT id INTO client_john_id FROM public.clients WHERE user_id = first_user_id AND name = 'John Smith';
        SELECT id INTO client_maria_id FROM public.clients WHERE user_id = first_user_id AND name = 'Maria Garcia';
        SELECT id INTO client_bob_id FROM public.clients WHERE user_id = first_user_id AND name = 'Bob Wilson';
        SELECT id INTO client_sarah_id FROM public.clients WHERE user_id = first_user_id AND name = 'Sarah Johnson';
        SELECT id INTO client_mike_id FROM public.clients WHERE user_id = first_user_id AND name = 'Mike Chen';

            INSERT INTO public.job_locations (
              user_id,
              client_id,
              title,
              description,
              job_type,
              priority,
              status,
              latitude,
              longitude,
              address,
              city,
              state,
              zip_code,
              scheduled_date,
              estimated_duration,
              customer_name,
              customer_phone,
              instructions
            ) VALUES
              (first_user_id, client_john_id, 'Downtown Office Building', 'HVAC maintenance and filter replacement', 'service', 'high', 'scheduled', 37.7749, -122.4194, '123 Market Street', 'San Francisco', 'CA', '94103', '2024-02-15 09:00:00+00', 120, 'John Smith', '(555) 123-4567', 'Check all units on floors 3-5, replace filters'),
              
              (first_user_id, client_maria_id, 'Residential Complex', 'Plumbing repair - leaky faucet in unit 4B', 'service', 'medium', 'pending', 37.7849, -122.4094, '456 Oak Avenue', 'San Francisco', 'CA', '94102', '2024-02-15 11:30:00+00', 90, 'Maria Garcia', '(555) 234-5678', 'Tenant reports dripping kitchen faucet'),
              
              (first_user_id, client_bob_id, 'Industrial Warehouse', 'Electrical inspection and outlet installation', 'inspection', 'high', 'pending', 37.7649, -122.4294, '789 Industrial Drive', 'San Francisco', 'CA', '94107', '2024-02-15 14:00:00+00', 180, 'Bob Wilson', '(555) 345-6789', 'Need to install GFCI outlets in wet areas'),
              
              (first_user_id, client_sarah_id, 'Tech Startup Office', 'Equipment pickup and disposal', 'pickup', 'low', 'pending', 37.7549, -122.4394, '321 Mission Street', 'San Francisco', 'CA', '94105', '2024-02-15 16:00:00+00', 60, 'Sarah Johnson', '(555) 456-7890', 'Old server equipment for recycling'),
              
              (first_user_id, client_mike_id, 'Coffee Shop', 'Emergency plumbing - burst pipe', 'emergency', 'urgent', 'in_progress', 37.7449, -122.4194, '555 Valencia Street', 'San Francisco', 'CA', '94110', '2024-02-14 08:00:00+00', 240, 'Mike Chen', '(555) 567-8901', 'Water main break in basement, urgent!');

        -- =====================================================
        -- SAMPLE JOB TYPES (Bill of Materials)
        -- =====================================================

        INSERT INTO public.job_types (
          user_id,
          name,
          description,
          category,
          estimated_duration,
          default_priority,
          labor_rate,
          instructions,
          safety_notes
        ) VALUES
          (first_user_id, 'HVAC Maintenance', 'Regular HVAC system maintenance and filter replacement', 'hvac', 120, 'medium', 85.00, 'Check all units, replace filters, inspect ductwork, test thermostat calibration', 'Turn off power before servicing. Check for gas leaks.'),
          (first_user_id, 'Plumbing Repair', 'Standard plumbing repair work including leaks and clogs', 'plumbing', 90, 'medium', 95.00, 'Diagnose issue, shut off water if needed, repair or replace components, test for leaks', 'Always shut off water supply before starting work.'),
          (first_user_id, 'Electrical Inspection', 'Safety inspection of electrical systems and installations', 'electrical', 180, 'high', 105.00, 'Check all outlets, test GFCI functionality, inspect panel, verify grounding', 'TURN OFF POWER at breaker. Use proper PPE. Test circuits before touching.'),
          (first_user_id, 'Equipment Pickup', 'Collection and disposal of old equipment', 'general', 60, 'low', 65.00, 'Safely disconnect and remove equipment, transport to disposal facility', 'Use proper lifting techniques. Check for hazardous materials.'),
          (first_user_id, 'Emergency Plumbing', 'Urgent plumbing repairs for leaks and bursts', 'plumbing', 240, 'urgent', 125.00, 'Assess damage, stop water flow, implement temporary fix, plan permanent repair', 'Safety first - check for electrical hazards around water.');

        -- =====================================================
        -- SAMPLE PART TEMPLATES (Bill of Materials)
        -- =====================================================

        INSERT INTO public.part_templates (
          user_id,
          name,
          description,
          part_number,
          category,
          unit,
          estimated_cost,
          preferred_supplier,
          specifications,
          is_common
        ) VALUES
          (first_user_id, 'HVAC Filter 16x20', 'Standard HVAC air filter', 'FILT-16X20-M11', 'HVAC', 'each', 8.99, 'Filtrete', 'MERV 11 rating, pleated', true),
          (first_user_id, 'PVC Pipe 1/2 inch', 'Half-inch PVC pipe for plumbing', 'PVC-12-10FT', 'Plumbing', 'feet', 2.50, 'Home Depot', 'Schedule 40 PVC, white', true),
          (first_user_id, 'Ball Valve 3/4 inch', 'Quarter-turn ball valve', 'BV-34-QT', 'Plumbing', 'each', 12.50, 'Ferguson', '3/4 inch NPT threads, brass', false),
          (first_user_id, 'GFCI Outlet', 'Ground fault circuit interrupter outlet', 'GFCI-15A-WH', 'Electrical', 'each', 24.99, 'Leviton', '15A, tamper resistant, white', true),
          (first_user_id, 'Wire 12 AWG', 'Electrical wire 12 gauge', 'WIRE-12AWG-CU', 'Electrical', 'feet', 0.85, 'Southwire', 'Copper, THHN insulation', true),
          (first_user_id, 'Pipe Wrench 14 inch', 'Heavy duty pipe wrench', 'PW-14-HD', 'Tools', 'each', 35.00, 'Ridgid', 'Cast iron construction', false),
          (first_user_id, 'Duct Tape', 'Professional grade duct tape', 'DT-2IN-SV', 'General', 'roll', 12.99, '3M', '2 inch wide, silver', true);

        -- =====================================================
        -- SAMPLE BILL OF MATERIALS (Job Type Parts)
        -- =====================================================

        -- Get job type IDs
        SELECT id INTO jt_hvac_id FROM public.job_types WHERE user_id = first_user_id AND name = 'HVAC Maintenance';
        SELECT id INTO jt_plumbing_id FROM public.job_types WHERE user_id = first_user_id AND name = 'Plumbing Repair';
        SELECT id INTO jt_electrical_id FROM public.job_types WHERE user_id = first_user_id AND name = 'Electrical Inspection';
        SELECT id INTO jt_emergency_id FROM public.job_types WHERE user_id = first_user_id AND name = 'Emergency Plumbing';

        -- Get part template IDs
        SELECT id INTO pt_filter_id FROM public.part_templates WHERE user_id = first_user_id AND name = 'HVAC Filter 16x20';
        SELECT id INTO pt_pipe_id FROM public.part_templates WHERE user_id = first_user_id AND name = 'PVC Pipe 1/2 inch';
        SELECT id INTO pt_valve_id FROM public.part_templates WHERE user_id = first_user_id AND name = 'Ball Valve 3/4 inch';
        SELECT id INTO pt_gfci_id FROM public.part_templates WHERE user_id = first_user_id AND name = 'GFCI Outlet';
        SELECT id INTO pt_wire_id FROM public.part_templates WHERE user_id = first_user_id AND name = 'Wire 12 AWG';
        SELECT id INTO pt_wrench_id FROM public.part_templates WHERE user_id = first_user_id AND name = 'Pipe Wrench 14 inch';
        SELECT id INTO pt_tape_id FROM public.part_templates WHERE user_id = first_user_id AND name = 'Duct Tape';

        -- Create Bill of Materials associations
        INSERT INTO public.job_type_parts (
          user_id,
          job_type_id,
          part_template_id,
          quantity_needed,
          is_required,
          notes
        ) VALUES
          -- HVAC Maintenance BoM
          (first_user_id, jt_hvac_id, pt_filter_id, 2.0, true, 'Typically need 2 filters per system'),
          (first_user_id, jt_hvac_id, pt_tape_id, 1.0, false, 'For minor duct repairs'),
          
          -- Plumbing Repair BoM
          (first_user_id, jt_plumbing_id, pt_pipe_id, 5.0, false, 'For pipe replacements'),
          (first_user_id, jt_plumbing_id, pt_valve_id, 1.0, false, 'If valve replacement needed'),
          (first_user_id, jt_plumbing_id, pt_wrench_id, 1.0, true, 'Required tool for most repairs'),
          (first_user_id, jt_plumbing_id, pt_tape_id, 1.0, true, 'For temporary sealing'),
          
          -- Electrical Inspection BoM
          (first_user_id, jt_electrical_id, pt_gfci_id, 2.0, false, 'For wet area upgrades'),
          (first_user_id, jt_electrical_id, pt_wire_id, 10.0, false, 'For wiring repairs'),
          
          -- Emergency Plumbing BoM
          (first_user_id, jt_emergency_id, pt_pipe_id, 10.0, true, 'Emergency pipe replacement'),
          (first_user_id, jt_emergency_id, pt_valve_id, 2.0, true, 'Shut-off valves'),
          (first_user_id, jt_emergency_id, pt_wrench_id, 1.0, true, 'Essential tool'),
          (first_user_id, jt_emergency_id, pt_tape_id, 2.0, true, 'Emergency sealing');

        RAISE NOTICE 'Sample data inserted successfully for user: %', first_user_id;
        
    ELSE
        RAISE NOTICE 'No users found. Please create a user account first through the app, then run this script.';
    END IF;
END $$;

-- =====================================================
-- SAMPLE ROUTE
-- =====================================================

-- First, get the job location IDs (you'll need to run this query first to get actual IDs)
-- SELECT id, title FROM public.job_locations WHERE user_id = 'your-user-id-here';

-- Then insert a sample route (you'll need to replace the UUIDs with actual job location IDs)
/*
INSERT INTO public.routes (
  user_id,
  name,
  description,
  status,
  job_location_ids,
  total_distance,
  estimated_time,
  planned_date
) VALUES
  ('your-user-id-here', 'Daily Route - February 15', 'Scheduled jobs for Thursday', 'planned', 
   ARRAY['job-location-id-1', 'job-location-id-2', 'job-location-id-3', 'job-location-id-4']::UUID[], 
   25.5, 450, '2024-02-15');
*/

-- =====================================================
-- SAMPLE INVENTORY MOVEMENTS
-- =====================================================

-- Track some inventory usage (replace the IDs with actual inventory item IDs)
/*
INSERT INTO public.inventory_movements (
  user_id,
  inventory_item_id,
  movement_type,
  quantity_change,
  previous_quantity,
  new_quantity,
  reason,
  notes
) VALUES
  ('your-user-id-here', 'inventory-item-id-1', 'stock_out', -2, 25, 23, 'Used for job', 'Downtown office building HVAC job'),
  ('your-user-id-here', 'inventory-item-id-2', 'stock_in', 10, 3, 13, 'Restocked', 'Weekly inventory delivery');
*/

-- =====================================================
-- USEFUL QUERIES FOR TESTING
-- =====================================================

-- Check your user ID:
-- SELECT id, email FROM auth.users;

-- View your inventory:
-- SELECT * FROM public.inventory_items WHERE user_id = 'your-user-id-here';

-- View your jobs:
-- SELECT * FROM public.job_locations WHERE user_id = 'your-user-id-here';

-- View low stock items:
-- SELECT name, quantity, min_quantity FROM public.inventory_items 
-- WHERE user_id = 'your-user-id-here' AND quantity <= min_quantity;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

/*
TO USE THIS SAMPLE DATA:

1. First, create an account in your app and sign in
2. Go to Supabase dashboard > SQL Editor
3. Run this query to get your user ID:
   SELECT id, email FROM auth.users;
4. Copy your user ID
5. Replace all instances of 'your-user-id-here' in this file with your actual user ID
6. Run the modified SQL in the SQL Editor
7. Test your app - you should see the sample data!
*/ 