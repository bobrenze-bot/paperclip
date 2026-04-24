-- Migration: Add routine catch-up cap breach tracking table
-- Phase: BOB-3480 Enhancement - Track routine catch-up cap breaches

CREATE TABLE IF NOT EXISTS routine_catch_up_breaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  trigger_id UUID REFERENCES routine_triggers(id) ON DELETE SET NULL,
  missed_count INTEGER NOT NULL,
  cap_value INTEGER NOT NULL DEFAULT 25,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  acknowledged_by_user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS routine_catch_up_breaches_company_routine_idx 
ON routine_catch_up_breaches(company_id, routine_id, detected_at);

CREATE INDEX IF NOT EXISTS routine_catch_up_breaches_routine_trigger_idx 
ON routine_catch_up_breaches(routine_id, trigger_id, detected_at);

CREATE INDEX IF NOT EXISTS routine_catch_up_breaches_detected_at_idx 
ON routine_catch_up_breaches(detected_at);
