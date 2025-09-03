-- Fix security issue: Update function to have proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, phone_number)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'phone_number'
  );
  RETURN NEW;
END;
$$;