-- 1. Create student_anamnesis table
CREATE TABLE IF NOT EXISTS public.student_anamnesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  data_nascimento DATE,
  peso NUMERIC(5,2),
  altura INTEGER, -- em cm
  profissao TEXT,
  carga_horaria TEXT,
  frequencia_semanal INTEGER CHECK (frequencia_semanal >= 1 AND frequencia_semanal <= 7),
  nivel_corrida INTEGER CHECK (nivel_corrida >= 0 AND nivel_corrida <= 10),
  objetivo_principal TEXT,
  medicamento_controlado TEXT,
  restricao_fisica TEXT,
  historico_lesoes_cirurgias TEXT,
  hipertensao_diabetes TEXT,
  dias_favoraveis TEXT[], -- Array de dias da semana
  pace_atual TEXT,
  uso_gps_app TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add columns for Legal Compliance if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_anamnesis' AND column_name='terms_accepted') THEN
        ALTER TABLE public.student_anamnesis ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_anamnesis' AND column_name='terms_version') THEN
        ALTER TABLE public.student_anamnesis ADD COLUMN terms_version TEXT DEFAULT 'v1.0';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_anamnesis' AND column_name='accepted_ip') THEN
        ALTER TABLE public.student_anamnesis ADD COLUMN accepted_ip TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_anamnesis' AND column_name='user_agent') THEN
        ALTER TABLE public.student_anamnesis ADD COLUMN user_agent TEXT;
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.student_anamnesis ENABLE ROW LEVEL SECURITY;

-- 4. Recreate Policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Users can view own anamnesis" ON public.student_anamnesis;
CREATE POLICY "Users can view own anamnesis" ON public.student_anamnesis
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own anamnesis" ON public.student_anamnesis;
CREATE POLICY "Users can insert own anamnesis" ON public.student_anamnesis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own anamnesis" ON public.student_anamnesis;
CREATE POLICY "Users can update own anamnesis" ON public.student_anamnesis
  FOR UPDATE USING (auth.uid() = user_id);

-- Fix: Using user_roles table instead of profiles for admin check
DROP POLICY IF EXISTS "Admins can view all anamnesis" ON public.student_anamnesis;
CREATE POLICY "Admins can view all anamnesis" ON public.student_anamnesis
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_student_anamnesis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_student_anamnesis_updated_at ON public.student_anamnesis;
CREATE TRIGGER update_student_anamnesis_updated_at
BEFORE UPDATE ON public.student_anamnesis
FOR EACH ROW EXECUTE PROCEDURE update_student_anamnesis_updated_at();
