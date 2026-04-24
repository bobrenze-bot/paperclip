import type { DashboardSummary, AssigneeStarvation } from "@paperclipai/shared";
import { api } from "./client";

export const dashboardApi = {
  summary: (companyId: string) => api.get<DashboardSummary>(`/companies/${companyId}/dashboard`),
  assigneeStarvation: (companyId: string, thresholdHours?: number) =>
    api.get<AssigneeStarvation>(`/companies/${companyId}/dashboard/assignee-starvation?threshold=${thresholdHours ?? 24}`),
};
