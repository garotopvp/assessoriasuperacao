-- Add category column to bot_flow_nodes
ALTER TABLE public.bot_flow_nodes 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'padrao';

-- Add check constraint for valid categories
ALTER TABLE public.bot_flow_nodes
ADD CONSTRAINT valid_category CHECK (category IN ('padrao', 'venda', 'suporte', 'conteudo', 'pagamento'));

-- Update existing nodes to have default category
UPDATE public.bot_flow_nodes 
SET category = 'padrao' 
WHERE category IS NULL;
