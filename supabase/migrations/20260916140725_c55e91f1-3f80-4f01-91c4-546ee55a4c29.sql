-- Invoices: user-created invoices must start unpaid
DROP POLICY IF EXISTS "Users insert own invoices" ON public.invoices;
CREATE POLICY "Users insert own pending invoices" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_user_id
    AND status = 'pending'
  );

-- Refund requests: user-created refunds must start pending
DROP POLICY IF EXISTS "Owners create own refunds" ON public.refund_requests;
CREATE POLICY "Owners create own pending refunds" ON public.refund_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_user_id
    AND status = 'pending'
  );

-- Subscriptions: no self-service tier/status/amount writes
DROP POLICY IF EXISTS "Users manage own subscriptions" ON public.subscriptions;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'subscriptions'
      AND policyname = 'Users view own subscriptions'
  ) THEN
    CREATE POLICY "Users view own subscriptions" ON public.subscriptions
      FOR SELECT TO authenticated
      USING (auth.uid() = owner_user_id);
  END IF;
END $$;

REVOKE INSERT, UPDATE, DELETE ON public.subscriptions FROM authenticated;