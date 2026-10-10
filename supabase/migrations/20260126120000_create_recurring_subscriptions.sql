-- Create recurring_subscriptions table
CREATE TABLE IF NOT EXISTS recurring_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados do aluno
  student_name VARCHAR(255) NOT NULL,
  student_email VARCHAR(255) NOT NULL,
  student_phone VARCHAR(20),
  
  -- Dados do plano
  plan_id VARCHAR(50),
  plan_name VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  
  -- Status da assinatura
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  -- active, paused, canceled
  
  -- Datas
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_billing_date TIMESTAMP WITH TIME ZONE NOT NULL,
  canceled_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_invoices table
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES recurring_subscriptions(id) ON DELETE CASCADE,
  
  -- Dados da cobrança
  amount DECIMAL(10,2) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Link de pagamento
  payment_link VARCHAR(500),
  abacate_payment_id VARCHAR(255),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- pending, paid, overdue, canceled
  
  -- Datas
  paid_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  last_reminder_at TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recurring_subs_user ON recurring_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_subs_status ON recurring_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_recurring_subs_next_billing ON recurring_subscriptions(next_billing_date);

CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON subscription_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON subscription_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_abacate ON subscription_invoices(abacate_payment_id);

-- Enable Row Level Security
ALTER TABLE recurring_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON recurring_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON recurring_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert subscriptions"
  ON recurring_subscriptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update subscriptions"
  ON recurring_subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for subscription_invoices
CREATE POLICY "Users can view their own invoices"
  ON subscription_invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recurring_subscriptions
      WHERE recurring_subscriptions.id = subscription_invoices.subscription_id
      AND recurring_subscriptions.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all invoices"
  ON subscription_invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage invoices"
  ON subscription_invoices FOR ALL
  USING (auth.role() = 'service_role');
