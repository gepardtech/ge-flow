
-- Internal trigger routines: nobody should call these over the API
REVOKE ALL ON FUNCTION public.apply_business_category_defaults() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.propagate_category_defaults() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_columns() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.support_auto_reply() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_public_feature_modules() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_public_payment_gateways() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_public_settings() FROM anon, authenticated;

-- Signed-in-only helpers: never callable by signed-out visitors
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.is_business_owner(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_business_staff(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.increment_business_ai_usage(uuid) FROM anon;
