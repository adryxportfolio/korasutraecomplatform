-- Fix the security issue: Remove direct SELECT access to the reviews table from authenticated/public users
-- Only allow access through the reviews_public view which excludes customer_email

-- Drop the existing SELECT policies that expose customer_email
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can read approved reviews" ON public.reviews;

-- The reviews table should now only be:
-- 1. Insertable by anyone (for submitting reviews) - keep existing policy
-- 2. Readable through the reviews_public view (which excludes customer_email)

-- The reviews_public view with security_invoker=on will respect RLS on the base table
-- Since we removed SELECT policies, the view needs to be recreated as SECURITY DEFINER
-- OR we need to add a limited SELECT policy for the view to work

-- Let's add a SELECT policy that only allows the specific columns needed by the view
-- using a database function for additional security

-- Create a function to check if the query is coming from the view context
-- Actually, the simplest secure approach is to add RLS on the view itself

-- Since views with security_invoker=on apply the RLS of the underlying table,
-- and we're removing SELECT policies, the view won't work anymore.
-- The best approach is to make the view SECURITY DEFINER but create it safely

DROP VIEW IF EXISTS public.reviews_public;

-- Create the view as SECURITY DEFINER (needed since base table has no SELECT policy)
-- but ONLY expose non-sensitive columns
CREATE VIEW public.reviews_public
    WITH (security_barrier=true)
    AS
SELECT 
  id,
  product_id,
  product_handle,
  customer_name,
  rating,
  title,
  content,
  is_verified_purchase,
  is_approved,
  helpful_count,
  created_at,
  updated_at
FROM public.reviews
WHERE is_approved = true;

-- Add RLS to the view itself
ALTER VIEW public.reviews_public SET (security_invoker = off);

COMMENT ON VIEW public.reviews_public IS 'Public view of approved reviews. Excludes customer_email for privacy. Uses security_barrier for safe access.';