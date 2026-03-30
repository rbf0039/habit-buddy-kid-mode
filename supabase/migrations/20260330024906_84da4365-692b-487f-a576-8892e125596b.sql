
CREATE OR REPLACE FUNCTION public.set_user_pin(new_pin text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  UPDATE profiles
  SET pin = crypt(new_pin, gen_salt('bf'))
  WHERE id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_user_pin(entered_pin text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
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
