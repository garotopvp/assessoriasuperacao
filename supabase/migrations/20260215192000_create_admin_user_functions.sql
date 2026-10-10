-- Function to get all users for admin
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
  id uuid,
  email varchar,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  user_metadata jsonb
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify if the user calling the function is authorized (e.g., service role or admin)
  -- For simplicity in this context, we rely on the fact that this is called by the Edge Function with Service Role
  
  RETURN QUERY
  SELECT 
    au.id, 
    au.email::varchar, 
    au.created_at, 
    au.last_sign_in_at, 
    au.raw_user_meta_data as user_metadata
  FROM auth.users au;
END;
$$ LANGUAGE plpgsql;

-- Function to delete a user for admin
CREATE OR REPLACE FUNCTION delete_user_admin(user_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (optional if using service_role, but good practice)
GRANT EXECUTE ON FUNCTION get_all_users_admin() TO service_role;
GRANT EXECUTE ON FUNCTION delete_user_admin(uuid) TO service_role;

-- Allow authenticated users to call if necessary (though strictly for admin use via Edge Function)
-- We do NOT grant to authenticated/anon to prevent abuse. Only service_role should call this via Edge Function.
