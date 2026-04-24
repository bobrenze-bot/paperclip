import type { DashboardSummary, AssigneeStarvation, TaskAgeReport, RoutineCatchUpBreachDetails } from "@paperclipai/shared";
import { api } from "./client";

export const dashboardApi = {
  summary: (companyId: string) => api.get<DashboardSummary>(`/companies/${companyId}/dashboard`),
  assigneeStarvation: (companyId: string, thresholdHours?: number) =>
    api.get<AssigneeStarvation>(`/companies/${companyId}/dashboard/assignee-starvation?threshold=${thresholdHours ?? 24}`),
  taskAgeReport: (companyId: string, periodDays?: number) =>
    api.get<TaskAgeReport>(`/companies/${companyId}/dashboard/task-age?days=${periodDays ?? 30}`),
  routineCatchUpBreaches: (companyId: string, periodDays?: number) =>
    api.get<RoutineCatchUpBreachDetails>(`/companies/${companyId}/dashboard/routine-catch-up-breaches?days=${periodDays ?? 30}`),
};
