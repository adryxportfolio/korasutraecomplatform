-- Create customer_sessions table to store valid sessions server-side
CREATE TABLE public.customer_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient token lookups
CREATE INDEX idx_customer_sessions_token ON public.customer_sessions (token);
CREATE INDEX idx_customer_sessions_customer_id ON public.customer_sessions (customer_id);
CREATE INDEX idx_customer_sessions_expires_at ON public.customer_sessions (expires_at);

-- Enable RLS on sessions table (only edge functions with service role can access)
ALTER TABLE public.customer_sessions ENABLE ROW LEVEL SECURITY;

-- No public RLS policies - only service role can access sessions table

-- Create function to get current customer_id from session token in request headers
CREATE OR REPLACE FUNCTION public.get_current_customer_id()
RETURNS UUID AS $$
DECLARE
  v_token TEXT;
  v_customer_id UUID;
BEGIN
  -- Extract token from request headers
  BEGIN
    v_token := current_setting('request.headers', true)::json->>'x-session-token';
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
  
  IF v_token IS NULL OR v_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Look up valid session
  SELECT customer_id INTO v_customer_id
  FROM public.customer_sessions
  WHERE token = v_token 
    AND expires_at > now();
  
  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing permissive policies on customers table
DROP POLICY IF EXISTS "Customers can view their own profile" ON public.customers;
DROP POLICY IF EXISTS "Customers can update their own profile" ON public.customers;
DROP POLICY IF EXISTS "Allow customer creation" ON public.customers;

-- Create secure RLS policies for customers table
CREATE POLICY "Customers can view their own profile"
ON public.customers FOR SELECT
USING (id = get_current_customer_id());

CREATE POLICY "Customers can update their own profile"
ON public.customers FOR UPDATE
USING (id = get_current_customer_id());

-- Customer creation only via edge functions (service role)
-- No INSERT policy for anon users

-- Drop existing permissive policies on customer_addresses table
DROP POLICY IF EXISTS "Customers can view their own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Customers can update their own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Customers can delete their own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Customers can create addresses" ON public.customer_addresses;

-- Create secure RLS policies for customer_addresses table
CREATE POLICY "Customers can view their own addresses"
ON public.customer_addresses FOR SELECT
USING (customer_id = get_current_customer_id());

CREATE POLICY "Customers can update their own addresses"
ON public.customer_addresses FOR UPDATE
USING (customer_id = get_current_customer_id());

CREATE POLICY "Customers can delete their own addresses"
ON public.customer_addresses FOR DELETE
USING (customer_id = get_current_customer_id());

CREATE POLICY "Customers can create their own addresses"
ON public.customer_addresses FOR INSERT
WITH CHECK (customer_id = get_current_customer_id());

-- Drop existing permissive policy on otp_verifications table
DROP POLICY IF EXISTS "Allow OTP operations" ON public.otp_verifications;

-- OTP table should only be accessed by edge functions (service role)
-- No public RLS policies - prevents direct access to OTP data

-- Clean up expired sessions automatically with a function
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.customer_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;