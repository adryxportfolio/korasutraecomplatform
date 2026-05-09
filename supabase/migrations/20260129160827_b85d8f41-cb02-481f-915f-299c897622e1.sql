-- The reviews table is missing a SELECT policy, making customer_email potentially exposed
-- The get_approved_reviews() RPC already excludes customer_email for public access
-- However, we should add a SELECT policy that blocks direct table access to protect customer_email
-- This forces all reads through the secure get_approved_reviews() RPC function

-- Add a restrictive SELECT policy that denies all direct SELECT access
-- This ensures customer_email is never exposed through direct table queries
-- All review reads must go through get_approved_reviews() which excludes customer_email
CREATE POLICY "Block direct SELECT - use get_approved_reviews RPC"
ON public.reviews
FOR SELECT
USING (false);  -- No direct SELECT allowed, forces use of secure RPC