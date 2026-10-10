-- Garante que a tabela de perfis (profiles) exista
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome_completo TEXT,
  telefone TEXT,
  cpf TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  avatar_url TEXT,
  subscription_status VARCHAR(50) DEFAULT 'active',
  blocked_at TIMESTAMP WITH TIME ZONE,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garante que as colunas existam (idempotente)
DO $$
BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefone TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS endereco TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cidade TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS estado TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cep TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nome_completo TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE;
END $$;

-- Habilita RLS (Segurança a Nível de Linha)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso (Policies)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Service role full access" ON public.profiles;
CREATE POLICY "Service role full access" ON public.profiles FOR ALL USING (auth.role() = 'service_role');

-- Trigger para criar automaticamente o perfil a partir dos metadados do auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome_completo, telefone, cpf, terms_accepted_at, created_at, updated_at)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'cpf',
    (new.raw_user_meta_data->>'terms_accepted_at')::TIMESTAMP WITH TIME ZONE,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    nome_completo = EXCLUDED.nome_completo,
    telefone = EXCLUDED.telefone,
    cpf = EXCLUDED.cpf,
    terms_accepted_at = EXCLUDED.terms_accepted_at,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-criar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
