-- =====================================================
-- ONBOARDING ANALYTICS SQL FUNCTIONS
-- Migration 005: Advanced Analytics Functions
-- =====================================================

-- Drop function if exists (for safe re-running)
DROP FUNCTION IF EXISTS get_onboarding_completion_trends(TEXT, TEXT, TEXT, TEXT);

-- =====================================================
-- COMPLETION TRENDS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_onboarding_completion_trends(
  start_date TEXT,
  end_date TEXT,
  date_format TEXT DEFAULT 'YYYY-MM-DD',
  interval_duration TEXT DEFAULT '1 day'
)
RETURNS TABLE (
  date TEXT,
  started_count BIGINT,
  completed_count BIGINT,
  completion_rate NUMERIC,
  average_completion_time_minutes NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      start_date::timestamp,
      end_date::timestamp,
      interval_duration::interval
    )::date AS date_bucket
  ),
  started_events AS (
    SELECT 
      date_trunc(
        CASE 
          WHEN interval_duration = '1 day' THEN 'day'
          WHEN interval_duration = '1 week' THEN 'week'
          WHEN interval_duration = '1 month' THEN 'month'
          ELSE 'day'
        END,
        event_timestamp::timestamp
      )::date AS event_date,
      user_id
    FROM onboarding_analytics
    WHERE event_type = 'onboarding_started'
      AND event_timestamp >= start_date::timestamp
      AND event_timestamp <= end_date::timestamp
  ),
  completed_events AS (
    SELECT 
      date_trunc(
        CASE 
          WHEN interval_duration = '1 day' THEN 'day'
          WHEN interval_duration = '1 week' THEN 'week'
          WHEN interval_duration = '1 month' THEN 'month'
          ELSE 'day'
        END,
        event_timestamp::timestamp
      )::date AS event_date,
      user_id,
      time_spent_seconds
    FROM onboarding_analytics
    WHERE event_type = 'onboarding_completed'
      AND event_timestamp >= start_date::timestamp
      AND event_timestamp <= end_date::timestamp
  ),
  daily_stats AS (
    SELECT 
      ds.date_bucket,
      COALESCE(COUNT(DISTINCT se.user_id), 0) AS started_count,
      COALESCE(COUNT(DISTINCT ce.user_id), 0) AS completed_count,
      CASE 
        WHEN COUNT(DISTINCT se.user_id) > 0 
        THEN ROUND((COUNT(DISTINCT ce.user_id)::numeric / COUNT(DISTINCT se.user_id)::numeric) * 100, 2)
        ELSE 0 
      END AS completion_rate,
      CASE 
        WHEN COUNT(ce.time_spent_seconds) > 0 
        THEN ROUND(AVG(ce.time_spent_seconds) / 60.0, 2)
        ELSE 0 
      END AS avg_completion_time_minutes
    FROM date_series ds
    LEFT JOIN started_events se ON ds.date_bucket = se.event_date
    LEFT JOIN completed_events ce ON ds.date_bucket = ce.event_date
    GROUP BY ds.date_bucket
    ORDER BY ds.date_bucket
  )
  SELECT 
    to_char(date_bucket, date_format) AS date,
    started_count,
    completed_count,
    completion_rate,
    avg_completion_time_minutes
  FROM daily_stats;
END;
$$;

