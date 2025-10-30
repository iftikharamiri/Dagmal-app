-- Check and fix storage bucket setup
-- Run this in your Supabase SQL Editor

-- First, let's check if the bucket exists
SELECT * FROM storage.buckets WHERE id = 'restaurant-images';

-- If the above query returns no results, create the bucket:
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-images', 'restaurant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Check existing policies (this will show you what policies already exist)
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Only create policies if they don't exist (using IF NOT EXISTS equivalent)
DO $$
BEGIN
    -- Create Public Access policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access'
    ) THEN
        CREATE POLICY "Public Access"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'restaurant-images' );
    END IF;

    -- Create upload policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated users can upload images'
    ) THEN
        CREATE POLICY "Authenticated users can upload images"
        ON storage.objects FOR INSERT
        WITH CHECK ( bucket_id = 'restaurant-images' AND auth.role() = 'authenticated' );
    END IF;

    -- Create update policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Users can update own restaurant images'
    ) THEN
        CREATE POLICY "Users can update own restaurant images"
        ON storage.objects FOR UPDATE
        USING ( bucket_id = 'restaurant-images' AND auth.role() = 'authenticated' );
    END IF;

    -- Create delete policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Users can delete own restaurant images'
    ) THEN
        CREATE POLICY "Users can delete own restaurant images"
        ON storage.objects FOR DELETE
        USING ( bucket_id = 'restaurant-images' AND auth.role() = 'authenticated' );
    END IF;
END $$;

-- Verify the setup
SELECT 'Bucket exists:' as check_type, count(*) as result 
FROM storage.buckets WHERE id = 'restaurant-images'
UNION ALL
SELECT 'Policies exist:', count(*) 
FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%restaurant%';






















