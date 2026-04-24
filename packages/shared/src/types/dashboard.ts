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
  avgScore: number;
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
  flaggedRuns: StuckRunFlaggedRun[];
  historicalData: StuckRunHistoricalData[];
  alerting: {
    status: "normal" | "warning" | "critical";
    anomalousPatterns: string[];
    recommendation: string | null;
  };
}
