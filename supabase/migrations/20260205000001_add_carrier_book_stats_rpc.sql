-- Single RPC function to get all carrier book stats in one query
-- Replaces 3 separate count queries from the client for better performance
CREATE OR REPLACE FUNCTION get_carrier_book_stats(
  p_profile_id uuid,
  p_carrier_id uuid,
  p_month_start date,
  p_month_end date
) RETURNS json AS $$
  SELECT json_build_object(
    'active_count', COUNT(*) FILTER (WHERE status = 'active'),
    'new_count', COUNT(*) FILTER (WHERE status = 'active'
      AND effective_date >= p_month_start
      AND effective_date < p_month_end),
    'termed_count', COUNT(*) FILTER (WHERE status = 'termed'
      AND term_date >= p_month_start
      AND term_date < p_month_end)
  )
  FROM policies
  WHERE profile_id = p_profile_id
    AND carrier_id = p_carrier_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Composite index for the query pattern used by get_carrier_book_stats
CREATE INDEX IF NOT EXISTS idx_policies_profile_carrier_status
  ON policies(profile_id, carrier_id, status);
