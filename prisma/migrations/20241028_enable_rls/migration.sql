-- Enable Row Level Security for Never Forget
-- Migration created: 2024-10-28

-- Enable RLS on user-specific tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reminder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FlowResponse" ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user ID from application context
CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin
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
  
  -- Check against admin emails
  admin_emails := string_to_array(current_setting('app.admin_emails', true), ',');
  
  RETURN user_email = ANY(admin_emails);
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
CREATE POLICY user_own_data ON "User"
  FOR ALL
  USING (id = current_app_user_id() OR is_admin_user());

CREATE POLICY account_own_data ON "Account"
  FOR ALL
  USING ("userId" = current_app_user_id() OR is_admin_user());

CREATE POLICY session_own_data ON "Session"
  FOR ALL
  USING ("userId" = current_app_user_id() OR is_admin_user());

CREATE POLICY reminder_own_data ON "Reminder"
  FOR ALL
  USING ("userId" = current_app_user_id() OR is_admin_user());


CREATE POLICY feedback_own_data ON "Feedback"
  FOR ALL
  USING ("userId" = current_app_user_id() OR is_admin_user());

CREATE POLICY feedback_anonymous_admin_only ON "Feedback"
  FOR SELECT
  USING ("userId" IS NULL AND is_admin_user());

CREATE POLICY flow_response_own_data ON "FlowResponse"
  FOR ALL
  USING ("userId" = current_app_user_id() OR is_admin_user());

CREATE POLICY flow_response_anonymous_admin_only ON "FlowResponse"
  FOR SELECT
  USING ("userId" IS NULL AND is_admin_user());

-- Note: Service role creation removed due to permission constraints
-- If needed, this role should be created manually by a database administrator