-- ============ 1. products UoM ============
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS base_unit text DEFAULT 'piece',
ADD COLUMN IF NOT EXISTS uom text DEFAULT 'piece',
ADD COLUMN IF NOT EXISTS units_per_uom numeric DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_products_uom ON public.products (uom);

-- ============ 2. businesses ============
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS payment_methods jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='businesses' AND policyname='Users can update own businesses') THEN
    CREATE POLICY "Users can update own businesses" ON public.businesses FOR UPDATE TO authenticated
      USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='businesses' AND policyname='Users can delete own businesses') THEN
    CREATE POLICY "Users can delete own businesses" ON public.businesses FOR DELETE TO authenticated
      USING (auth.uid() = owner_user_id);
  END IF;
END $$;

-- ============ 3. business_staff ============
CREATE TABLE IF NOT EXISTS public.business_staff (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_email text NOT NULL,
  role text NOT NULL DEFAULT 'cashier',
  permissions jsonb NOT NULL DEFAULT '["pos"]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid NOT NULL,
  invitation_token text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_staff TO authenticated;
GRANT ALL ON public.business_staff TO service_role;
CREATE INDEX IF NOT EXISTS idx_business_staff_business ON public.business_staff(business_id);
CREATE INDEX IF NOT EXISTS idx_business_staff_user ON public.business_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_business_staff_email ON public.business_staff(lower(invited_email));
ALTER TABLE public.business_staff ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='business_staff' AND policyname='Staff and owners view business staff') THEN
    CREATE POLICY "Staff and owners view business staff" ON public.business_staff FOR SELECT TO authenticated
      USING (auth.uid() = user_id OR auth.uid() = invited_by OR EXISTS (
        SELECT 1 FROM public.businesses b WHERE b.id = business_staff.business_id AND b.owner_user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='business_staff' AND policyname='Owners manage business staff') THEN
    CREATE POLICY "Owners manage business staff" ON public.business_staff FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_staff.business_id AND b.owner_user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_staff.business_id AND b.owner_user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='businesses' AND policyname='Staff can view assigned businesses') THEN
    CREATE POLICY "Staff can view assigned businesses" ON public.businesses FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.business_staff s WHERE s.business_id = businesses.id
        AND (s.user_id = auth.uid() OR lower(s.invited_email) = lower(auth.jwt() ->> 'email')) AND s.status = 'active'));
  END IF;
END $$;

-- ============ 4. held_orders ============
CREATE TABLE IF NOT EXISTS public.held_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  customer_name text,
  customer_phone text,
  customer_note text,
  cart_data jsonb NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.held_orders TO authenticated;
GRANT ALL ON public.held_orders TO service_role;
ALTER TABLE public.held_orders ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='held_orders' AND policyname='Users can manage held orders for their business') THEN
    CREATE POLICY "Users can manage held orders for their business" ON public.held_orders FOR ALL TO authenticated
      USING (auth.uid() = owner_user_id OR EXISTS (SELECT 1 FROM public.business_staff s WHERE s.business_id = held_orders.business_id AND s.user_id = auth.uid()))
      WITH CHECK (auth.uid() = owner_user_id OR EXISTS (SELECT 1 FROM public.business_staff s WHERE s.business_id = held_orders.business_id AND s.user_id = auth.uid()));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_held_orders_business ON public.held_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_held_orders_created ON public.held_orders(created_at DESC);

-- ============ 5. stock_movements ============
ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS reference_id text,
ADD COLUMN IF NOT EXISTS reference_type text,
ADD COLUMN IF NOT EXISTS created_by uuid;
CREATE INDEX IF NOT EXISTS idx_stock_movements_ref ON public.stock_movements(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_business_date ON public.stock_movements(business_id, created_at DESC);

-- ============ 6. subscriptions / invoices policies ============
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='Users manage own subscriptions') THEN
    CREATE POLICY "Users manage own subscriptions" ON public.subscriptions FOR ALL TO authenticated
      USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='invoices' AND policyname='Users insert own invoices') THEN
    CREATE POLICY "Users insert own invoices" ON public.invoices FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = owner_user_id);
  END IF;
