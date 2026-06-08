-- ====================================================================
-- Compatibility setup for local/vanilla PostgreSQL (non-Supabase)
-- ====================================================================

-- Create authenticated and anon roles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon;
  END IF;
END
$$;

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create stub auth.uid() function if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    EXECUTE 'CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS ''SELECT null::uuid''';
  END IF;
END
$$;

-- ====================================================================
-- Enable Row-Level Security (RLS) on all 10 public tables
-- ====================================================================

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collaborators" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "document_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "document_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "share_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_logs" ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- RLS Policies for "users"
-- ====================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "users_select_policy" ON "users";
DROP POLICY IF EXISTS "users_update_policy" ON "users";

-- Allow authenticated users to look up profiles (needed to see collaborator names/avatars)
CREATE POLICY "users_select_policy" ON "users"
  FOR SELECT TO authenticated USING (true);

-- Allow users to update only their own profile
CREATE POLICY "users_update_policy" ON "users"
  FOR UPDATE TO authenticated USING (auth.uid()::text = id);

-- ====================================================================
-- Strict default-deny (Option A) for system and sensitive tables
-- ====================================================================
-- By enabling RLS and not defining any policies for the following tables:
--   1. "accounts" (contains sensitive access_token, refresh_token)
--   2. "sessions" (contains sensitive session_token)
--   3. "verification_tokens" (contains email verification tokens)
--   4. "documents"
--   5. "collaborators"
--   6. "document_versions"
--   7. "document_snapshots"
--   8. "share_links"
--   9. "activity_logs"
--
-- All direct public PostgREST API access is blocked (default deny).
-- The Next.js and Socket.io servers bypass these restrictions because they
-- connect as the database superuser/owner ("postgres" or "collabdoc").
-- ====================================================================
