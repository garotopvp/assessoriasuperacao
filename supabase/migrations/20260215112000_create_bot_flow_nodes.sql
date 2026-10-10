-- Create bot_flow_nodes table
CREATE TABLE IF NOT EXISTS public.bot_flow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    position_x FLOAT DEFAULT 0,
    position_y FLOAT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bot_flow_nodes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Bot flow nodes are viewable by everyone" ON public.bot_flow_nodes
    FOR SELECT USING (true);

CREATE POLICY "Bot flow nodes are editable by admins" ON public.bot_flow_nodes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Pre-populate with current flow (Initial setup)
INSERT INTO public.bot_flow_nodes (node_key, title, content, options, position_x, position_y)
VALUES 
('WAITING_NAME', 'Início / Pedir Nome', 'Olá! Bem-vindo ao *Bora Correr Club*! 🏃‍♂️🚀\n\nEu sou o assistente virtual da equipe. Para começarmos, qual é o seu nome?', '[]'::jsonb, 100, 100),
('CONFIRMING_NAME', 'Confirmar Nome', 'Prazer em conhecê-lo! Só para confirmar, seu nome é *{name}*, correto?\n\nResponda:\n✅ Sim\n❌ Não', '[{"label": "Sim", "next_node": "WAITING_EXPERIENCE"}, {"label": "Não", "next_node": "WAITING_NAME"}]'::jsonb, 400, 100),
('WAITING_EXPERIENCE', 'Experiência', 'Perfeito, *{name}*! 🤝\n\nAgora me conta: você já tem experiência com corrida ou está começando do zero?\n\n1️⃣ Já corro regularmente\n2️⃣ Estou começando agora', '[{"label": "Já corro", "next_node": "WAITING_GOAL"}, {"label": "Iniciante", "next_node": "WAITING_GOAL"}]'::jsonb, 700, 100),
('WAITING_GOAL', 'Objetivo', 'Ótimo! E qual é o seu principal objetivo com a corrida?\n\n1️⃣ Perder peso e melhorar saúde\n2️⃣ Correr minha primeira prova (5km, 10km)\n3️⃣ Melhorar meu tempo/performance\n4️⃣ Treinar para maratona', '[{"label": "Saúde", "next_node": "WAITING_TRIAL_INTEREST"}, {"label": "Prova", "next_node": "WAITING_TRIAL_INTEREST"}, {"label": "Performance", "next_node": "WAITING_TRIAL_INTEREST"}, {"label": "Maratona", "next_node": "WAITING_TRIAL_INTEREST"}]'::jsonb, 1000, 100),
('WAITING_TRIAL_INTEREST', 'Interesse Aula Experimental', 'Excelente! Temos o plano perfeito para quem busca {goal}! 🎯\n\nAntes de continuarmos, você gostaria de agendar uma *AULA EXPERIMENTAL GRATUITA* com a nossa equipe no Parque Ibirapuera?\n\n1️⃣ Sim, eu quero!\n2️⃣ Agora não, prefiro ver outras informações.', '[{"label": "Sim", "next_node": "WAITING_TRIAL_DAY"}, {"label": "Não", "next_node": "WAITING_MENU"}]'::jsonb, 1300, 100),
('WAITING_TRIAL_DAY', 'Dia da Aula', 'Legal! Qual o melhor dia para você treinar com a gente na Praça em frente a Moby Dick?\n\n1️⃣ Terça-feira\n2️⃣ Quinta-feira\n3️⃣ Sábado', '[{"label": "Terça", "next_node": "WAITING_TRIAL_TIME"}, {"label": "Quinta", "next_node": "WAITING_TRIAL_TIME"}, {"label": "Sábado", "next_node": "WAITING_TRIAL_TIME"}]'::jsonb, 1600, 100),
('WAITING_TRIAL_TIME', 'Horário da Aula', 'E qual o melhor horário para você na {day}?\n\n1️⃣ 06:00 (Manhã)\n2️⃣ 07:00 (Manhã)\n3️⃣ 19:30 (Noite)', '[{"label": "06:00", "next_node": "WAITING_MENU"}, {"label": "07:00", "next_node": "WAITING_MENU"}, {"label": "19:30", "next_node": "WAITING_MENU"}]'::jsonb, 1900, 100),
('WAITING_MENU', 'Menu Principal', 'Como posso te ajudar hoje?\n\n1️⃣ *Financeiro*\n2️⃣ *Treinos*\n3️⃣ *Comunicação*', '[]'::jsonb, 2200, 100)
ON CONFLICT (node_key) DO NOTHING;
