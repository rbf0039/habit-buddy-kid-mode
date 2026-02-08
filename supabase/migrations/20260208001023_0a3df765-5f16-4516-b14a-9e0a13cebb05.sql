-- Create storage bucket for child avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('child-avatars', 'child-avatars', true);

-- Allow authenticated users to upload avatars for their children
CREATE POLICY "Parents can upload child avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'child-avatars' 
  AND auth.uid() IS NOT NULL
);

-- Allow public access to view avatars
CREATE POLICY "Anyone can view child avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'child-avatars');

-- Allow parents to update their children's avatars
CREATE POLICY "Parents can update child avatars"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'child-avatars' AND auth.uid() IS NOT NULL);

-- Allow parents to delete their children's avatars
CREATE POLICY "Parents can delete child avatars"
ON storage.objects
FOR DELETE
USING (bucket_id = 'child-avatars' AND auth.uid() IS NOT NULL);