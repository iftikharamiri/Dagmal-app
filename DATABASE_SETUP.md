# Database Setup Instructions

## Menu Items Table Setup

The complete menu upload feature requires a `menu_items` table in your Supabase database. Follow these steps to set it up:

### 1. Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project: `nrutsewxzbtysbskaabd`

### 2. Create the Menu Items Table
1. Go to the **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy and paste the contents of `create_menu_items_table.sql`
4. Click **Run** to execute the SQL

### 3. Verify the Table
1. Go to **Table Editor** in your Supabase dashboard
2. You should see a new table called `menu_items`
3. The table should have the following columns:
   - `id` (UUID, Primary Key)
   - `restaurant_id` (UUID, Foreign Key to restaurants)
   - `name` (Text)
   - `description` (Text, nullable)
   - `price` (Integer - price in øre)
   - `category` (Text, nullable)
   - `dietary_info` (Text array)
   - `image_url` (Text, nullable)
   - `is_available` (Boolean)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

### 4. Test the Feature
1. Go back to your application
2. Navigate to the restaurant dashboard
3. Try uploading a complete menu JSON file
4. Check the browser console for detailed logs

## Troubleshooting

### Error: "Menu items table not available"
- Make sure you've run the SQL script in Supabase
- Check that the table was created successfully
- Verify you're using the correct Supabase project

### Error: "Permission denied"
- The RLS policies should allow restaurant owners to manage their menu items
- Make sure you're logged in as a restaurant owner
- Check that the restaurant record has the correct `owner_id`

### Error: "Invalid JSON format"
- Make sure your JSON file follows the correct schema
- Use the sample menu provided in the upload modal
- Check that all required fields are present

## Sample Menu JSON

You can download a sample menu JSON from the upload modal to see the expected format.

## Support

If you continue to have issues, check the browser console for detailed error messages and contact support with the specific error details.







