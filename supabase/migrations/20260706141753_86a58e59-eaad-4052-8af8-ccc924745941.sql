
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'business_owner', 'user');
CREATE TYPE public.gathering_status AS ENUM ('proposed', 'approved', 'cancelled');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are public readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Businesses
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.businesses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Businesses public read" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Owners manage business" ON public.businesses FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Venue tables
CREATE TABLE public.venue_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 4 CHECK (capacity > 0 AND capacity <= 50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.venue_tables TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.venue_tables TO authenticated;
GRANT ALL ON public.venue_tables TO service_role;
ALTER TABLE public.venue_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tables public read" ON public.venue_tables FOR SELECT USING (true);
CREATE POLICY "Business owners manage tables" ON public.venue_tables FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

-- Gatherings
CREATE TABLE public.gatherings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES public.venue_tables(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  seats INT NOT NULL DEFAULT 4 CHECK (seats > 0 AND seats <= 50),
  status gathering_status NOT NULL DEFAULT 'proposed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gatherings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gatherings TO authenticated;
GRANT ALL ON public.gatherings TO service_role;
ALTER TABLE public.gatherings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved gatherings public read" ON public.gatherings FOR SELECT USING (status = 'approved');
CREATE POLICY "Host reads own" ON public.gatherings FOR SELECT TO authenticated USING (host_id = auth.uid());
CREATE POLICY "Business owner reads own" ON public.gatherings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));
CREATE POLICY "Users propose gatherings" ON public.gatherings FOR INSERT TO authenticated
  WITH CHECK (host_id = auth.uid() AND status = 'proposed');
CREATE POLICY "Host or owner update" ON public.gatherings FOR UPDATE TO authenticated
  USING (host_id = auth.uid() OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()))
  WITH CHECK (host_id = auth.uid() OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));
CREATE POLICY "Host or owner delete" ON public.gatherings FOR DELETE TO authenticated
  USING (host_id = auth.uid() OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

-- Attendees
CREATE TABLE public.gathering_attendees (
  gathering_id UUID NOT NULL REFERENCES public.gatherings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (gathering_id, user_id)
);
GRANT SELECT ON public.gathering_attendees TO anon;
GRANT SELECT, INSERT, DELETE ON public.gathering_attendees TO authenticated;
GRANT ALL ON public.gathering_attendees TO service_role;
ALTER TABLE public.gathering_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attendees public read" ON public.gathering_attendees FOR SELECT USING (true);
CREATE POLICY "Users join" ON public.gathering_attendees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users leave" ON public.gathering_attendees FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_gatherings_starts_at ON public.gatherings(starts_at);
CREATE INDEX idx_gatherings_business ON public.gatherings(business_id);
CREATE INDEX idx_tables_business ON public.venue_tables(business_id);