-- =====================================================
-- FUNNEL ANALYSIS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_onboarding_funnel_data(
  start_date TEXT DEFAULT NULL,
  end_date TEXT DEFAULT NULL
)
RETURNS TABLE (
  step_name TEXT,
  step_order INTEGER,
  started_count BIGINT,
  completed_count BIGINT,
  skipped_count BIGINT,
  abandoned_count BIGINT,
  conversion_rate NUMERIC,
  average_time_seconds NUMERIC,
  drop_off_rate NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  filter_start_date timestamp;
  filter_end_date timestamp;
BEGIN
  -- Set default date range if not provided
  filter_start_date := COALESCE(start_date::timestamp, NOW() - INTERVAL '30 days');
  filter_end_date := COALESCE(end_date::timestamp, NOW());

  RETURN QUERY
  WITH step_events AS (
    SELECT 
      step_name,
      event_type,
      user_id,
      time_spent_seconds,
      event_timestamp
    FROM onboarding_analytics
    WHERE step_name IS NOT NULL
      AND event_timestamp >= filter_start_date
      AND event_timestamp <= filter_end_date
  ),
  step_stats AS (
    SELECT 
      se.step_name,
      CASE 
        WHEN se.step_name = 'work-schedule' THEN 1
        WHEN se.step_name = 'time-buffers' THEN 2
        WHEN se.step_name = 'suppliers' THEN 3
        ELSE 4
      END AS step_order,
      COUNT(DISTINCT CASE WHEN se.event_type = 'step_started' THEN se.user_id END) AS started_count,
      COUNT(DISTINCT CASE WHEN se.event_type = 'step_completed' THEN se.user_id END) AS completed_count,
      COUNT(DISTINCT CASE WHEN se.event_type = 'step_skipped' THEN se.user_id END) AS skipped_count,
      AVG(CASE WHEN se.time_spent_seconds IS NOT NULL THEN se.time_spent_seconds END) AS avg_time_seconds
    FROM step_events se
    GROUP BY se.step_name
  )
  SELECT 
    ss.step_name,
    ss.step_order,
    ss.started_count,
    ss.completed_count,
    ss.skipped_count,
    GREATEST(0, ss.started_count - ss.completed_count - ss.skipped_count) AS abandoned_count,
    CASE 
      WHEN ss.started_count > 0 
      THEN ROUND(((ss.completed_count + ss.skipped_count)::numeric / ss.started_count::numeric) * 100, 2)
      ELSE 0 
    END AS conversion_rate,
    COALESCE(ROUND(ss.avg_time_seconds, 2), 0) AS average_time_seconds,
    CASE 
      WHEN ss.started_count > 0 
      THEN ROUND((GREATEST(0, ss.started_count - ss.completed_count - ss.skipped_count)::numeric / ss.started_count::numeric) * 100, 2)
      ELSE 0 
    END AS drop_off_rate
  FROM step_stats ss
  ORDER BY ss.step_order;
END;
$$;

-- =====================================================
-- USER JOURNEY ANALYSIS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_journey_summary(
  target_user_id UUID DEFAULT NULL,
  start_date TEXT DEFAULT NULL,
  end_date TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  journey_start_time TIMESTAMP,
  journey_end_time TIMESTAMP,
  total_time_spent_minutes NUMERIC,
  steps_completed TEXT[],
  steps_skipped TEXT[],
  completion_status TEXT,
  drop_off_step TEXT,
  platform TEXT,
  onboarding_version TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  filter_start_date timestamp;
  filter_end_date timestamp;
BEGIN
  -- Set default date range if not provided
  filter_start_date := COALESCE(start_date::timestamp, NOW() - INTERVAL '30 days');
  filter_end_date := COALESCE(end_date::timestamp, NOW());

  RETURN QUERY
  WITH user_events AS (
    SELECT 
      oa.user_id,
      oa.event_type,
      oa.step_name,
      oa.event_timestamp,
      oa.time_spent_seconds,
      oa.platform,
      oa.onboarding_version
    FROM onboarding_analytics oa
    WHERE (target_user_id IS NULL OR oa.user_id = target_user_id)
      AND oa.event_timestamp >= filter_start_date
      AND oa.event_timestamp <= filter_end_date
  ),
  user_journey_stats AS (
    SELECT 
      ue.user_id,
      MIN(ue.event_timestamp) AS journey_start_time,
      MAX(ue.event_timestamp) AS journey_end_time,
      SUM(COALESCE(ue.time_spent_seconds, 0)) / 60.0 AS total_time_spent_minutes,
      array_agg(DISTINCT ue.step_name) FILTER (WHERE ue.event_type = 'step_completed' AND ue.step_name IS NOT NULL) AS steps_completed,
      array_agg(DISTINCT ue.step_name) FILTER (WHERE ue.event_type = 'step_skipped' AND ue.step_name IS NOT NULL) AS steps_skipped,
      CASE 
        WHEN bool_or(ue.event_type = 'onboarding_completed') THEN 'completed'
        WHEN bool_or(ue.event_type = 'onboarding_abandoned') THEN 'abandoned'
        ELSE 'in_progress'
      END AS completion_status,
      (array_agg(ue.step_name ORDER BY ue.event_timestamp DESC) FILTER (WHERE ue.step_name IS NOT NULL))[1] AS drop_off_step,
      (array_agg(ue.platform ORDER BY ue.event_timestamp DESC) FILTER (WHERE ue.platform IS NOT NULL))[1] AS platform,
      (array_agg(ue.onboarding_version ORDER BY ue.event_timestamp DESC) FILTER (WHERE ue.onboarding_version IS NOT NULL))[1] AS onboarding_version
    FROM user_events ue
    GROUP BY ue.user_id
  )
  SELECT 
    ujs.user_id,
    ujs.journey_start_time,
    ujs.journey_end_time,
    ROUND(ujs.total_time_spent_minutes, 2) AS total_time_spent_minutes,
    COALESCE(ujs.steps_completed, ARRAY[]::TEXT[]) AS steps_completed,
    COALESCE(ujs.steps_skipped, ARRAY[]::TEXT[]) AS steps_skipped,
    ujs.completion_status,
    ujs.drop_off_step,
    ujs.platform,
    ujs.onboarding_version
  FROM user_journey_stats ujs
  ORDER BY ujs.journey_start_time DESC;
END;
$$;

-- =====================================================
-- DROP-OFF ANALYSIS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_drop_off_analysis(
  start_date TEXT DEFAULT NULL,
  end_date TEXT DEFAULT NULL
)
RETURNS TABLE (
  step_name TEXT,
  drop_off_count BIGINT,
  drop_off_rate NUMERIC,
  avg_session_duration_before_drop_off NUMERIC,
  common_validation_errors JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
  filter_start_date timestamp;
  filter_end_date timestamp;
BEGIN
  -- Set default date range if not provided
  filter_start_date := COALESCE(start_date::timestamp, NOW() - INTERVAL '30 days');
  filter_end_date := COALESCE(end_date::timestamp, NOW());

  RETURN QUERY
  WITH user_journeys AS (
    SELECT 
      user_id,
      bool_or(event_type = 'onboarding_completed') AS completed,
      bool_or(event_type = 'onboarding_abandoned') AS abandoned,
      (array_agg(step_name ORDER BY event_timestamp DESC) FILTER (WHERE step_name IS NOT NULL))[1] AS last_step,
      SUM(COALESCE(time_spent_seconds, 0)) / 60.0 AS total_time_minutes,
      jsonb_object_agg(
        COALESCE(step_name, 'unknown'), 
        validation_errors
      ) FILTER (WHERE validation_errors IS NOT NULL) AS all_validation_errors
    FROM onboarding_analytics
    WHERE event_timestamp >= filter_start_date
      AND event_timestamp <= filter_end_date
    GROUP BY user_id
  ),
  step_drop_offs AS (
    SELECT 
      uj.last_step AS step_name,
      COUNT(*) AS drop_off_count,
      AVG(uj.total_time_minutes) AS avg_session_duration,
      jsonb_object_agg(
        error_key, 
        error_count
      ) AS common_validation_errors
    FROM user_journeys uj
    CROSS JOIN LATERAL (
      SELECT 
        error_key,
        COUNT(*) AS error_count
      FROM jsonb_each(uj.all_validation_errors) AS step_errors(step_name, errors)
      CROSS JOIN LATERAL jsonb_object_keys(step_errors.errors) AS error_key
      GROUP BY error_key
    ) error_summary
    WHERE NOT uj.completed AND (uj.abandoned OR uj.last_step IS NOT NULL)
    GROUP BY uj.last_step
  ),
  total_users_per_step AS (
    SELECT 
      step_name,
      COUNT(DISTINCT user_id) AS total_users
    FROM onboarding_analytics
    WHERE event_type = 'step_started'
      AND event_timestamp >= filter_start_date
      AND event_timestamp <= filter_end_date
      AND step_name IS NOT NULL
    GROUP BY step_name
  )
  SELECT 
    COALESCE(sdo.step_name, 'unknown') AS step_name,
    sdo.drop_off_count,
    CASE 
      WHEN tups.total_users > 0 
      THEN ROUND((sdo.drop_off_count::numeric / tups.total_users::numeric) * 100, 2)
      ELSE 0 
    END AS drop_off_rate,
    ROUND(sdo.avg_session_duration, 2) AS avg_session_duration_before_drop_off,
    COALESCE(sdo.common_validation_errors, '{}'::jsonb) AS common_validation_errors
  FROM step_drop_offs sdo
  LEFT JOIN total_users_per_step tups ON sdo.step_name = tups.step_name
  ORDER BY sdo.drop_off_count DESC;
END;
$$;

-- =====================================================
-- PLATFORM PERFORMANCE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_platform_performance(
  start_date TEXT DEFAULT NULL,
  end_date TEXT DEFAULT NULL
)
RETURNS TABLE (
  platform TEXT,
  total_users BIGINT,
  completed_users BIGINT,
  completion_rate NUMERIC,
  avg_completion_time_minutes NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  filter_start_date timestamp;
  filter_end_date timestamp;
BEGIN
  -- Set default date range if not provided
  filter_start_date := COALESCE(start_date::timestamp, NOW() - INTERVAL '30 days');
  filter_end_date := COALESCE(end_date::timestamp, NOW());

  RETURN QUERY
  WITH user_platform_stats AS (
    SELECT 
      user_id,
      (array_agg(platform ORDER BY event_timestamp DESC) FILTER (WHERE platform IS NOT NULL))[1] AS user_platform,
      bool_or(event_type = 'onboarding_completed') AS completed,
      SUM(COALESCE(time_spent_seconds, 0)) / 60.0 AS total_time_minutes
    FROM onboarding_analytics
    WHERE event_timestamp >= filter_start_date
      AND event_timestamp <= filter_end_date
    GROUP BY user_id
  )
  SELECT 
    COALESCE(ups.user_platform, 'unknown') AS platform,
    COUNT(*)::BIGINT AS total_users,
    COUNT(*) FILTER (WHERE ups.completed)::BIGINT AS completed_users,
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE ups.completed)::numeric / COUNT(*)::numeric) * 100, 2)
      ELSE 0 
    END AS completion_rate,
    ROUND(AVG(ups.total_time_minutes) FILTER (WHERE ups.completed), 2) AS avg_completion_time_minutes
  FROM user_platform_stats ups
  GROUP BY ups.user_platform
  ORDER BY total_users DESC;
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_onboarding_completion_trends(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_onboarding_funnel_data(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_journey_summary(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_drop_off_analysis(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_performance(TEXT, TEXT) TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION get_onboarding_completion_trends(TEXT, TEXT, TEXT, TEXT) IS 
'Returns onboarding completion trends over time with configurable date grouping';

COMMENT ON FUNCTION get_onboarding_funnel_data(TEXT, TEXT) IS 
'Returns funnel analysis data for onboarding steps with conversion rates and drop-off analysis';

COMMENT ON FUNCTION get_user_journey_summary(UUID, TEXT, TEXT) IS 
'Returns summarized user journey data for individual users or all users in a date range';

COMMENT ON FUNCTION get_drop_off_analysis(TEXT, TEXT) IS 
'Returns detailed drop-off analysis including validation errors and session duration';

COMMENT ON FUNCTION get_platform_performance(TEXT, TEXT) IS 
'Returns platform-specific performance metrics for onboarding completion'; 