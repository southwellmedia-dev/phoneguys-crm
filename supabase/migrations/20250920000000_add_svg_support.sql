-- Add SVG support to device-images bucket
-- This migration updates the allowed mime types for the device-images bucket to include SVG files

UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/png', 
  'image/jpeg', 
  'image/jpg', 
  'image/webp', 
  'image/svg+xml'
]
WHERE name = 'device-images';

-- Verify the update
SELECT name, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'device-images';