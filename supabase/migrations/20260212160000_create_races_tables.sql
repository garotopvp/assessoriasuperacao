
-- Tabela de Corridas/Eventos
CREATE TABLE IF NOT EXISTS public.races (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    event_date DATE NOT NULL, -- Data do evento
    location TEXT, -- Local do evento
    description TEXT, -- Descrição (HTML ou texto)
    registration_deadline DATE, -- Prazo limite para inscrição
    image_url TEXT, -- Banner do evento
    external_link TEXT, -- Link externo (se houver)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para races
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para races
-- Qualquer um pode ver corridas (público) - ou pelo menos logado
CREATE POLICY "Public races are viewable by everyone" ON public.races
    FOR SELECT USING (true);

-- Apenas admins podem criar/atualizar/deletar corridas
CREATE POLICY "Admins can insert races" ON public.races
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update races" ON public.races
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete races" ON public.races
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Tabela de Inscrições nas Corridas
CREATE TABLE IF NOT EXISTS public.race_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Dados do Participante (Snapshot)
    full_name TEXT NOT NULL,
    cpf TEXT,
    gender TEXT, -- M, F, Outro
    birth_date DATE,
    email TEXT NOT NULL,
    phone TEXT,
    
    -- Dados Específicos da Corrida
    tshirt_size TEXT, -- PP, P, M, G, GG, XG...
    pace TEXT, -- Ritmo / Pelotão (ex: 5:00 min/km)
    
    -- Controle Interno
    status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled
    payment_status TEXT DEFAULT 'pending', -- pending, paid, exempted
    used_coupon TEXT, -- Cupom utilizado na prova (se houver)
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Um usuário só pode se inscrever uma vez por corrida
    UNIQUE(race_id, user_id)
);

-- Habilitar RLS para race_registrations
ALTER TABLE public.race_registrations ENABLE ROW LEVEL SECURITY;

-- Políticas
-- Usuário pode ver suas próprias inscrições
CREATE POLICY "Users can view own registrations" ON public.race_registrations
    FOR SELECT USING (auth.uid() = user_id);

-- Admins podem ver todas as inscrições
CREATE POLICY "Admins can view all registrations" ON public.race_registrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Usuário pode criar sua inscrição (se estiver autenticado)
CREATE POLICY "Users can insert own registration" ON public.race_registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuário pode atualizar sua própria inscrição (ex: tamanho da camiseta antes do prazo)
CREATE POLICY "Users can update own registration" ON public.race_registrations
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins podem atualizar qualquer inscrição (status, pagamento, etc)
CREATE POLICY "Admins can update all registrations" ON public.race_registrations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins podem deletar inscrições
CREATE POLICY "Admins can delete registrations" ON public.race_registrations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
