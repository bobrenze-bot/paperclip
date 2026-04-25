import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { agents, agentWakeupRequests, approvals, companies, costEvents, heartbeatRuns, issues, routineCatchUpBreaches } from "@paperclipai/db";
import { notFound } from "../errors.js";
import { budgetService } from "./budgets.js";
import { publishLiveEvent } from "./live-events.js";

const DASHBOARD_RUN_ACTIVITY_DAYS = 14;
const REFILL_THRESHOLD = 10;
const REFILL_ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

// Rate limiter: Map<companyId, timestamp>
const refillAlertCooldowns = new Map<string, number>();

// Local type definitions for stuck run metrics
interface StuckRunFlaggedRun {
  runId: string;
  agentId: string;
  agentName: string | null;
  issueId: string | null;
  issueIdentifier: string | null;
  issueTitle: string | null;
  stuckScore: number;
  stuckStatus: "warning" | "critical" | "none";
  detectedAt: string;
  startedAt: string | null;
  hoursInStatus: number;
  detectionReasons: string[];
  warningPostedAt: string | null;
  warningDismissedAt: string | null;
  estimatedCostCents: number;
}

interface StuckRunHistoricalData {
  date: string;
  warningCount: number;
  criticalCount: number;
  dismissedCount: number;
  cancellationCount: number;
  avgScore: number;
}

function formatUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getUtcMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function getRecentUtcDateKeys(now: Date, days: number): string[] {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: days }, (_, index) => {
    const dayOffset = index - (days - 1);
    return formatUtcDateKey(new Date(todayUtc + dayOffset * 24 * 60 * 60 * 1000));
  });
}

function getRoutineCatchUpBreachesSummary(db: Db, companyId: string) {
  return db
    .select({
      totalBreaches: sql<number>`count(*)`,
      totalMissedRuns: sql<number>`coalesce(sum(${routineCatchUpBreaches.missedCount}), 0)`,
      maxMissedInSingleBreach: sql<number>`coalesce(max(${routineCatchUpBreaches.missedCount}), 0)`,
      acknowledgedCount: sql<number>`count(*) filter (where ${routineCatchUpBreaches.acknowledgedAt} is not null)`,
    })
    .from(routineCatchUpBreaches)
    .where(eq(routineCatchUpBreaches.companyId, companyId))
    .then((rows) => {
      const summary = rows[0];
      return {
        totalBreaches: Number(summary?.totalBreaches ?? 0),
        totalMissedRuns: Number(summary?.totalMissedRuns ?? 0),
        maxMissedInSingleBreach: Number(summary?.maxMissedInSingleBreach ?? 0),
        totalDroppedRuns: 0,
        maxDroppedInSingleBreach: 0,
        acknowledgedCount: Number(summary?.acknowledgedCount ?? 0),
        hasUnacknowledgedBreaches: (summary?.acknowledgedCount ?? 0) < (summary?.totalBreaches ?? 0),
      };
    });
}

