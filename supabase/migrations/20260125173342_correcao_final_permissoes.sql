-- Migração dos admins antigos para user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'
FROM public.profiles
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update" ON public.users;
DROP POLICY IF EXISTS "Admins can view all" ON public.users;
DROP POLICY IF EXISTS "Users can see own data" ON public.users;
DROP POLICY IF EXISTS "Public view" ON public.users;
DROP POLICY IF EXISTS "Admin Select" ON public.users;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
DROP POLICY IF EXISTS "Hero Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Hero Admin Upload" ON storage.objects;
DROP POLICY IF EXISTS "Give me access" ON storage.objects;

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, 
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role)
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ordem SERIAL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS imagem_principal TEXT;

INSERT INTO storage.buckets (id, name, public) VALUES ('hero-images', 'hero-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.user_roles;
CREATE POLICY "Public read access" ON public.user_roles FOR SELECT USING (true);

CREATE POLICY "Users see own" ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins view all" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins update all" ON public.users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public view products" ON public.products FOR SELECT USING (true);

CREATE POLICY "Admins manage products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public Storage Access" ON storage.objects FOR SELECT USING ( bucket_id IN ('products', 'hero-images') );

CREATE POLICY "Admin Storage Insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id IN ('products', 'hero-images') AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin Storage Delete" ON storage.objects FOR DELETE USING (
  bucket_id IN ('products', 'hero-images') AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);