END $$;

-- ============ 7. newsletter ============
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'subscribed',
  source text DEFAULT 'Landing Page',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_email_sent_at timestamptz,
  emails_delivered integer NOT NULL DEFAULT 0
);
GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='newsletter_subscribers' AND policyname='Anyone can subscribe') THEN
    CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='newsletter_subscribers' AND policyname='Admins manage newsletter subscribers') THEN
    CREATE POLICY "Admins manage newsletter subscribers" ON public.newsletter_subscribers FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.newsletter_templates (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'announcement',
  subject text NOT NULL,
  preview_text text,
  headline text,
  body text NOT NULL,
  cta_text text,
  cta_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_templates TO authenticated;
GRANT ALL ON public.newsletter_templates TO service_role;
ALTER TABLE public.newsletter_templates ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='newsletter_templates' AND policyname='Admins manage newsletter templates') THEN
    CREATE POLICY "Admins manage newsletter templates" ON public.newsletter_templates FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.newsletter_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient text NOT NULL,
  template_id text REFERENCES public.newsletter_templates(id) ON DELETE SET NULL,
  template_name text,
  subject text NOT NULL,
  type text,
  status text NOT NULL DEFAULT 'delivered',
  sent_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_logs TO authenticated;
GRANT ALL ON public.newsletter_logs TO service_role;
ALTER TABLE public.newsletter_logs ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='newsletter_logs' AND policyname='Admins manage newsletter logs') THEN
    CREATE POLICY "Admins manage newsletter logs" ON public.newsletter_logs FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- ============ 8. AI provider configuration ============
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  provider_type text NOT NULL DEFAULT 'model_provider',
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  health_status text NOT NULL DEFAULT 'unknown',
  last_health_check timestamptz,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_providers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_providers TO authenticated;
GRANT ALL ON public.ai_providers TO service_role;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.ai_providers(id) ON DELETE CASCADE,
  model_id text NOT NULL,
  display_name text NOT NULL,
  model_type text NOT NULL DEFAULT 'text',
  capabilities text[] NOT NULL DEFAULT '{"product_analysis","product_verification"}',
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, model_id)
);
GRANT SELECT ON public.ai_models TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_models TO authenticated;
GRANT ALL ON public.ai_models TO service_role;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ai_provider_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.ai_providers(id) ON DELETE CASCADE,
  key_name text NOT NULL,
  key_source text NOT NULL DEFAULT 'env',
  masked_key text,
  encrypted_key text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, key_name)
);
GRANT ALL ON public.ai_provider_keys TO service_role;
ALTER TABLE public.ai_provider_keys ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.api_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text NOT NULL UNIQUE,
  user_id text NOT NULL,
  business_id text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  task_type text NOT NULL,
  status text NOT NULL,
  latency_ms integer NOT NULL DEFAULT 0,
  error_code text,
  usage_tokens integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.api_requests TO authenticated;
GRANT ALL ON public.api_requests TO service_role;
ALTER TABLE public.api_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  day date NOT NULL DEFAULT CURRENT_DATE,
  total_requests integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  total_latency_ms bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, provider, model, day)
);
GRANT SELECT ON public.api_usage TO authenticated;
GRANT ALL ON public.api_usage TO service_role;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_providers' AND policyname='Allow public read active ai_providers') THEN
    CREATE POLICY "Allow public read active ai_providers" ON public.ai_providers FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_providers' AND policyname='Admins manage ai_providers') THEN
    CREATE POLICY "Admins manage ai_providers" ON public.ai_providers FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_models' AND policyname='Allow public read active ai_models') THEN
    CREATE POLICY "Allow public read active ai_models" ON public.ai_models FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_models' AND policyname='Admins manage ai_models') THEN
    CREATE POLICY "Admins manage ai_models" ON public.ai_models FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_provider_keys' AND policyname='Service role only ai_provider_keys') THEN
    CREATE POLICY "Service role only ai_provider_keys" ON public.ai_provider_keys FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='api_requests' AND policyname='Admins read api_requests') THEN
    CREATE POLICY "Admins read api_requests" ON public.api_requests FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='api_usage' AND policyname='Admins read api_usage') THEN
    CREATE POLICY "Admins read api_usage" ON public.api_usage FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

