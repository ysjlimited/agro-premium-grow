
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'md', 'supervisor', 'officer');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by all signed-in" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_md(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','md'))
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin_or_md(auth.uid()));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin_or_md(auth.uid())) WITH CHECK (public.is_admin_or_md(auth.uid()));

-- Auto-create profile + bootstrap first user as admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));

  SELECT COUNT(*) INTO v_count FROM public.user_roles;
  IF v_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'officer');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Daily logs
CREATE TABLE public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift TEXT NOT NULL DEFAULT 'morning',
  house_id TEXT NOT NULL,
  opening_stock INT NOT NULL DEFAULT 0,
  mortality INT NOT NULL DEFAULT 0,
  birds_harvested INT NOT NULL DEFAULT 0,
  feed_bags NUMERIC(10,2) NOT NULL DEFAULT 0,
  water_liters NUMERIC(10,2) NOT NULL DEFAULT 0,
  weight_sample_g NUMERIC(10,2),
  expenses NUMERIC(12,2) NOT NULL DEFAULT 0,
  sales NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  supervisor_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_logs TO authenticated;
GRANT ALL ON public.daily_logs TO service_role;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officer view own, supervisors+ view all" ON public.daily_logs FOR SELECT TO authenticated
USING (
  auth.uid() = officer_id
  OR public.has_role(auth.uid(),'supervisor')
  OR public.is_admin_or_md(auth.uid())
);
CREATE POLICY "Officers insert own logs" ON public.daily_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = officer_id);
CREATE POLICY "Officer edit own, supervisors+ edit all" ON public.daily_logs FOR UPDATE TO authenticated
USING (
  auth.uid() = officer_id
  OR public.has_role(auth.uid(),'supervisor')
  OR public.is_admin_or_md(auth.uid())
);
CREATE POLICY "Supervisors+ delete logs" ON public.daily_logs FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'supervisor') OR public.is_admin_or_md(auth.uid()));

CREATE TRIGGER daily_logs_updated BEFORE UPDATE ON public.daily_logs
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Weekly summaries
CREATE TABLE public.weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  house_id TEXT,
  total_mortality INT NOT NULL DEFAULT 0,
  total_feed_bags NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_harvested INT NOT NULL DEFAULT 0,
  total_sales NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(12,2) NOT NULL DEFAULT 0,
  avg_weight_g NUMERIC(10,2),
  fcr NUMERIC(10,3),
  ai_insight TEXT,
  supervisor_comment TEXT,
  compiled_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_summaries TO authenticated;
GRANT ALL ON public.weekly_summaries TO service_role;
ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All signed-in view summaries" ON public.weekly_summaries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Supervisors+ insert summaries" ON public.weekly_summaries FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'supervisor') OR public.is_admin_or_md(auth.uid()));
CREATE POLICY "Supervisors+ update summaries" ON public.weekly_summaries FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'supervisor') OR public.is_admin_or_md(auth.uid()));
CREATE POLICY "Admins+ delete summaries" ON public.weekly_summaries FOR DELETE TO authenticated
USING (public.is_admin_or_md(auth.uid()));

CREATE TRIGGER weekly_summaries_updated BEFORE UPDATE ON public.weekly_summaries
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- AI conversations
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own conversations" ON public.ai_conversations FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own messages via conversation" ON public.ai_messages FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-- Also allow admins/MDs to view submission tables
CREATE POLICY "Admins view contact submissions" ON public.contact_submissions FOR SELECT TO authenticated
USING (public.is_admin_or_md(auth.uid()) OR public.has_role(auth.uid(),'supervisor'));
CREATE POLICY "Admins view newsletter subs" ON public.newsletter_subscriptions FOR SELECT TO authenticated
USING (public.is_admin_or_md(auth.uid()) OR public.has_role(auth.uid(),'supervisor'));
