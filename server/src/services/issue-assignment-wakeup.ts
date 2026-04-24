/**
 * Issue assignment wakeup service.
 * 
 * This module handles automatic wakeups when issues are assigned to agents.
 * Default behavior changed in v1.1: errors now propagate unless explicitly suppressed.
 * 
 * Related: BOB-2495 (failure detection), BOB-3478 (hardened defaults)
 */
import { logger } from "../middleware/logger.js";

type WakeupTriggerDetail = "manual" | "ping" | "callback" | "system";
type WakeupSource = "timer" | "assignment" | "on_demand" | "automation";

export interface IssueAssignmentWakeupDeps {
  wakeup: (
    agentId: string,
    opts: {
      source?: WakeupSource;
      triggerDetail?: WakeupTriggerDetail;
      reason?: string | null;
      payload?: Record<string, unknown> | null;
      requestedByActorType?: "user" | "agent" | "system";
      requestedByActorId?: string | null;
      contextSnapshot?: Record<string, unknown>;
    },
  ) => Promise<unknown>;
}

/**
 * Queue an issue assignment wakeup.
 * 
 * Default behavior: `rethrowOnError: true` (v1.1+)
 * - Errors are propagated to calling code
 * - Failed wakeups trigger retry or alert mechanism
 * - This prevents silent assignment failures (BOB-2495 follow-up)
 * 
 * For fire-and-forget patterns (e.g., non-critical assignments),
 * explicitly set `rethrowOnError: false`.
 */
export function queueIssueAssignmentWakeup(input: {
  heartbeat: IssueAssignmentWakeupDeps;
  issue: { id: string; assigneeAgentId: string | null; status: string };
  reason: string;
  mutation: string;
  contextSource: string;
  requestedByActorType?: "user" | "agent" | "system";
  requestedByActorId?: string | null;
  rethrowOnError?: boolean;
}) {
  const rethrowOnError = input.rethrowOnError ?? true;
  if (!input.issue.assigneeAgentId || input.issue.status === "backlog") return;

  return input.heartbeat
    .wakeup(input.issue.assigneeAgentId, {
      source: "assignment",
      triggerDetail: "system",
      reason: input.reason,
      payload: { issueId: input.issue.id, mutation: input.mutation },
      requestedByActorType: input.requestedByActorType,
      requestedByActorId: input.requestedByActorId ?? null,
      contextSnapshot: { issueId: input.issue.id, source: input.contextSource },
    })
    .catch((err) => {
      logger.warn({ err, issueId: input.issue.id }, "failed to wake assignee on issue assignment");
      if (rethrowOnError) throw err;
      return null;
    });
}
