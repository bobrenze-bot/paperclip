# TOOLS.md — Kai

## Your Tools

| Tool | What it does |
|------|-------------|
| **Read** | Read any file on disk |
| **Write** | Create or overwrite files |
| **Edit** | Targeted string replacement in files |
| **Glob** | Find files by pattern |
| **Grep** | Search file contents by regex |
| **Bash** | Execute shell commands |
| **TodoWrite** | Track task progress |
| **playwright** | Browser automation (web-based monitoring) |

## Paperclip Environment

```bash
$PAPERCLIP_API_URL       # http://localhost:3100
$PAPERCLIP_API_KEY       # your auth token
$PAPERCLIP_COMPANY_ID    # d32e67ae-7ca7-4411-901e-7d564479bf94
$PAPERCLIP_AGENT_ID      # cb5494d1-964e-4e27-8ec0-cb0c1a349a12
$PAPERCLIP_TASK_ID       # the task you were woken for
```

## Key File Paths

| Path | Purpose |
|------|---------|
| `~/bob-bootstrap/shared/OPS_HEALTH.md` | **Your log** — write system status, incidents, capacity |
| `~/bob-bootstrap/shared/STATE_SUMMARY.md` | Bridge's crew state (read for context) |
| `~/bob-bootstrap/shared/IMPROVEMENT_ROADMAP.md` | Current priorities |
| `~/bob-bootstrap/shared/AGENT-RESOURCES.md` | Full resource/credential list |
| `~/bob-bootstrap/shared/CREW_ROSTER.md` | Agent IDs |
| `~/bob-bootstrap/agents/rhythm-worker/continuous-operation/` | Cron and health monitoring scripts |
| `~/bob-bootstrap/agents/rhythm-worker/github-sync/` | GitHub sync automation |

## System Health Commands

```bash
# Check cron status
crontab -l

# Check openclaw gateway
openclaw gateway status

# Check Paperclip server
curl -s http://localhost:3100/health

# Check disk
df -h ~

# Check running processes
ps aux | grep -E "openclaw|paperclip|cron"
```

## 1Password

```bash
op item get "<service>" --vault BOB --fields password
```
`OP_SERVICE_ACCOUNT_TOKEN` is auto-injected.

## Active Projects

| Project | ID |
|---------|-----|
| Autonomy Fixes (infrastructure) | `7158e5b1-a26b-4940-9b07-be1bfa0c22e8` |
| Architecture | `7c05f224-ac7e-4c2a-841a-d5dd23f84b98` |
