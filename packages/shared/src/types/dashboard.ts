export interface DashboardRunActivityDay {
  date: string;
  succeeded: number;
  failed: number;
  other: number;
  total: number;
}

export interface DashboardSummary {
  companyId: string;
  agents: {
    active: number;
    running: number;
    paused: number;
    error: number;
  };
  tasks: {
    open: number;
    inProgress: number;
    blocked: number;
    done: number;
  };
  costs: {
    monthSpendCents: number;
    monthBudgetCents: number;
    monthUtilizationPercent: number;
  };
  pendingApprovals: number;
  budgets: {
    activeIncidents: number;
    pendingApprovals: number;
    pausedAgents: number;
    pausedProjects: number;
  };
  runActivity: DashboardRunActivityDay[];
  routineCatchUpBreaches?: {
    totalBreaches: number;
    totalMissedRuns: number;
    maxMissedInSingleBreach: number;
    acknowledgedCount: number;
    hasUnacknowledgedBreaches: boolean;
  };
}

export interface QueueHealthRefillRisk {
  status: "warning" | "monitor" | "critical" | "normal";
  threshold: number;
  current: number;
  ratio: number;
  blockedRatio: number;
  suppressed: boolean;
  message: string;
}

export interface QueueHealth {
  companyId: string;
  queue: {
    actionable: number;
    blocked: number;
    backlog: number;
    total: number;
  };
  refillRisk: QueueHealthRefillRisk;
}

export interface AssigneeStarvationTask {
  id: string;
  identifier: string | null;
  title: string;
  status: string;
  priority: string;
  staleHours: number;
  lastUpdated: string;
}

export interface AssigneeStarvationAgent {
  agentId: string;
  agentName: string | null;
  agentStatus: string;
  starvedCount: number;
  oldestTaskHours: number;
  avgStalenessHours: number;
  tasks: AssigneeStarvationTask[];
}

export interface AssigneeStarvationSummary {
  totalAssigned: number;
  starvedCount: number;
  starvationRatio: number;
  status: "normal" | "warning" | "critical";
  alert: string | null;
}

export interface AssigneeStarvation {
  companyId: string;
  thresholdHours: number;
  summary: AssigneeStarvationSummary;
  agents: AssigneeStarvationAgent[];
}

// Stuck Run Detection Metrics
export interface StuckRunFlaggedRun {
  runId: string;
  agentId: string;
  agentName: string | null;
  issueId: string | null;
  issueIdentifier: string | null;
  issueTitle: string | null;
  stuckScore: number;
  stuckStatus: "warning" | "critical" | "none";
  detectedAt: string;
  hoursInStatus: number;
  detectionReasons: string[];
  warningPostedAt: string | null;
  warningDismissedAt: string | null;
  estimatedCostCents: number;
}

export interface StuckRunAccuracyMetrics {
  totalFlagged: number;
  warningsPosted: number;
  warningsDismissed: number;
  truePositiveRate: number; // 0-1, based on warnings that weren't dismissed
  falsePositiveRate: number; // 0-1, based on warnings that were dismissed
  confidenceScore: number; // 0-100
}

export interface StuckRunTimeMetrics {
  meanTimeToDetectionHours: number;
  medianTimeToDetectionHours: number;
  detectionFrequencyPerDay: number;
  lastDetectionAt: string | null;
}

export interface StuckRunCostSavings {
  estimatedSavedCents: number;
  potentialSavingsCents: number;
  avgCostPerStuckRunCents: number;
  avgHoursSavedPerRun: number;
  periodDays: number;
}

export interface StuckRunHistoricalData {
  date: string;
  warningCount: number;
  criticalCount: number;
  dismissedCount: number;
  cancellationCount: number;
  avgScore: number;
}

export interface StuckRunEscalationMetrics {
  totalAdminReviews: number;
  totalAutoCancellations: number;
  cancellationRate: number; // 0-1
  cancellationRatePercent: number; // 0-100 with 2 decimal places
  avgGracePeriodMinutes: number;
}

