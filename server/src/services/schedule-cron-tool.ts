/**
 * ScheduleCronTool — Agent-facing tool for cron-based task scheduling.
 *
 * Based on Claude Code's ScheduleCronTool pattern, this provides agents
 * the ability to schedule recurring tasks, list scheduled jobs, and cancel
 * them when no longer needed.
 *
 * Integrates with Paperclip's routine/trigger system for persistent scheduling
 * with automatic agent wake-up at scheduled times.
 *
 * @module
 */

import type { Db } from "@paperclipai/db";
import { routines, routineTriggers, projects } from "@paperclipai/db";
import { eq, and, desc, asc } from "drizzle-orm";
import { routineService } from "./routines.js";
import { projectService } from "./projects.js";
import { parseCron, validateCron, nextCronTickFromExpression } from "./cron.js";
import { logger } from "../middleware/logger.js";
import { forbidden, notFound, unprocessable } from "../errors.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScheduleCronToolResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface CronSchedule {
  id: string;
  routineId: string;
  triggerId: string;
  name: string;
  cronExpression: string;
  timezone: string;
  nextRunAt: Date | null;
  lastRunAt: Date | null;
  enabled: boolean;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Tool Implementation
// ---------------------------------------------------------------------------

export function scheduleCronToolService(db: Db) {
  const routineSvc = routineService(db);
  const log = logger.child({ service: "schedule-cron-tool" });

  /**
   * Validate that the agent can manage schedules for itself
   */
  async function assertAgentOwnsSchedule(
    agentId: string,
    routineId: string,
  ): Promise<void> {
    const routine = await routineSvc.get(routineId);
    if (!routine) {
      throw notFound("Scheduled routine not found");
    }
    if (routine.assigneeAgentId !== agentId) {
      throw forbidden("Agents can only manage their own scheduled tasks");
    }
  }

  /**
   * Schedule a new cron job for the agent.
   * Creates a routine with a schedule trigger.
   */
  async function schedule(
    agentId: string,
    companyId: string,
    params: {
      name: string;
      description?: string;
      cronExpression: string;
      timezone?: string;
      priority?: "critical" | "high" | "medium" | "low";
    },
  ): Promise<ScheduleCronToolResult> {
    try {
      // Validate cron expression
      const cronError = validateCron(params.cronExpression);
      if (cronError) {
        return {
          success: false,
          message: "Invalid cron expression",
          error: cronError,
        };
      }

      // Find or create a default project for agent schedules
      const projectSvc = projectService(db);
      const allProjects = await projectSvc.list(companyId);
      const defaultProject = allProjects.find(
        (p) => p.name === "Agent Scheduled Tasks"
      );

      let projectId: string;
      if (defaultProject) {
        projectId = defaultProject.id;
      } else {
        // Create a default project for scheduled tasks
        const newProject = await projectSvc.create(companyId, {
          name: "Agent Scheduled Tasks",
          description: "Automatically created project for agent-scheduled cron tasks",
          status: "active",
        });
        projectId = newProject.id;
      }

      // Create the routine
      const routine = await routineSvc.create(
        companyId,
        {
          projectId,
          title: params.name,
          description: params.description ?? `Scheduled task: ${params.name}`,
          assigneeAgentId: agentId,
          priority: params.priority ?? "medium",
          status: "active",
          concurrencyPolicy: "skip_if_active",
          catchUpPolicy: "enqueue_missed_with_cap",
        },
        { agentId },
      );

      // Create the schedule trigger
      const { trigger } = await routineSvc.createTrigger(
        routine.id,
        {
          kind: "schedule",
          label: `Cron: ${params.cronExpression}`,
          enabled: true,
          cronExpression: params.cronExpression,
          timezone: params.timezone ?? "UTC",
        },
        { agentId },
      );

      log.info(
        { agentId, routineId: routine.id, triggerId: trigger.id, cron: params.cronExpression },
        "Agent scheduled cron task",
      );

      return {
        success: true,
        message: `Scheduled "${params.name}" with cron "${params.cronExpression}"`,
        data: {
          scheduleId: trigger.id,
          routineId: routine.id,
          name: params.name,
          cronExpression: params.cronExpression,
          timezone: params.timezone ?? "UTC",
          nextRunAt: trigger.nextRunAt,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.error({ agentId, error: errorMsg }, "Failed to schedule cron task");
      return {
        success: false,
        message: "Failed to schedule task",
        error: errorMsg,
      };
    }
  }

  /**
   * List all scheduled cron jobs for an agent.
   */
  async function list(
    agentId: string,
    companyId: string,
  ): Promise<ScheduleCronToolResult> {
    try {
      // Get all routines assigned to this agent
      const agentRoutines = await db
        .select({
          id: routines.id,
          title: routines.title,
          createdAt: routines.createdAt,
        })
        .from(routines)
        .where(
          and(
            eq(routines.companyId, companyId),
            eq(routines.assigneeAgentId, agentId),
            eq(routines.status, "active"),
          ),
        );

      if (agentRoutines.length === 0) {
        return {
          success: true,
          message: "No scheduled tasks found",
          data: { schedules: [] },
        };
      }

      const routineIds = agentRoutines.map((r) => r.id);

      // Get all schedule triggers for these routines
      const triggers = await db
        .select({
          id: routineTriggers.id,
          routineId: routineTriggers.routineId,
          label: routineTriggers.label,
          enabled: routineTriggers.enabled,
          cronExpression: routineTriggers.cronExpression,
          timezone: routineTriggers.timezone,
          nextRunAt: routineTriggers.nextRunAt,
          lastFiredAt: routineTriggers.lastFiredAt,
          createdAt: routineTriggers.createdAt,
        })
        .from(routineTriggers)
        .where(
          and(
            eq(routineTriggers.companyId, companyId),
            eq(routineTriggers.kind, "schedule"),
          ),
        )
        .orderBy(asc(routineTriggers.createdAt));

      const scheduleTriggers = triggers.filter((t) =>
        routineIds.includes(t.routineId),
      );

      const schedules: CronSchedule[] = scheduleTriggers.map((trigger) => {
        const routine = agentRoutines.find((r) => r.id === trigger.routineId);
        return {
          id: trigger.id,
          routineId: trigger.routineId,
          triggerId: trigger.id,
          name: routine?.title ?? "Unnamed",
          cronExpression: trigger.cronExpression ?? "",
          timezone: trigger.timezone ?? "UTC",
          nextRunAt: trigger.nextRunAt,
          lastRunAt: trigger.lastFiredAt,
          enabled: trigger.enabled,
          createdAt: trigger.createdAt,
        };
      });

      return {
        success: true,
        message: `Found ${schedules.length} scheduled task(s)`,
        data: {
          schedules,
          count: schedules.length,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.error({ agentId, error: errorMsg }, "Failed to list cron schedules");
      return {
        success: false,
        message: "Failed to list scheduled tasks",
        error: errorMsg,
      };
    }
  }

  /**
   * Cancel (delete) a scheduled cron job.
   */
  async function cancel(
    agentId: string,
    companyId: string,
    params: { scheduleId: string },
  ): Promise<ScheduleCronToolResult> {
    try {
      // Get the trigger
      const trigger = await routineSvc.getTrigger(params.scheduleId);
      if (!trigger) {
        return {
          success: false,
          message: "Schedule not found",
          error: "No schedule exists with the provided ID",
        };
      }

      // Verify the agent owns this routine
      await assertAgentOwnsSchedule(agentId, trigger.routineId);

      // Delete the trigger (this will stop the schedule)
      await routineSvc.deleteTrigger(trigger.id);

      log.info(
        { agentId, triggerId: trigger.id, routineId: trigger.routineId },
        "Agent cancelled cron schedule",
      );

      return {
        success: true,
        message: "Cancelled scheduled task",
        data: {
          scheduleId: trigger.id,
          routineId: trigger.routineId,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.error({ agentId, scheduleId: params.scheduleId, error: errorMsg }, "Failed to cancel cron schedule");
      return {
        success: false,
        message: "Failed to cancel scheduled task",
        error: errorMsg,
      };
    }
  }

  /**
   * Enable or disable a scheduled cron job.
   */
  async function setEnabled(
    agentId: string,
    companyId: string,
    params: { scheduleId: string; enabled: boolean },
  ): Promise<ScheduleCronToolResult> {
    try {
      const trigger = await routineSvc.getTrigger(params.scheduleId);
      if (!trigger) {
        return {
          success: false,
          message: "Schedule not found",
          error: "No schedule exists with the provided ID",
        };
      }

      // Verify the agent owns this routine
      await assertAgentOwnsSchedule(agentId, trigger.routineId);

      const updated = await routineSvc.updateTrigger(
        trigger.id,
        { enabled: params.enabled },
        { agentId },
      );

      const action = params.enabled ? "enabled" : "disabled";
      log.info(
        { agentId, triggerId: trigger.id, enabled: params.enabled },
        `Agent ${action} cron schedule`,
      );

      return {
        success: true,
        message: `${action.charAt(0).toUpperCase() + action.slice(1)} scheduled task`,
        data: {
          scheduleId: trigger.id,
          enabled: updated?.enabled ?? params.enabled,
          nextRunAt: updated?.nextRunAt,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.error(
        { agentId, scheduleId: params.scheduleId, enabled: params.enabled, error: errorMsg },
        "Failed to update cron schedule",
      );
      return {
        success: false,
        message: "Failed to update scheduled task",
        error: errorMsg,
      };
    }
  }

  /**
   * Get details of a specific scheduled cron job.
   */
  async function get(
    agentId: string,
    companyId: string,
    params: { scheduleId: string },
  ): Promise<ScheduleCronToolResult> {
    try {
      const trigger = await routineSvc.getTrigger(params.scheduleId);
      if (!trigger) {
        return {
          success: false,
          message: "Schedule not found",
          error: "No schedule exists with the provided ID",
        };
      }

      // Verify the agent owns this routine
      await assertAgentOwnsSchedule(agentId, trigger.routineId);

      const routine = await routineSvc.get(trigger.routineId);

      return {
        success: true,
        message: "Retrieved schedule details",
        data: {
          scheduleId: trigger.id,
          routineId: trigger.routineId,
          name: routine?.title ?? "Unnamed",
          description: routine?.description,
          cronExpression: trigger.cronExpression,
          timezone: trigger.timezone,
          enabled: trigger.enabled,
          nextRunAt: trigger.nextRunAt,
          lastRunAt: trigger.lastFiredAt,
          createdAt: trigger.createdAt,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.error({ agentId, scheduleId: params.scheduleId, error: errorMsg }, "Failed to get cron schedule");
      return {
        success: false,
        message: "Failed to retrieve schedule details",
        error: errorMsg,
      };
    }
  }

  /**
   * Main tool dispatcher — routes to the appropriate operation.
   */
  async function execute(
    agentId: string,
    companyId: string,
    operation: string,
    params: Record<string, unknown>,
  ): Promise<ScheduleCronToolResult> {
    log.debug({ agentId, operation, params }, "ScheduleCronTool execute");

    switch (operation) {
      case "schedule": {
        const name = params.name as string;
        const description = params.description as string | undefined;
        const cronExpression = params.cronExpression as string;
        const timezone = params.timezone as string | undefined;
        const priority = params.priority as "critical" | "high" | "medium" | "low" | undefined;

        if (!name || !cronExpression) {
          return {
            success: false,
            message: "Missing required parameters",
            error: "name and cronExpression are required",
          };
        }

        return schedule(agentId, companyId, {
          name,
          description,
          cronExpression,
          timezone,
          priority,
        });
      }

      case "list":
        return list(agentId, companyId);

      case "cancel": {
        const scheduleId = params.scheduleId as string;
        if (!scheduleId) {
          return {
            success: false,
            message: "Missing required parameter",
            error: "scheduleId is required",
          };
        }
        return cancel(agentId, companyId, { scheduleId });
      }

      case "enable":
      case "disable": {
        const scheduleId = params.scheduleId as string;
        if (!scheduleId) {
          return {
            success: false,
            message: "Missing required parameter",
            error: "scheduleId is required",
          };
        }
        return setEnabled(agentId, companyId, {
          scheduleId,
          enabled: operation === "enable",
        });
      }

      case "get": {
        const scheduleId = params.scheduleId as string;
        if (!scheduleId) {
          return {
            success: false,
            message: "Missing required parameter",
            error: "scheduleId is required",
          };
        }
        return get(agentId, companyId, { scheduleId });
      }

      default:
        return {
          success: false,
          message: "Unknown operation",
          error: `Unknown operation: ${operation}. Supported: schedule, list, cancel, enable, disable, get`,
        };
    }
  }

  return {
    schedule,
    list,
    cancel,
    setEnabled,
    get,
    execute,
  };
}

// Type export for service
export type ScheduleCronToolService = ReturnType<typeof scheduleCronToolService>;
