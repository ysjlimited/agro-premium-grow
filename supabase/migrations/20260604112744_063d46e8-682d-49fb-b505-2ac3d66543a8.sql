
-- 1. Main admin email check
CREATE OR REPLACE FUNCTION public.is_main_admin_email(_email text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(_email) = 'adeagbojohnluj@gmail.com'
$$;

-- 2. Replace handle_new_user: only main admin email gets admin, others get officer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));

  IF public.is_main_admin_email(NEW.email) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'officer')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Strip admin/md from anyone but the main admin
DELETE FROM public.user_roles
WHERE role IN ('admin','md')
  AND user_id NOT IN (
    SELECT id FROM auth.users WHERE lower(email) = 'adeagbojohnluj@gmail.com'
  );

-- 4. Promote main admin if they already exist
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE lower(email) = 'adeagbojohnluj@gmail.com'
ON CONFLICT DO NOTHING;

-- 5. Batches table
CREATE TABLE IF NOT EXISTS public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  breed text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  bird_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.batches TO authenticated;
GRANT ALL ON public.batches TO service_role;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in view batches" ON public.batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert batches" ON public.batches FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update batches" ON public.batches FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete batches" ON public.batches FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER batches_touch BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6. Stock items table
CREATE TABLE IF NOT EXISTS public.stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'feed',
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'bag',
  reorder_level numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_items TO authenticated;
GRANT ALL ON public.stock_items TO service_role;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in view stock" ON public.stock_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert stock" ON public.stock_items FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update stock" ON public.stock_items FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete stock" ON public.stock_items FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER stock_items_touch BEFORE UPDATE ON public.stock_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 7. Daily logs: add photo_url and batch_id
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id) ON DELETE SET NULL;

-- 8. Replace daily_logs policies → admin-only writes, all signed-in can view
DROP POLICY IF EXISTS "Officer edit own, supervisors+ edit all" ON public.daily_logs;
DROP POLICY IF EXISTS "Officer view own, supervisors+ view all" ON public.daily_logs;
DROP POLICY IF EXISTS "Officers insert own logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Supervisors+ delete logs" ON public.daily_logs;

CREATE POLICY "Signed-in view logs" ON public.daily_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert logs" ON public.daily_logs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update logs" ON public.daily_logs FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete logs" ON public.daily_logs FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- 9. Storage policies on farm-photos
CREATE POLICY "farm-photos signed-in read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'farm-photos');
CREATE POLICY "farm-photos admin upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'farm-photos' AND has_role(auth.uid(),'admin'));
CREATE POLICY "farm-photos admin update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'farm-photos' AND has_role(auth.uid(),'admin'));
CREATE POLICY "farm-photos admin delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'farm-photos' AND has_role(auth.uid(),'admin'));
