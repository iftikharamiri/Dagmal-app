# Menu Upload Troubleshooting Guide

## Current Issues Identified

Based on the console errors, here are the main problems and solutions:

### 1. **Missing `menu_items` Table**
**Error**: `"Could not find the table 'public.menu_items' in the schema cache"`

**Solution**: Run the database migration
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and run the contents of `fix-menu-items-table.sql`
4. Verify the table was created successfully

### 2. **Missing `owner_id` Column**
**Error**: Restaurant queries failing because `owner_id` column doesn't exist

**Solution**: The migration script will add this column automatically, but if it fails:
```sql
ALTER TABLE restaurants ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
```

### 3. **Code Compatibility Issues**
**Problem**: Code assumes certain database structure exists

**Solution**: I've updated the code to handle missing columns gracefully with fallbacks.

## Step-by-Step Fix Process

### Step 1: Run Database Migration
```sql
-- Copy and paste this entire script into Supabase SQL Editor
-- (Contents of fix-menu-items-table.sql)
```

### Step 2: Verify Table Creation
After running the migration, check:
1. Go to Supabase Dashboard → Table Editor
2. Look for `menu_items` table
3. Verify it has all required columns

### Step 3: Test the Application
1. Refresh your browser (clear cache)
2. Try uploading a JSON file
3. Check browser console for errors

### Step 4: If Still Not Working
Run the test script to diagnose:
```bash
node test-database-connection.js
```

## Common Issues and Solutions

### Issue: "Table doesn't exist"
- **Cause**: Migration not run
- **Fix**: Run the SQL migration script

### Issue: "Permission denied"
- **Cause**: RLS policies blocking access
- **Fix**: Check if user is authenticated and has proper permissions

### Issue: "Column doesn't exist"
- **Cause**: Database schema mismatch
- **Fix**: Run the migration script or manually add missing columns

### Issue: "JSON parsing error"
- **Cause**: Invalid JSON format
- **Fix**: Validate JSON structure matches expected format

## Testing Your Setup

### 1. Test Database Connection
```javascript
// In browser console
const { data, error } = await supabase.from('restaurants').select('*').limit(1)
console.log('Restaurants:', data, 'Error:', error)
```

### 2. Test Menu Items Table
```javascript
// In browser console
const { data, error } = await supabase.from('menu_items').select('*').limit(1)
console.log('Menu items:', data, 'Error:', error)
```

### 3. Test JSON Upload
1. Use the sample JSON file provided
2. Try uploading through the UI
3. Check console for success/error messages

## Expected Behavior After Fix

1. ✅ JSON upload should work without errors
2. ✅ Menu items should be stored in database
3. ✅ Dish selection modal should load menu items
4. ✅ Deal creation should work with real menu data

## Still Having Issues?

If the problems persist after following these steps:

1. **Check Supabase Logs**: Go to Supabase Dashboard → Logs
2. **Verify Authentication**: Make sure user is logged in
3. **Check RLS Policies**: Ensure policies allow your user to access data
4. **Test with Simple Data**: Try uploading a minimal JSON file first

## Quick Fix Commands

### Reset and Recreate Everything
```sql
-- Drop and recreate menu_items table
DROP TABLE IF EXISTS menu_items CASCADE;
-- Then run the full migration script
```

### Add Missing Columns
```sql
-- Add owner_id if missing
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
```

### Check Table Structure
```sql
-- Verify menu_items table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'menu_items';
```




