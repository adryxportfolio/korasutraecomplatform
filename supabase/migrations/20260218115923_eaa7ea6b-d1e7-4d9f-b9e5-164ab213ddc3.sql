
-- Create admin users table for secure admin authentication
CREATE TABLE public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- No public access - admin_users table is only accessible via service role in edge functions
CREATE POLICY "No public access to admin_users"
ON public.admin_users
FOR ALL
USING (false);

-- Create admin sessions table
CREATE TABLE public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to admin_sessions"
ON public.admin_sessions
FOR ALL
USING (false);

-- Insert default admin user.
INSERT INTO public.admin_users (username, password_hash)
VALUES ('korasutra.official@gmail.com', '9d3bfeceeeab8f06130d094b83f2bd5f574dc495ab1c6927ad5f77ed8d0d3061');
