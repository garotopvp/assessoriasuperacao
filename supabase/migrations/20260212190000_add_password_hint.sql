-- Add dica_senha column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dica_senha text;

-- Update handle_new_user trigger to include email and dica_senha
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    email,
    nome_completo, 
    telefone, 
    cpf, 
    dica_senha,
    terms_accepted_at, 
    created_at, 
    updated_at
  )
  VALUES (
    new.id,
    new.email, -- Insert email from auth.users
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'cpf',
    new.raw_user_meta_data->>'dica_senha',
    (new.raw_user_meta_data->>'terms_accepted_at')::TIMESTAMP WITH TIME ZONE,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    nome_completo = EXCLUDED.nome_completo,
    telefone = EXCLUDED.telefone,
    cpf = EXCLUDED.cpf,
    dica_senha = EXCLUDED.dica_senha,
    terms_accepted_at = EXCLUDED.terms_accepted_at,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC to get password hint safely
CREATE OR REPLACE FUNCTION public.get_password_hint(user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  hint text;
BEGIN
  -- We query based on auth.users email to ensure accuracy, returning the profile's hint
  SELECT p.dica_senha INTO hint
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE u.email = user_email;
  
  RETURN hint;
END;
$$;

-- Grant execute to everyone (so login page can use it)
GRANT EXECUTE ON FUNCTION public.get_password_hint TO anon, authenticated;
