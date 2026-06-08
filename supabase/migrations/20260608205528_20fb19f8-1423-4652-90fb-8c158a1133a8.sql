
-- 1. Fix mutable search_path on functions
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.is_main_admin_email(_email text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $function$
  SELECT lower(_email) = 'adeagbojohnluj@gmail.com'
$function$;

-- 2. Revoke EXECUTE on trigger-only SECURITY DEFINER function from API roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- is_main_admin_email and touch_updated_at don't need API exposure either
REVOKE EXECUTE ON FUNCTION public.is_main_admin_email(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- has_role and is_admin_or_md are used by RLS policies and must remain executable.
-- They are SECURITY DEFINER with fixed search_path and only read user_roles, which is safe.

-- 3. Replace overly-permissive WITH CHECK (true) on public submission forms
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(name)) BETWEEN 1 AND 200
  AND length(trim(email)) BETWEEN 3 AND 320
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(trim(subject)) BETWEEN 1 AND 300
  AND length(trim(message)) BETWEEN 1 AND 5000
  AND (phone IS NULL OR length(phone) <= 50)
);

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscriptions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(email)) BETWEEN 3 AND 320
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);
