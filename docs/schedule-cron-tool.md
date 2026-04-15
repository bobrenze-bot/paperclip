# ScheduleCronTool

Agent-facing tool for cron-based task scheduling in Paperclip.

## Overview

Based on the Claude Code leak analysis (BOB-1199), ScheduleCronTool provides agents with the ability to schedule recurring tasks, list scheduled jobs, and cancel them when no longer needed. This enables proactive agent behavior without requiring continuous heartbeat sessions.

## Architecture

The tool integrates with Paperclip's existing routine/trigger system:
- **Routine**: Represents a scheduled task definition
- **Trigger**: The cron schedule attached to a routine
- **Automatic wake**: When a scheduled time arrives, Paperclip automatically wakes the agent

## API Endpoint

```
POST /api/agents/:id/schedule-cron
```

Authentication: Agent API key or board session required.

## Operations

### 1. schedule — Create a new cron schedule

Creates a routine with a schedule trigger that will wake the agent at the specified cron interval.

**Request:**
```json
{
  "operation": "schedule",
  "name": "Daily Status Report",
  "description": "Generate and send daily status report",
  "cronExpression": "0 9 * * *",
  "timezone": "America/New_York",
  "priority": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scheduled \"Daily Status Report\" with cron \"0 9 * * *\"",
  "data": {
    "scheduleId": "uuid",
    "routineId": "uuid",
    "name": "Daily Status Report",
    "cronExpression": "0 9 * * *",
    "timezone": "America/New_York",
    "nextRunAt": "2026-04-01T13:00:00Z"
  }
}
```

### 2. list — View all scheduled tasks

Returns all cron schedules created by/for the agent.

**Request:**
```json
{
  "operation": "list"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Found 3 scheduled task(s)",
  "data": {
    "schedules": [
      {
        "id": "uuid",
        "routineId": "uuid",
        "triggerId": "uuid",
        "name": "Daily Status Report",
        "cronExpression": "0 9 * * *",
        "timezone": "America/New_York",
        "nextRunAt": "2026-04-01T13:00:00Z",
        "lastRunAt": "2026-03-31T13:00:00Z",
        "enabled": true,
        "createdAt": "2026-03-30T10:00:00Z"
      }
    ],
    "count": 3
  }
}
```

### 3. get — Retrieve schedule details

Get detailed information about a specific schedule.

**Request:**
```json
{
  "operation": "get",
  "scheduleId": "uuid"
}
```

### 4. cancel — Delete a scheduled task

Permanently removes a scheduled task.

**Request:**
```json
{
  "operation": "cancel",
  "scheduleId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cancelled scheduled task",
  "data": {
    "scheduleId": "uuid",
    "routineId": "uuid"
  }
}
```

### 5. enable/disable — Toggle schedule state

Temporarily enable or disable a schedule without deleting it.

**Request:**
```json
{
  "operation": "disable",
  "scheduleId": "uuid"
}
```

```json
{
  "operation": "enable",
  "scheduleId": "uuid"
}
```

## Cron Expression Format

Standard 5-field cron syntax:

```
┌────────────── minute (0–59)
│ ┌──────────── hour (0–23)
│ │ ┌────────── day of month (1–31)
│ │ │ ┌──────── month (1–12)
│ │ │ │ ┌────── day of week (0–6, Sun=0)
│ │ │ │ │
* * * * *
```

### Examples

| Expression | Description |
|------------|-------------|
| `0 9 * * *` | Daily at 9:00 AM |
| `0 */6 * * *` | Every 6 hours |
| `0 9 * * 1` | Weekly on Mondays at 9:00 AM |
| `0 9 1 * *` | Monthly on the 1st at 9:00 AM |
| `*/15 * * * *` | Every 15 minutes |
| `0 9-17 * * 1-5` | Every hour 9-5 on weekdays |

### Advanced Syntax

- **Step values**: `*/15` = every 15 minutes
- **Ranges**: `9-17` = 9 AM to 5 PM
- **Lists**: `1,3,5` = Monday, Wednesday, Friday
- **Combined**: `0 9-17/2 * * 1-5` = Every 2 hours 9-5 on weekdays

## Timezone Support

Any valid IANA timezone identifier:
- `UTC` (default)
- `America/New_York`
- `Europe/London`
- `Asia/Tokyo`
- etc.

## Priority Levels

- `critical` — Urgent tasks
- `high` — Important tasks
- `medium` — Normal tasks (default)
- `low` — Background tasks

## Security & Permissions

- Agents can only manage their own schedules
- Board can manage any agent's schedules
- All actions are logged to the activity log
- Schedules are company-scoped

## Integration with Agent Wake

When a scheduled time arrives:

1. Paperclip's routine scheduler detects the due trigger
2. A new task/issue is created and assigned to the agent
3. The agent is woken via heartbeat with `wakeReason: "scheduled"`
4. The agent executes the scheduled task
5. Results are tracked via the routine run system

## Error Handling

Common error responses:

```json
{
  "success": false,
  "message": "Invalid cron expression",
  "error": "Cron expression must have exactly 5 fields, got 3"
}
```

```json
{
  "success": false,
  "message": "Schedule not found",
  "error": "No schedule exists with the provided ID"
}
```

```json
{
  "success": false,
  "message": "Missing required parameters",
  "error": "name and cronExpression are required"
}
```

## Implementation Details

### Service Location
```
paperclip/server/src/services/schedule-cron-tool.ts
```

### Route Location
```
paperclip/server/src/routes/agents.ts
```

### Database Schema

Uses existing tables:
- `routines` — Task definitions
- `routine_triggers` — Cron schedules
- `routine_runs` — Execution tracking
- `issues` — Created when schedule fires

## Future Enhancements

- [ ] Webhook triggers alongside cron
- [ ] One-time scheduled tasks (at specific datetime)
- [ ] Schedule templates/presets
- [ ] Schedule analytics and success rates
- [ ] Schedule chaining (task B runs after task A completes)

## References

- Claude Code leak analysis: `work-completions/cb9262b0-70e1-4055-9b3f-96a75b1233cc_iris_20260331-0705.md`
- Paperclip SPEC: `paperclip/doc/SPEC-implementation.md`
- Routine system: `paperclip/server/src/services/routines.ts`
- Cron parser: `paperclip/server/src/services/cron.ts`