export function dashboardService(db: Db) {
  const budgets = budgetService(db);
  return {
    summary: async (companyId: string) => {
      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .then((rows) => rows[0] ?? null);

      if (!company) throw notFound("Company not found");

      const agentRows = await db
        .select({ status: agents.status, count: sql<number>`count(*)` })
        .from(agents)
        .where(eq(agents.companyId, companyId))
        .groupBy(agents.status);

      const taskRows = await db
        .select({ status: issues.status, count: sql<number>`count(*)` })
        .from(issues)
        .where(eq(issues.companyId, companyId))
        .groupBy(issues.status);

      const pendingApprovals = await db
        .select({ count: sql<number>`count(*)` })
        .from(approvals)
        .where(and(eq(approvals.companyId, companyId), eq(approvals.status, "pending")))
        .then((rows) => Number(rows[0]?.count ?? 0));

      const agentCounts: Record<string, number> = {
        active: 0,
        running: 0,
        paused: 0,
        error: 0,
      };
      for (const row of agentRows) {
        const count = Number(row.count);
        // "idle" agents are operational — count them as active
        const bucket = row.status === "idle" ? "active" : row.status;
        agentCounts[bucket] = (agentCounts[bucket] ?? 0) + count;
      }

      const taskCounts: Record<string, number> = {
        open: 0,
        inProgress: 0,
        blocked: 0,
        done: 0,
        cancelled: 0,
      };
      for (const row of taskRows) {
        const count = Number(row.count);
        if (row.status === "in_progress") taskCounts.inProgress += count;
        if (row.status === "blocked") taskCounts.blocked += count;
        if (row.status === "done") taskCounts.done += count;
        if (row.status === "cancelled") taskCounts.cancelled += count;
        if (row.status !== "done" && row.status !== "cancelled") taskCounts.open += count;
      }

      const totalTasks = 
        taskCounts.done + 
        taskCounts.cancelled + 
        taskCounts.blocked + 
        taskCounts.inProgress + 
        taskCounts.open;
      const errorRate = totalTasks > 0 
        ? ((taskCounts.cancelled + taskCounts.blocked) / totalTasks) * 100 
        : 0;

      const now = new Date();
      const monthStart = getUtcMonthStart(now);
      const runActivityDays = getRecentUtcDateKeys(now, DASHBOARD_RUN_ACTIVITY_DAYS);
      const runActivityStart = new Date(`${runActivityDays[0]}T00:00:00.000Z`);
      const [{ monthSpend }] = await db
        .select({
          monthSpend: sql<number>`coalesce(sum(${costEvents.costCents}), 0)::double precision`,
        })
        .from(costEvents)
        .where(
          and(
            eq(costEvents.companyId, companyId),
            gte(costEvents.occurredAt, monthStart),
          ),
        );

      const monthSpendCents = Number(monthSpend);
      const runActivityDayExpr = sql<string>`to_char(${heartbeatRuns.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`;
      const runActivityRows = await db
        .select({
          date: runActivityDayExpr,
          status: heartbeatRuns.status,
          count: sql<number>`count(*)::double precision`,
        })
        .from(heartbeatRuns)
        .where(
          and(
            eq(heartbeatRuns.companyId, companyId),
            gte(heartbeatRuns.createdAt, runActivityStart),
          ),
        )
        .groupBy(runActivityDayExpr, heartbeatRuns.status);

      const runActivity = new Map(
        runActivityDays.map((date) => [
          date,
          { date, succeeded: 0, failed: 0, other: 0, total: 0 },
        ]),
      );
      for (const row of runActivityRows) {
        const bucket = runActivity.get(row.date);
        if (!bucket) continue;
        const count = Number(row.count);
        if (row.status === "succeeded") bucket.succeeded += count;
        else if (row.status === "failed" || row.status === "timed_out") bucket.failed += count;
        else bucket.other += count;
        bucket.total += count;
      }

      const utilization =
        company.budgetMonthlyCents > 0
          ? (monthSpendCents / company.budgetMonthlyCents) * 100
          : 0;
      const budgetOverview = await budgets.overview(companyId);

      return {
        companyId,
        agents: {
          active: agentCounts.active,
          running: agentCounts.running,
          paused: agentCounts.paused,
          error: agentCounts.error,
        },
        tasks: taskCounts,
        errorRate: Number(errorRate.toFixed(2)),
        costs: {
          monthSpendCents,
          monthBudgetCents: company.budgetMonthlyCents,
          monthUtilizationPercent: Number(utilization.toFixed(2)),
        },
        pendingApprovals,
        budgets: {
          activeIncidents: budgetOverview.activeIncidents.length,
          pendingApprovals: budgetOverview.pendingApprovalCount,
          pausedAgents: budgetOverview.pausedAgentCount,
          pausedProjects: budgetOverview.pausedProjectCount,
        },
        runActivity: Array.from(runActivity.values()),
        routineCatchUpBreaches: await getRoutineCatchUpBreachesSummary(db, companyId),
      };
    },
    queueHealth: async (companyId: string) => {
      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .then((rows) => rows[0] ?? null);

      if (!company) throw notFound("Company not found");

      const taskRows = await db
        .select({ status: issues.status, count: sql<number>`count(*)` })
        .from(issues)
        .where(eq(issues.companyId, companyId))
        .groupBy(issues.status);

      const taskCounts: Record<string, number> = {
        todo: 0,
        inProgress: 0,
        inReview: 0,
        blocked: 0,
        backlog: 0,
      };

      for (const row of taskRows) {
        const count = Number(row.count);
        if (row.status === "todo") taskCounts.todo += count;
        if (row.status === "in_progress") taskCounts.inProgress += count;
        if (row.status === "in_review") taskCounts.inReview += count;
        if (row.status === "blocked") taskCounts.blocked += count;
        if (row.status === "backlog") taskCounts.backlog += count;
      }

      const actionable = taskCounts.todo + taskCounts.inProgress + taskCounts.inReview;
      const blocked = taskCounts.blocked;
      const backlog = taskCounts.backlog;
      const total = actionable + blocked + backlog;

      const blockedRatio = total > 0 ? blocked / total : 0;

      const refillStatus =
        blockedRatio > 0.4
          ? "warning"
          : blockedRatio > 0.3
          ? "monitor"
          : blockedRatio > 0.2
          ? "critical"
          : "normal";

      const suppressed = blockedRatio > 0.3 && actionable >= 5;
      const suppressionReason = blockedRatio > 0.4 ? "high" : "elevated";

      const ratio = actionable > 0 ? actionable / REFILL_THRESHOLD : 0;
      const status = ratio > 1 ? "normal" : refillStatus;

      // Emit warning alert when critical (only once per 30 min per company)
      if (status === "critical") {
        const nowMs = Date.now();
        const lastAlert = refillAlertCooldowns.get(companyId) ?? 0;
        if (nowMs - lastAlert >= REFILL_ALERT_COOLDOWN_MS) {
          publishLiveEvent({
            companyId,
            type: "dashboard_refill_alert",
            payload: {
              status: "critical",
              actionable,
              threshold: REFILL_THRESHOLD,
              ratio,
              blockedRatio,
              timestamp: new Date().toISOString(),
            },
          });
          refillAlertCooldowns.set(companyId, nowMs);
        }
      }

      const message = suppressed
        ? `WARNING: Queue getting low (${actionable} tasks). Refill suppressed: ${Math.round(
            blockedRatio * 100,
          )}% of work blocked. Resolve blockers before refilling.`
        : `Queue has ${actionable} actionable tasks. Blocked ratio: ${Math.round(
            blockedRatio * 100,
          )}%.`;

      return {
        companyId,
        queue: {
          actionable,
          blocked,
          backlog,
          total,
        },
        refillRisk: {
          status,
          threshold: REFILL_THRESHOLD,
          current: actionable,
          ratio,
          blockedRatio,
          suppressed,
          message,
        },
      };
    },
    performance: async (_companyId: string, _days?: number) => {
      return {
        companyId: _companyId,
        dailyStats: [],
        trend: "stable",
        comparison: {
          previousPeriod: { value: 0 },
          currentPeriod: { value: 0 },
        },
      };
    },
    weeklyReport: async (_companyId: string) => {
      return {
        companyId: _companyId,
        period: {
          start: new Date().toISOString(),
          end: new Date().toISOString(),
        },
        summary: {
          totalRuns: 0,
          successRate: 0,
          totalCostCents: 0,
        },
        agentStats: [],
      };
    },

    assigneeStarvation: async (companyId: string, thresholdHours: number = 24) => {
      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .then((rows) => rows[0] ?? null);

      if (!company) throw notFound("Company not found");

      const thresholdMs = thresholdHours * 60 * 60 * 1000;
      const now = Date.now();
      const staleThreshold = new Date(now - thresholdMs);

      // Find all assigned tasks that haven't been updated recently
      const starvedTasks = await db
        .select({
          id: issues.id,
          identifier: issues.identifier,
          title: issues.title,
          status: issues.status,
          priority: issues.priority,
          assigneeAgentId: issues.assigneeAgentId,
          updatedAt: issues.updatedAt,
          executionLockedAt: issues.executionLockedAt,
          createdAt: issues.createdAt,
        })
        .from(issues)
        .where(
          and(
            eq(issues.companyId, companyId),
            sql`${issues.assigneeAgentId} is not null`,
            sql`${issues.status} in ('todo', 'in_progress', 'in_review')`,
            sql`${issues.updatedAt} < ${staleThreshold}`,
          ),
        );

      // Get agent details for starved tasks
      const agentIds = [...new Set(starvedTasks.map((t) => t.assigneeAgentId).filter(Boolean))];
      const agentRows = agentIds.length > 0
        ? await db
            .select({
              id: agents.id,
              name: agents.name,
              status: agents.status,
            })
            .from(agents)
            .where(sql`${agents.id} in (${agentIds.join(",")})`)
        : [];

      const agentMap = new Map(agentRows.map((a) => [a.id, a]));

      // Calculate per-agent starvation metrics
      const agentStarvation = new Map<
        string,
        {
          agentId: string;
          agentName: string | null;
          agentStatus: string;
          starvedCount: number;
          oldestTaskHours: number;
          avgStalenessHours: number;
          tasks: Array<{
            id: string;
            identifier: string | null;
            title: string;
            status: string;
            priority: string;
            staleHours: number;
            lastUpdated: string;
          }>;
        }
      >();

      for (const task of starvedTasks) {
        const agentId = task.assigneeAgentId!;
        const agent = agentMap.get(agentId);
        const staleMs = now - new Date(task.updatedAt).getTime();
        const staleHours = Math.round(staleMs / (1000 * 60 * 60) * 10) / 10;

        if (!agentStarvation.has(agentId)) {
          agentStarvation.set(agentId, {
            agentId,
            agentName: agent?.name ?? null,
            agentStatus: agent?.status ?? "unknown",
            starvedCount: 0,
            oldestTaskHours: staleHours,
            avgStalenessHours: 0,
            tasks: [],
          });
        }

        const stats = agentStarvation.get(agentId)!;
        stats.starvedCount++;
        stats.tasks.push({
          id: task.id,
          identifier: task.identifier,
          title: task.title,
          status: task.status,
          priority: task.priority,
          staleHours,
          lastUpdated: task.updatedAt.toISOString(),
        });

        if (staleHours > stats.oldestTaskHours) {
          stats.oldestTaskHours = staleHours;
        }
      }

      // Calculate average staleness for each agent
      for (const stats of agentStarvation.values()) {
        const totalHours = stats.tasks.reduce((sum, t) => sum + t.staleHours, 0);
        stats.avgStalenessHours = Math.round((totalHours / stats.tasks.length) * 10) / 10;
      }

      // Get total assigned tasks for ratio calculation
      const totalAssignedResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(issues)
        .where(
          and(
            eq(issues.companyId, companyId),
            sql`${issues.assigneeAgentId} is not null`,
            sql`${issues.status} in ('todo', 'in_progress', 'in_review')`,
          ),
        )
        .then((rows) => Number(rows[0]?.count ?? 0));

      const starvedCount = starvedTasks.length;
      const totalAssigned = totalAssignedResult;
      const starvationRatio = totalAssigned > 0 ? starvedCount / totalAssigned : 0;

      // Determine status and alert level
      let status: "normal" | "warning" | "critical";
      let alert: string | null = null;

      if (starvationRatio > 0.5) {
        status = "critical";
        alert = `CRITICAL: ${Math.round(starvationRatio * 100)}% of assigned tasks are starved (>50%). Immediate attention required.`;
      } else if (starvationRatio > 0.3) {
        status = "warning";
        alert = `WARNING: ${Math.round(starvationRatio * 100)}% of assigned tasks are starved (>30%). Review agent workloads.`;
      } else if (starvedCount > 0) {
        status = "normal";
      } else {
        status = "normal";
      }

      return {
        companyId,
        thresholdHours,
        summary: {
          totalAssigned,
          starvedCount,
          starvationRatio: Math.round(starvationRatio * 1000) / 1000,
          status,
          alert,
        },
        agents: Array.from(agentStarvation.values()).sort((a, b) => b.starvedCount - a.starvedCount),
      };
    },

    stuckRunMetrics: async (companyId: string, periodDays: number = 30) => {
      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .then((rows) => rows[0] ?? null);

      if (!company) throw notFound("Company not found");

      const now = new Date();
      const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

      // Query all stuck-flagged runs in the period
      const flaggedRunsQuery = await db
        .select({
          runId: heartbeatRuns.id,
          agentId: heartbeatRuns.agentId,
          wakeupRequestId: heartbeatRuns.wakeupRequestId,
          stuckScore: heartbeatRuns.stuckScore,
          stuckStatus: heartbeatRuns.stuckStatus,
          lastStuckCheckAt: heartbeatRuns.lastStuckCheckAt,
          startedAt: heartbeatRuns.startedAt,
          finishedAt: heartbeatRuns.finishedAt,
          stuckWarningCommentPostedAt: heartbeatRuns.stuckWarningCommentPostedAt,
          stuckWarningDismissedAt: heartbeatRuns.stuckWarningDismissedAt,
          logBytes: heartbeatRuns.logBytes,
        })
        .from(heartbeatRuns)
        .where(
          and(
            eq(heartbeatRuns.companyId, companyId),
            sql`${heartbeatRuns.stuckStatus} in ('warning', 'critical')`,
            gte(heartbeatRuns.lastStuckCheckAt, periodStart),
          ),
        )
        .orderBy(desc(heartbeatRuns.lastStuckCheckAt));

      // Get agent details
      const agentIds = [...new Set(flaggedRunsQuery.map((r) => r.agentId).filter(Boolean))];
      const agentRows = agentIds.length > 0
        ? await db
            .select({
              id: agents.id,
              name: agents.name,
            })
            .from(agents)
            .where(sql`${agents.id} in (${agentIds.join(",")})`)
        : [];
      const agentMap = new Map(agentRows.map((a) => [a.id, a]));

      // Build lookup for issue info from heartbeat runs directly
      // Note: wakeupRequestId links to agent_wakeup_requests, which doesn't have direct issueId
      // Issue info will be populated from other sources if available
      const issueMap = new Map();

      // Build flagged runs list with details
      const flaggedRuns: StuckRunFlaggedRun[] = flaggedRunsQuery.map((run) => {
        const issueInfo = run.wakeupRequestId ? issueMap.get(run.wakeupRequestId) : null;
        const detectedAt = run.lastStuckCheckAt!;
        const hoursInStatus = Math.round(
          (now.getTime() - new Date(detectedAt).getTime()) / (1000 * 60 * 60)
        );
        
        // Estimate cost: rough approximation based on log bytes (1KB ~ $0.001)
        const estimatedCostCents = run.logBytes 
          ? Math.round(run.logBytes / 1024 * 0.1) 
          : 0;

        // Build detection reasons from score components
        const detectionReasons: string[] = [];
        if (run.stuckScore && run.stuckScore >= 6) detectionReasons.push("high_score");
        if (run.stuckWarningCommentPostedAt) detectionReasons.push("warning_posted");
        if (hoursInStatus > 24) detectionReasons.push("extended_duration");

        return {
          runId: run.runId,
          agentId: run.agentId,
          agentName: agentMap.get(run.agentId)?.name ?? null,
          issueId: issueInfo?.issueId ?? null,
          issueIdentifier: issueInfo?.issueIdentifier ?? null,
          issueTitle: issueInfo?.issueTitle ?? null,
          stuckScore: run.stuckScore ?? 0,
          stuckStatus: (run.stuckStatus as "warning" | "critical") ?? "none",
          detectedAt: detectedAt.toISOString(),
          startedAt: run.startedAt?.toISOString() ?? null,
          hoursInStatus,
          detectionReasons,
          warningPostedAt: run.stuckWarningCommentPostedAt?.toISOString() ?? null,
          warningDismissedAt: run.stuckWarningDismissedAt?.toISOString() ?? null,
          estimatedCostCents,
        };
      });

      // Calculate accuracy metrics
      const totalFlagged = flaggedRuns.length;
      const warningsPosted = flaggedRuns.filter((r) => r.warningPostedAt !== null).length;
      const warningsDismissed = flaggedRuns.filter((r) => r.warningDismissedAt !== null).length;
      
      // True positive = warning posted but not dismissed (still stuck)
      const truePositives = warningsPosted - warningsDismissed;
      const truePositiveRate = warningsPosted > 0 ? truePositives / warningsPosted : 0;
      
      // False positive = warning dismissed (was not actually stuck)
      const falsePositiveRate = warningsPosted > 0 ? warningsDismissed / warningsPosted : 0;
      
      // Confidence score based on data volume and consistency
      const confidenceScore = Math.min(100, Math.round(
        (warningsPosted > 10 ? 40 : warningsPosted * 4) + 
        (truePositiveRate * 40) +
        (totalFlagged > 0 ? 20 : 0)
      ));

      // Calculate timing metrics
      const detectionTimes = flaggedRuns
        .filter((r) => r.startedAt !== null)
        .map((r) => ({
          detection: new Date(r.detectedAt).getTime(),
          started: new Date(r.startedAt!).getTime(),
        }));
      
      const detectionHours = detectionTimes.map(
        (t) => Math.round((t.detection - t.started) / (1000 * 60 * 60) * 10) / 10
      );
      
      const meanTimeToDetectionHours = detectionHours.length > 0
        ? Math.round(detectionHours.reduce((a, b) => a + b, 0) / detectionHours.length * 10) / 10
        : 0;
      
      const sortedHours = [...detectionHours].sort((a, b) => a - b);
      const medianTimeToDetectionHours = sortedHours.length > 0
        ? sortedHours[Math.floor(sortedHours.length / 2)]
        : 0;
      
      const detectionFrequencyPerDay = totalFlagged / periodDays;
      const lastDetectionAt = flaggedRuns.length > 0 ? flaggedRuns[0].detectedAt : null;

      // Calculate cost savings
      const avgCostPerStuckRunCents = flaggedRuns.length > 0
        ? Math.round(flaggedRuns.reduce((sum, r) => sum + r.estimatedCostCents, 0) / flaggedRuns.length)
        : 0;
      
      // Estimate hours saved: assume early detection saves avg 4 hours per run
      const avgHoursSavedPerRun = 4;
      const estimatedSavedCents = warningsPosted * avgCostPerStuckRunCents;
      const potentialSavingsCents = (totalFlagged - warningsPosted) * avgCostPerStuckRunCents;

      // Phase 3: Calculate escalation metrics (auto-cancellations and admin reviews)
      const autoCancellationsQuery = await db
        .select({
          count: sql<number>`count(*)::int`,
          avgGracePeriodMinutes: sql<number>`avg(extract(epoch from (stuck_cancelled_at - stuck_grace_period_started_at))/60)::int`,
        })
        .from(heartbeatRuns)
        .where(
          and(
            eq(heartbeatRuns.companyId, companyId),
            gte(heartbeatRuns.stuckCancelledAt, periodStart),
            eq(heartbeatRuns.stuckCancelledBy, "auto_escalation"),
          ),
        );
      
      const totalAutoCancellations = autoCancellationsQuery[0]?.count ?? 0;
      const avgGracePeriodMinutes = autoCancellationsQuery[0]?.avgGracePeriodMinutes ?? 15;
      
      // Query for admin review tasks created in period
      const adminReviewsQuery = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(heartbeatRuns)
        .where(
          and(
            eq(heartbeatRuns.companyId, companyId),
            gte(heartbeatRuns.stuckAdminReviewCreatedAt, periodStart),
            sql`${heartbeatRuns.stuckAdminReviewTaskId} is not null`,
          ),
        );
      
      const totalAdminReviews = adminReviewsQuery[0]?.count ?? 0;
      
      // Query total runs in period for cancellation rate calculation
      const totalRunsQuery = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(heartbeatRuns)
        .where(
          and(
            eq(heartbeatRuns.companyId, companyId),
            gte(heartbeatRuns.createdAt, periodStart),
          ),
        );
      
      const totalRuns = totalRunsQuery[0]?.count ?? 0;
      const cancellationRate = totalRuns > 0 ? totalAutoCancellations / totalRuns : 0;
      const cancellationRatePercent = Math.round(cancellationRate * 10000) / 100; // 2 decimal places

      // Build historical data (last 14 days)
      const historicalData: StuckRunHistoricalData[] = [];
      for (let i = 13; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().slice(0, 10);
        const dayRuns = flaggedRuns.filter((r) => r.detectedAt.startsWith(dateStr));
        
        // Query cancellations for this day
        const dayCancellations = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(heartbeatRuns)
          .where(
            and(
              eq(heartbeatRuns.companyId, companyId),
              sql`date_trunc('day', ${heartbeatRuns.stuckCancelledAt}) = date_trunc('day', ${new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString()}::timestamp)`,
              eq(heartbeatRuns.stuckCancelledBy, "auto_escalation"),
            ),
          );
        
        historicalData.push({
          date: dateStr,
          warningCount: dayRuns.filter((r) => r.stuckStatus === "warning").length,
          criticalCount: dayRuns.filter((r) => r.stuckStatus === "critical").length,
          dismissedCount: dayRuns.filter((r) => r.warningDismissedAt !== null).length,
          cancellationCount: dayCancellations[0]?.count ?? 0,
          avgScore: dayRuns.length > 0
            ? Math.round(dayRuns.reduce((sum, r) => sum + r.stuckScore, 0) / dayRuns.length * 10) / 10
            : 0,
        });
      }

      // Determine alerting status and recommendations
      const activeWarnings = flaggedRuns.filter((r) => 
        r.stuckStatus === "warning" && r.warningDismissedAt === null
      ).length;
      const activeCritical = flaggedRuns.filter((r) => 
        r.stuckStatus === "critical" && r.warningDismissedAt === null
      ).length;
      const totalDismissed = warningsDismissed;

      const anomalousPatterns: string[] = [];
      if (falsePositiveRate > 0.3) anomalousPatterns.push("high_false_positive_rate");
      if (detectionFrequencyPerDay > 5) anomalousPatterns.push("high_detection_frequency");
      if (activeCritical > 3) anomalousPatterns.push("multiple_critical_stuck_runs");
      if (meanTimeToDetectionHours > 48) anomalousPatterns.push("slow_detection");
      // Phase 3: Cancellation rate threshold (< 2%)
      if (cancellationRate > 0.02) anomalousPatterns.push("high_cancellation_rate");

      let alertStatus: "normal" | "warning" | "critical" = "normal";
      let recommendation: string | null = null;

      if (activeCritical > 5 || falsePositiveRate > 0.5 || cancellationRate > 0.02) {
        alertStatus = "critical";
        recommendation = "Urgent: Multiple critical stuck runs, high false positive rate, or cancellation rate exceeds 2%. Review detection thresholds immediately.";
      } else if (activeWarnings > 10 || falsePositiveRate > 0.3) {
        alertStatus = "warning";
        recommendation = "Warning: Elevated stuck run activity. Consider reviewing detection accuracy and agent workload balance.";
      } else if (anomalousPatterns.length > 0) {
        alertStatus = "warning";
        recommendation = `Anomalous patterns detected: ${anomalousPatterns.join(", ")}. Monitor closely.`;
      }

      return {
        companyId,
        periodDays,
        generatedAt: now.toISOString(),
        summary: {
          totalFlaggedRuns: totalFlagged,
          activeWarnings,
          activeCritical,
          totalDismissed,
        },
        accuracy: {
          totalFlagged,
          warningsPosted,
          warningsDismissed,
          truePositiveRate: Math.round(truePositiveRate * 1000) / 1000,
          falsePositiveRate: Math.round(falsePositiveRate * 1000) / 1000,
          confidenceScore,
        },
        timing: {
          meanTimeToDetectionHours,
          medianTimeToDetectionHours,
          detectionFrequencyPerDay: Math.round(detectionFrequencyPerDay * 100) / 100,
          lastDetectionAt,
        },
        costSavings: {
          estimatedSavedCents,
          potentialSavingsCents,
          avgCostPerStuckRunCents,
          avgHoursSavedPerRun,
          periodDays,
        },
        // Phase 3: Escalation and cancellation metrics
        escalation: {
          totalAdminReviews,
          totalAutoCancellations,
          cancellationRate,
          cancellationRatePercent,
          avgGracePeriodMinutes,
        },
        flaggedRuns: flaggedRuns.slice(0, 100), // Limit to last 100 for performance
        historicalData,
        alerting: {
          status: alertStatus,
          anomalousPatterns,
          recommendation,
        },
      };
    },

    routineCatchUpBreaches: async (companyId: string, periodDays: number = 30) => {
      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .then((rows) => rows[0] ?? null);

      if (!company) throw notFound("Company not found");

      const now = new Date();
      const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

      const breachQuery = await db
        .select({
          id: routineCatchUpBreaches.id,
          routineId: routineCatchUpBreaches.routineId,
          triggerId: routineCatchUpBreaches.triggerId,
          missedCount: routineCatchUpBreaches.missedCount,
          capValue: routineCatchUpBreaches.capValue,
          droppedCount: routineCatchUpBreaches.droppedCount,
          detectedAt: routineCatchUpBreaches.detectedAt,
          acknowledgedAt: routineCatchUpBreaches.acknowledgedAt,
          acknowledgedByAgentId: routineCatchUpBreaches.acknowledgedByAgentId,
          acknowledgedByUserId: routineCatchUpBreaches.acknowledgedByUserId,
        })
        .from(routineCatchUpBreaches)
        .where(
          and(
            eq(routineCatchUpBreaches.companyId, companyId),
            gte(routineCatchUpBreaches.detectedAt, periodStart),
          ),
        )
        .orderBy(desc(routineCatchUpBreaches.detectedAt));

      const breachCount = breachQuery.length;
      const totalMissedRuns = breachQuery.reduce((sum, b) => sum + b.missedCount, 0);
      const totalDroppedRuns = breachQuery.reduce((sum, b) => sum + b.droppedCount, 0);
      const maxMissedInSingleBreach = Math.max(...breachQuery.map((b) => b.missedCount), 0);
      const maxDroppedInSingleBreach = Math.max(...breachQuery.map((b) => b.droppedCount), 0);
      const acknowledgedCount = breachQuery.filter((b) => b.acknowledgedAt !== null).length;

      const dailyBreachCounts = new Map<string, number>();
      for (const breach of breachQuery) {
        const dateKey = breach.detectedAt.toISOString().slice(0, 10);
        dailyBreachCounts.set(dateKey, (dailyBreachCounts.get(dateKey) ?? 0) + 1);
      }

      const peakBreachDay = Array.from(dailyBreachCounts.entries()).sort((a, b) => b[1] - a[1])[0];

      const hasUnacknowledgedBreaches = acknowledgedCount < breachCount;

      const routineIds = [...new Set(breachQuery.map((b) => b.routineId))];
      const triggerIds = [...new Set(breachQuery.filter((b) => b.triggerId).map((b) => b.triggerId!))];

      const routineBreachDetails = {
        companyId,
        periodDays,
        generatedAt: now.toISOString(),
        summary: {
          totalBreaches: breachCount,
          totalMissedRuns,
          totalDroppedRuns,
          maxMissedInSingleBreach,
          maxDroppedInSingleBreach,
          acknowledgedCount,
          hasUnacknowledgedBreaches,
        },
        routineIds,
        triggerIds,
        dailyDistribution: Array.from(dailyBreachCounts.entries()).map(([date, count]) => ({
          date,
          breachCount: count,
        })),
        peakBreachDay: peakBreachDay
          ? { date: peakBreachDay[0], breachCount: peakBreachDay[1] }
          : null,
        recentBreaches: breachQuery.slice(0, 100).map((b) => ({
          id: b.id,
          routineId: b.routineId,
          triggerId: b.triggerId,
          missedCount: b.missedCount,
          capValue: b.capValue,
          droppedCount: b.droppedCount,
          detectedAt: b.detectedAt.toISOString(),
          acknowledgedAt: b.acknowledgedAt?.toISOString() ?? null,
          acknowledgedByAgentId: b.acknowledgedByAgentId,
          acknowledgedByUserId: b.acknowledgedByUserId,
        })),
      };

      return routineBreachDetails;
    },

    // Stub for taskAgeReport - TODO: Implement full task age reporting
    taskAgeReport: async (companyId: string, periodDays: number = 30) => {
      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .then((rows) => rows[0] ?? null);

      if (!company) throw notFound("Company not found");

      // Return minimal stub implementation
      return {
        companyId,
        generatedAt: new Date().toISOString(),
        periodDays,
        freshnessThresholds: {
          healthyMaxAgeHours: 168,
          warningMaxAgeHours: 336,
          criticalMaxAgeHours: 720,
        },
        summary: {
          totalTasks: 0,
          avgAgeHours: 0,
          medianAgeHours: 0,
          oldestTaskHours: 0,
          newestTaskHours: 0,
          status: "fresh" as const,
          freshnessScore: 100,
          alert: null,
        },
        ageDistribution: [],
        byStatus: [],
        byAgent: [],
        oldestTasks: [],
        recommendations: [],
      };
    },
  };
}
