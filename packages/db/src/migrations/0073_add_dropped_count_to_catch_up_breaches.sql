ALTER TABLE "routine_catch_up_breaches" ADD COLUMN IF NOT EXISTS "dropped_count" integer DEFAULT 0 NOT NULL;
