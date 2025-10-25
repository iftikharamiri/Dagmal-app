-- Create storage bucket for restaurant images
-- Run this in Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-images', 'restaurant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'restaurant-images' );

CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'restaurant-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update own restaurant images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'restaurant-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can delete own restaurant images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'restaurant-images' AND auth.role() = 'authenticated' );
