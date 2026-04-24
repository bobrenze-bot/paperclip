-- Migration: Add stuck run auto-escalation fields for Phase 3
-- Phase 3: Stuck-Run Auto-Escalation implementation

-- Add fields for admin review task tracking
ALTER TABLE heartbeat_runs 
ADD COLUMN IF NOT EXISTS stuck_admin_review_task_id UUID,
ADD COLUMN IF NOT EXISTS stuck_admin_review_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stuck_admin_review_notified_at TIMESTAMP WITH TIME ZONE;

-- Add fields for auto-cancellation tracking
ALTER TABLE heartbeat_runs 
ADD COLUMN IF NOT EXISTS stuck_cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stuck_cancelled_by TEXT, -- 'auto_escalation', 'manual', 'admin'
ADD COLUMN IF NOT EXISTS stuck_cancel_reason TEXT,
ADD COLUMN IF NOT EXISTS stuck_cancellation_notified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stuck_grace_period_started_at TIMESTAMP WITH TIME ZONE;

-- Add fields for recovery/retry flow
ALTER TABLE heartbeat_runs 
ADD COLUMN IF NOT EXISTS stuck_retry_of_run_id UUID REFERENCES heartbeat_runs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS stuck_retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stuck_retry_scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stuck_recovery_status TEXT DEFAULT 'none', -- 'none', 'retry_pending', 'retry_completed', 'failed'
ADD COLUMN IF NOT EXISTS stuck_recovery_completed_at TIMESTAMP WITH TIME ZONE;

-- Add per-agent opt-out field (stored on agent record, but we track when run opted-out)
ALTER TABLE heartbeat_runs 
ADD COLUMN IF NOT EXISTS stuck_opt_out_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stuck_opt_out_by TEXT;

-- Add circuit breaker tracking
ALTER TABLE heartbeat_runs 
ADD COLUMN IF NOT EXISTS stuck_circuit_breaker_triggered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stuck_circuit_breaker_reason TEXT;

-- Add index for efficient admin review queries
CREATE INDEX IF NOT EXISTS heartbeat_runs_stuck_admin_review_idx 
ON heartbeat_runs(company_id, stuck_admin_review_task_id, stuck_admin_review_created_at);

-- Add index for cancelled runs
CREATE INDEX IF NOT EXISTS heartbeat_runs_stuck_cancelled_idx 
ON heartbeat_runs(company_id, stuck_cancelled_at, stuck_recovery_status);

-- Add index for retry tracking
CREATE INDEX IF NOT EXISTS heartbeat_runs_stuck_retry_idx 
ON heartbeat_runs(company_id, stuck_retry_of_run_id, stuck_retry_scheduled_at);

-- Add index for circuit breaker queries
CREATE INDEX IF NOT EXISTS heartbeat_runs_stuck_circuit_breaker_idx 
ON heartbeat_runs(company_id, stuck_circuit_breaker_triggered, stuck_cancelled_at);
