-- =====================================================
-- CREATE ORDERS AND ORDER_ITEMS TABLES
-- =====================================================
-- This migration creates the orders and order_items tables
-- to properly track product purchases from the shop

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- User and customer info
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    
    -- Order details
    status TEXT NOT NULL DEFAULT 'pending',
    total DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    items JSONB, -- Raw item data for backup
    shipping_address JSONB,
    
    -- Payment info
    payment_method TEXT DEFAULT 'card',
    payment_provider TEXT DEFAULT 'stripe',
    payment_status TEXT,
    
    -- Provider-specific fields
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent TEXT,
    openpix_correlation_id TEXT UNIQUE,
    correlation_id TEXT, -- Generic correlation field
    
    -- Constraints
    CONSTRAINT orders_status_check CHECK (
        status IN ('pending', 'paid', 'awaiting_payment', 'processing', 'shipped', 'delivered', 'canceled', 'failed', 'refunded')
    ),
    CONSTRAINT orders_payment_provider_check CHECK (
        payment_provider IN ('stripe', 'openpix', 'infinitepay', 'abacate', 'other')
    )
);

-- Create order_items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Reference to order
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    
    -- Product details (denormalized for historical record)
    product_name TEXT NOT NULL,
    product_size TEXT,
    product_image TEXT,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT order_items_quantity_check CHECK (quantity > 0),
    CONSTRAINT order_items_price_check CHECK (price >= 0)
);

-- Create indexes for performance
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_stripe_session_id ON public.orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX idx_orders_openpix_correlation_id ON public.orders(openpix_correlation_id) WHERE openpix_correlation_id IS NOT NULL;
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES FOR ORDERS
-- =====================================================

-- Admins can see all orders
CREATE POLICY "orders_admin_select" ON public.orders
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Users can see their own orders (by user_id)
CREATE POLICY "orders_user_select_by_user_id" ON public.orders
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can see orders by their email (for cases where user_id might not be set)
CREATE POLICY "orders_user_select_by_email" ON public.orders
FOR SELECT TO authenticated
USING (
    customer_email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
    )
);

-- Service role can do everything (for webhooks and functions)
CREATE POLICY "orders_service_all" ON public.orders
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- RLS POLICIES FOR ORDER_ITEMS
-- =====================================================

-- Admins can see all order items
CREATE POLICY "order_items_admin_select" ON public.order_items
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Users can see items from their own orders
CREATE POLICY "order_items_user_select" ON public.order_items
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND (orders.user_id = auth.uid() OR orders.customer_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        ))
    )
);

-- Service role can do everything
CREATE POLICY "order_items_service_all" ON public.order_items
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;

GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;

-- =====================================================
-- UPDATED_AT TRIGGER FOR ORDERS
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at_trigger
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_orders_updated_at();

-- =====================================================
-- ENSURE ADMIN USER HAS ROLE
-- =====================================================

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'boracorrerclub@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
