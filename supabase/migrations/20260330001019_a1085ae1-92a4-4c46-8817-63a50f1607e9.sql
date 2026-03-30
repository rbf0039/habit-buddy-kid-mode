
-- 1. Enable pgcrypto for PIN hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create a secure function to set a hashed PIN
CREATE OR REPLACE FUNCTION public.set_user_pin(new_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET pin = crypt(new_pin, gen_salt('bf'))
  WHERE id = auth.uid();
END;
$$;

-- 3. Create a secure function to verify a PIN (returns boolean, never exposes hash)
CREATE OR REPLACE FUNCTION public.verify_user_pin(entered_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_pin text;
BEGIN
  SELECT pin INTO stored_pin FROM profiles WHERE id = auth.uid();
  IF stored_pin IS NULL THEN
    RETURN false;
  END IF;
  RETURN stored_pin = crypt(entered_pin, stored_pin);
END;
$$;

-- 4. Create a function to check if user has a PIN set
CREATE OR REPLACE FUNCTION public.has_user_pin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_pin text;
BEGIN
  SELECT pin INTO stored_pin FROM profiles WHERE id = auth.uid();
  RETURN stored_pin IS NOT NULL;
END;
$$;

-- 5. Add badges UPDATE and DELETE policies
CREATE POLICY "Parents can update badges for their children"
ON public.badges
FOR UPDATE
TO public
USING (EXISTS (
  SELECT 1 FROM children
  WHERE children.id = badges.child_id AND children.parent_id = auth.uid()
));

CREATE POLICY "Parents can delete badges for their children"
ON public.badges
FOR DELETE
TO public
USING (EXISTS (
  SELECT 1 FROM children
  WHERE children.id = badges.child_id AND children.parent_id = auth.uid()
));

-- 6. Fix storage policies - drop old weak policies and create ownership-based ones
-- Drop existing storage policies for child-avatars
DROP POLICY IF EXISTS "Anyone can view child avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload child avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update child avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete child avatars" ON storage.objects;

-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'child-avatars';

-- Create new ownership-scoped storage policies
CREATE POLICY "Parents can view their own child avatars"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'child-avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Parents can upload their own child avatars"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'child-avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Parents can update their own child avatars"
ON storage.objects FOR UPDATE
TO public
USING (
  bucket_id = 'child-avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Parents can delete their own child avatars"
ON storage.objects FOR DELETE
TO public
USING (
  bucket_id = 'child-avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