export interface StuckRunMetrics {
  companyId: string;
  periodDays: number;
  generatedAt: string;
  summary: {
    totalFlaggedRuns: number;
    activeWarnings: number;
    activeCritical: number;
    totalDismissed: number;
  };
  accuracy: StuckRunAccuracyMetrics;
  timing: StuckRunTimeMetrics;
  costSavings: StuckRunCostSavings;
  escalation: StuckRunEscalationMetrics;
  flaggedRuns: StuckRunFlaggedRun[];
  historicalData: StuckRunHistoricalData[];
  alerting: {
    status: "normal" | "warning" | "critical";
    anomalousPatterns: string[];
    recommendation: string | null;
  };
}

// Task Age Report Types for Queue Freshness Reviews
export interface TaskAgeBucket {
  bucket: string; // e.g., "0-1d", "1-3d", "3-7d", "7-14d", "14-30d", "30d+"
  count: number;
  percentage: number;
  oldestTaskHours: number;
  newestTaskHours: number;
}

export interface TaskAgeByStatus {
  status: string;
  count: number;
  avgAgeHours: number;
  oldestTaskHours: number;
  newestTaskHours: number;
  buckets: TaskAgeBucket[];
}

export interface TaskAgeByAgent {
  agentId: string;
  agentName: string | null;
  totalTasks: number;
  avgAgeHours: number;
  oldestTaskHours: number;
  newestTaskHours: number;
  tasksByStatus: { status: string; count: number; avgAgeHours: number }[];
}

export interface TaskAgeReportSummary {
  totalTasks: number;
  avgAgeHours: number;
  medianAgeHours: number;
  oldestTaskHours: number;
  newestTaskHours: number;
  status: "fresh" | "warning" | "stale" | "critical";
  freshnessScore: number; // 0-100, higher = fresher
  alert: string | null;
}

export interface TaskAgeReport {
  companyId: string;
  generatedAt: string;
  periodDays: number;
  freshnessThresholds: {
    healthyMaxAgeHours: number; // 7 days = 168 hours
    warningMaxAgeHours: number; // 14 days = 336 hours
    criticalMaxAgeHours: number; // 30 days = 720 hours
  };
  summary: TaskAgeReportSummary;
  ageDistribution: TaskAgeBucket[];
  byStatus: TaskAgeByStatus[];
  byAgent: TaskAgeByAgent[];
  oldestTasks: {
    id: string;
    identifier: string | null;
    title: string;
    status: string;
    agentId: string | null;
    agentName: string | null;
    ageHours: number;
    createdAt: string;
    updatedAt: string;
  }[];
  recommendations: string[];
}

// Routine Catch-Up Breach Types forHardened Monitoring
export interface RoutineCatchUpBreach {
  id: string;
  routineId: string;
  triggerId: string | null;
  missedCount: number;
  capValue: number;
  droppedCount: number;
  detectedAt: string;
  acknowledgedAt: string | null;
  acknowledgedByAgentId: string | null;
  acknowledgedByUserId: string | null;
}

export interface RoutineCatchUpBreachSummary {
  totalBreaches: number;
  totalMissedRuns: number;
  totalDroppedRuns: number;
  maxMissedInSingleBreach: number;
  maxDroppedInSingleBreach: number;
  acknowledgedCount: number;
  hasUnacknowledgedBreaches: boolean;
}

export interface RoutineCatchUpBreachDetails {
  companyId: string;
  periodDays: number;
  generatedAt: string;
  summary: RoutineCatchUpBreachSummary;
  routineIds: string[];
  triggerIds: string[];
  dailyDistribution: { date: string; breachCount: number }[];
  peakBreachDay: { date: string; breachCount: number } | null;
  recentBreaches: RoutineCatchUpBreach[];
}
