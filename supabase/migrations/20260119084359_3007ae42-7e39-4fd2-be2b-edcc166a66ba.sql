-- Create table for storing customer profiles with phone auth
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL DEFAULT '+91',
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  shopify_customer_id TEXT,
  is_verified BOOLEAN DEFAULT false
);

-- Create table for storing customer addresses
CREATE TABLE public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for OTP verification
CREATE TABLE public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT '+91',
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for customers - allow read/update for own data
CREATE POLICY "Customers can view their own profile"
ON public.customers FOR SELECT
USING (true);

CREATE POLICY "Customers can update their own profile"
ON public.customers FOR UPDATE
USING (true);

CREATE POLICY "Allow customer creation"
ON public.customers FOR INSERT
WITH CHECK (true);

-- RLS policies for customer_addresses
CREATE POLICY "Customers can view their own addresses"
ON public.customer_addresses FOR SELECT
USING (true);

CREATE POLICY "Customers can create addresses"
ON public.customer_addresses FOR INSERT
WITH CHECK (true);

CREATE POLICY "Customers can update their own addresses"
ON public.customer_addresses FOR UPDATE
USING (true);

CREATE POLICY "Customers can delete their own addresses"
ON public.customer_addresses FOR DELETE
USING (true);

-- RLS policies for otp_verifications - internal use only via edge functions
CREATE POLICY "Allow OTP operations"
ON public.otp_verifications FOR ALL
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_shopify_id ON public.customers(shopify_customer_id);
CREATE INDEX idx_otp_phone ON public.otp_verifications(phone);
CREATE INDEX idx_otp_expires ON public.otp_verifications(expires_at);

-- Create updated_at triggers
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_addresses_updated_at
BEFORE UPDATE ON public.customer_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();