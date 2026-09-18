
-- Non-recursive helpers (bypass RLS so policies never call back into each other)
CREATE OR REPLACE FUNCTION public.is_business_owner(_business_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = _business_id AND b.owner_user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_business_staff(_business_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_staff s
    WHERE s.business_id = _business_id
      AND s.status = 'active'
      AND (s.user_id = _user_id
           OR lower(s.invited_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  )
$$;

-- businesses: break the recursion
DROP POLICY IF EXISTS "Staff can view assigned businesses" ON public.businesses;
CREATE POLICY "Staff can view assigned businesses"
ON public.businesses FOR SELECT TO authenticated
USING (public.is_business_staff(id, auth.uid()));

-- business_staff: break the recursion
DROP POLICY IF EXISTS "Owners manage business staff" ON public.business_staff;
CREATE POLICY "Owners manage business staff"
ON public.business_staff FOR ALL TO authenticated
USING (public.is_business_owner(business_id, auth.uid()))
WITH CHECK (public.is_business_owner(business_id, auth.uid()));

DROP POLICY IF EXISTS "Staff and owners view business staff" ON public.business_staff;
CREATE POLICY "Staff and owners view business staff"
ON public.business_staff FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR auth.uid() = invited_by
  OR public.is_business_owner(business_id, auth.uid())
);

-- products: let assigned staff read the catalogue of their store
DROP POLICY IF EXISTS "Owners manage their products" ON public.products;
CREATE POLICY "Owners manage their products"
ON public.products FOR ALL TO authenticated
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Staff can view assigned store products"
ON public.products FOR SELECT TO authenticated
USING (public.is_business_staff(business_id, auth.uid()));

-- ticket_messages: a non-admin may never post a message flagged as an admin reply
DROP POLICY IF EXISTS "Owners create own ticket messages" ON public.ticket_messages;
CREATE POLICY "Owners create own ticket messages"
ON public.ticket_messages FOR INSERT TO authenticated
WITH CHECK (
  author_user_id = auth.uid()
  AND (is_admin = false OR public.has_role(auth.uid(), 'admin'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id
      AND (t.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);
