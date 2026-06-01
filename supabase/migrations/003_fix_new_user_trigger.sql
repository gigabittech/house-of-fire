-- House of Fire — Fix handle_new_user trigger
-- The original function referenced `profiles` unqualified and had no explicit
-- search_path, so when Supabase's auth system invoked it (SECURITY DEFINER)
-- the table failed to resolve and aborted signup with
-- "Database error creating new user". This hardens it.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_handle text;
  final_handle text;
  counter integer := 0;
BEGIN
  base_handle := lower(regexp_replace(
    coalesce(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    '[^a-z0-9_]', '', 'g'
  ));
  IF length(base_handle) < 2 THEN base_handle := 'user'; END IF;
  final_handle := base_handle;
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE handle = final_handle);
    counter := counter + 1;
    final_handle := base_handle || counter;
  END LOOP;

  INSERT INTO public.profiles (id, handle, display_name)
  VALUES (
    NEW.id,
    final_handle,
    coalesce(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block auth signup if profile creation hiccups.
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;
