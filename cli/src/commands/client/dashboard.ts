import { Command } from "commander";
import type { DashboardSummary } from "@paperclipai/shared";
import {
  addCommonClientOptions,
  handleCommandError,
  printOutput,
  resolveCommandContext,
  type BaseClientOptions,
} from "./common.js";

interface DashboardGetOptions extends BaseClientOptions {
  companyId?: string;
}

interface PerformanceOptions extends BaseClientOptions {
  companyId?: string;
  days?: string;
}

interface WeeklyReportOptions extends BaseClientOptions {
  companyId?: string;
}

export function registerDashboardCommands(program: Command): void {
  const dashboard = program.command("dashboard").description("Dashboard summary operations");

  addCommonClientOptions(
    dashboard
      .command("get")
      .description("Get dashboard summary for a company")
      .requiredOption("-C, --company-id <id>", "Company ID")
      .action(async (opts: DashboardGetOptions) => {
        try {
          const ctx = resolveCommandContext(opts, { requireCompany: true });
          const row = await ctx.api.get<DashboardSummary>(`/api/companies/${ctx.companyId}/dashboard`);
          printOutput(row, { json: ctx.json });
        } catch (err) {
          handleCommandError(err);
        }
      }),
    { includeCompany: false },
  );

  addCommonClientOptions(
    dashboard
      .command("performance")
      .description("Get agent performance metrics dashboard")
      .requiredOption("-C, --company-id <id>", "Company ID")
      .option("-d, --days <number>", "Number of days to analyze (default: 30)", "30")
      .action(async (opts: PerformanceOptions) => {
        try {
          const ctx = resolveCommandContext(opts, { requireCompany: true });
          const days = parseInt(opts.days || "30", 10);
          const performance = await ctx.api.get(
            `/api/companies/${ctx.companyId}/dashboard/performance?days=${days}`
          );
          printOutput(performance, { json: ctx.json });
        } catch (err) {
          handleCommandError(err);
        }
      }),
    { includeCompany: false },
  );

  addCommonClientOptions(
    dashboard
      .command("weekly-report")
      .description("Get weekly performance report")
      .requiredOption("-C, --company-id <id>", "Company ID")
      .action(async (opts: WeeklyReportOptions) => {
        try {
          const ctx = resolveCommandContext(opts, { requireCompany: true });
          const report = await ctx.api.get(
            `/api/companies/${ctx.companyId}/dashboard/performance/weekly-report`
          );
          printOutput(report, { json: ctx.json });
        } catch (err) {
          handleCommandError(err);
        }
      }),
    { includeCompany: false },
  );
}
