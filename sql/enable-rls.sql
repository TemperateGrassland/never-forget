-- Never Forget Row Level Security Implementation
-- This script enables RLS and creates policies for user data isolation

-- Enable RLS on user-specific tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reminder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FriendInvite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FlowResponse" ENABLE ROW LEVEL SECURITY;

-- Global tables (no RLS needed)
-- WaitlistEntry: Public submission form
-- VerificationToken: System tokens
-- AnonymousFeedback: Intentionally anonymous

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get current user ID from application context
-- This will be set by the application before each request
CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin
-- Admins can access all data for support/analytics
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  admin_emails TEXT[];
BEGIN
  -- Get current user's email
  SELECT email INTO user_email 
  FROM "User" 
  WHERE id = current_app_user_id();
  
  -- Check against admin emails (from environment)
  admin_emails := string_to_array(current_setting('app.admin_emails', true), ',');
  
  RETURN user_email = ANY(admin_emails);
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- USER TABLE POLICIES
-- =============================================

-- Users can only see their own profile
CREATE POLICY user_own_data ON "User"
  FOR ALL
  USING (id = current_app_user_id() OR is_admin_user());

-- =============================================
-- ACCOUNT TABLE POLICIES
-- =============================================

-- Users can only access their own OAuth accounts
CREATE POLICY account_own_data ON "Account"
  FOR ALL
  USING ("userId" = current_app_user_id() OR is_admin_user());

-- =============================================
-- SESSION TABLE POLICIES
-- =============================================

-- Users can only access their own sessions
CREATE POLICY session_own_data ON "Session"
  FOR ALL
  USING ("userId" = current_app_user_id() OR is_admin_user());

-- =============================================
-- REMINDER TABLE POLICIES
-- =============================================

-- Users can only access their own reminders
CREATE POLICY reminder_own_data ON "Reminder"
  FOR ALL
  USING ("userId" = current_app_user_id() OR is_admin_user());

-- =============================================
-- FRIEND INVITE TABLE POLICIES
-- =============================================

-- Users can see invites they sent
CREATE POLICY friend_invite_own_data ON "FriendInvite"
  FOR ALL
  USING ("fromUserId" = current_app_user_id() OR is_admin_user());

-- =============================================
-- FEEDBACK TABLE POLICIES
-- =============================================

-- Users can see feedback they submitted
-- Admins can see all feedback for support
CREATE POLICY feedback_own_data ON "Feedback"
  FOR ALL
  USING ("userId" = current_app_user_id() OR is_admin_user());

-- Anonymous feedback submissions (userId IS NULL) are only visible to admins
CREATE POLICY feedback_anonymous_admin_only ON "Feedback"
  FOR SELECT
  USING ("userId" IS NULL AND is_admin_user());

-- =============================================
-- FLOW RESPONSE TABLE POLICIES
-- =============================================

-- Users can see their own flow responses
-- Admins can see all for analytics
CREATE POLICY flow_response_own_data ON "FlowResponse"
  FOR ALL
  USING ("userId" = current_app_user_id() OR is_admin_user());

-- Anonymous flow responses are only visible to admins
CREATE POLICY flow_response_anonymous_admin_only ON "FlowResponse"
  FOR SELECT
  USING ("userId" IS NULL AND is_admin_user());

-- =============================================
-- BYPASS POLICIES FOR SERVICE OPERATIONS
-- =============================================

-- Create a service role that can bypass RLS for system operations
-- This is used for background jobs, webhooks, etc.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role;
  END IF;
END
$$;

-- Grant necessary permissions to service role
GRANT CONNECT ON DATABASE postgres TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Service role bypasses RLS
ALTER ROLE service_role SET row_security = off;

-- =============================================
-- ADMIN POLICIES (Optional: Separate Admin Access)
-- =============================================

-- Create admin role for direct database access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin_role') THEN
    CREATE ROLE admin_role;
  END IF;
END
$$;

-- Admin role can bypass RLS
ALTER ROLE admin_role SET row_security = off;
GRANT CONNECT ON DATABASE postgres TO admin_role;
GRANT USAGE ON SCHEMA public TO admin_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO admin_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO admin_role;

-- =============================================
-- POLICY TESTING FUNCTIONS
-- =============================================

-- Function to test RLS policies
CREATE OR REPLACE FUNCTION test_rls_policies(test_user_id TEXT, admin_email TEXT DEFAULT NULL)
RETURNS TABLE(
  table_name TEXT,
  policy_name TEXT,
  can_access BOOLEAN,
  row_count BIGINT
) AS $$
BEGIN
  -- Set current user context
  PERFORM set_config('app.current_user_id', test_user_id, true);
  
  IF admin_email IS NOT NULL THEN
    PERFORM set_config('app.admin_emails', admin_email, true);
  END IF;

  -- Test each table
  RETURN QUERY
  SELECT 'User'::TEXT, 'user_own_data'::TEXT, true, (SELECT count(*) FROM "User")::BIGINT
  UNION ALL
  SELECT 'Reminder'::TEXT, 'reminder_own_data'::TEXT, true, (SELECT count(*) FROM "Reminder")::BIGINT
  UNION ALL
  SELECT 'Account'::TEXT, 'account_own_data'::TEXT, true, (SELECT count(*) FROM "Account")::BIGINT
  UNION ALL
  SELECT 'Session'::TEXT, 'session_own_data'::TEXT, true, (SELECT count(*) FROM "Session")::BIGINT
  UNION ALL
  SELECT 'FriendInvite'::TEXT, 'friend_invite_own_data'::TEXT, true, (SELECT count(*) FROM "FriendInvite")::BIGINT
  UNION ALL
  SELECT 'Feedback'::TEXT, 'feedback_own_data'::TEXT, true, (SELECT count(*) FROM "Feedback")::BIGINT
  UNION ALL
  SELECT 'FlowResponse'::TEXT, 'flow_response_own_data'::TEXT, true, (SELECT count(*) FROM "FlowResponse")::BIGINT;
END;
$$ LANGUAGE plpgsql;