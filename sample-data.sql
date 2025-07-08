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
        -- SAMPLE JOB LOCATIONS
        -- =====================================================

        INSERT INTO public.job_locations (
          user_id,
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
          (first_user_id, 'Downtown Office Building', 'HVAC maintenance and filter replacement', 'service', 'high', 'scheduled', 37.7749, -122.4194, '123 Market Street', 'San Francisco', 'CA', '94103', '2024-02-15 09:00:00+00', 120, 'John Smith', '(555) 123-4567', 'Check all units on floors 3-5, replace filters'),
          
          (first_user_id, 'Residential Complex', 'Plumbing repair - leaky faucet in unit 4B', 'service', 'medium', 'pending', 37.7849, -122.4094, '456 Oak Avenue', 'San Francisco', 'CA', '94102', '2024-02-15 11:30:00+00', 90, 'Maria Garcia', '(555) 234-5678', 'Tenant reports dripping kitchen faucet'),
          
          (first_user_id, 'Industrial Warehouse', 'Electrical inspection and outlet installation', 'inspection', 'high', 'pending', 37.7649, -122.4294, '789 Industrial Drive', 'San Francisco', 'CA', '94107', '2024-02-15 14:00:00+00', 180, 'Bob Wilson', '(555) 345-6789', 'Need to install GFCI outlets in wet areas'),
          
          (first_user_id, 'Tech Startup Office', 'Equipment pickup and disposal', 'pickup', 'low', 'pending', 37.7549, -122.4394, '321 Mission Street', 'San Francisco', 'CA', '94105', '2024-02-15 16:00:00+00', 60, 'Sarah Johnson', '(555) 456-7890', 'Old server equipment for recycling'),
          
          (first_user_id, 'Coffee Shop', 'Emergency plumbing - burst pipe', 'emergency', 'urgent', 'in_progress', 37.7449, -122.4194, '555 Valencia Street', 'San Francisco', 'CA', '94110', '2024-02-14 08:00:00+00', 240, 'Mike Chen', '(555) 567-8901', 'Water main break in basement, urgent!');

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