INSERT INTO public.ai_providers (id, name, slug, provider_type, is_active, is_default, description)
VALUES 
  ('11111111-1111-4111-a111-111111111111','Google Gemini','gemini','model_provider',true,true,'Primary product extraction & categorization engine'),
  ('22222222-2222-4222-a222-222222222222','OpenAI','openai','model_provider',true,false,'Primary consistency auditor & reasoning verifier'),
  ('33333333-3333-4333-a333-333333333333','OpenRouter','openrouter','model_router',true,false,'Multi-model gateway & flexible fallback routing layer')
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, provider_type=EXCLUDED.provider_type, is_active=EXCLUDED.is_active, description=EXCLUDED.description;

INSERT INTO public.ai_models (provider_id, model_id, display_name, model_type, capabilities, is_active, is_default)
VALUES
  ('11111111-1111-4111-a111-111111111111','gemini-2.5-flash','Gemini 2.5 Flash','multimodal','{"product_analysis","product_verification"}',true,true),
  ('11111111-1111-4111-a111-111111111111','gemini-2.5-pro','Gemini 2.5 Pro','multimodal','{"product_analysis","product_verification"}',true,false),
  ('22222222-2222-4222-a222-222222222222','gpt-4o-mini','GPT-4o Mini','reasoning','{"product_analysis","product_verification"}',true,true),
  ('22222222-2222-4222-a222-222222222222','gpt-4o','GPT-4o','reasoning','{"product_analysis","product_verification"}',true,false),
  ('33333333-3333-4333-a333-333333333333','meta-llama/llama-3.3-70b-instruct','Llama 3.3 70B Instruct','text','{"product_analysis","product_verification"}',true,true),
  ('33333333-3333-4333-a333-333333333333','anthropic/claude-3.5-sonnet','Claude 3.5 Sonnet','multimodal','{"product_analysis","product_verification"}',true,false)
ON CONFLICT (provider_id, model_id) DO UPDATE SET display_name=EXCLUDED.display_name, model_type=EXCLUDED.model_type, is_active=EXCLUDED.is_active;

INSERT INTO public.ai_provider_keys (provider_id, key_name, key_source, masked_key, is_active)
VALUES
  ('11111111-1111-4111-a111-111111111111','GEMINI_API_KEY','env','AIza...[ENV_CONFIGURED]',true),
  ('22222222-2222-4222-a222-222222222222','OPENAI_API_KEY','env','sk-...[ENV_CONFIGURED]',true),
  ('33333333-3333-4333-a333-333333333333','OPENROUTER_API_KEY','env','sk-or-...[ENV_CONFIGURED]',true)
ON CONFLICT (provider_id, key_name) DO UPDATE SET key_source=EXCLUDED.key_source, is_active=EXCLUDED.is_active;

-- ============ 9. general site settings store ============
CREATE TABLE IF NOT EXISTS public.platform_general_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_general_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.platform_general_settings TO authenticated;
GRANT ALL ON public.platform_general_settings TO service_role;
ALTER TABLE public.platform_general_settings ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='platform_general_settings' AND policyname='Anyone can read general settings') THEN
    CREATE POLICY "Anyone can read general settings" ON public.platform_general_settings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='platform_general_settings' AND policyname='Admins manage general settings') THEN
    CREATE POLICY "Admins manage general settings" ON public.platform_general_settings FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;
INSERT INTO public.platform_general_settings (singleton, settings) VALUES (true, '{}'::jsonb) ON CONFLICT (singleton) DO NOTHING;