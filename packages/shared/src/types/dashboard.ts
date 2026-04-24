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
