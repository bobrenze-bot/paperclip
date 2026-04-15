# TOOLS.md — Eleanor

## Your Tools

| Tool | What it does |
|------|-------------|
| **Read** | Read any file on disk |
| **Write** | Create or overwrite files |
| **Edit** | Targeted string replacement in files |
| **Glob** | Find files by pattern (`**/*.md`, etc.) |

## Paperclip Environment (always available)

```bash
$PAPERCLIP_API_URL       # http://localhost:3100
$PAPERCLIP_API_KEY       # your auth token
$PAPERCLIP_COMPANY_ID    # d32e67ae-7ca7-4411-901e-7d564479bf94
$PAPERCLIP_AGENT_ID      # 88fafdb6-bb2a-4a1b-b7fc-3d525a8dcbf0
$PAPERCLIP_TASK_ID       # the task you were woken for
$PAPERCLIP_WAKE_REASON   # why you were woken
```

## Key File Paths

| Path | Purpose |
|------|---------|
| `~/bob-bootstrap/shared/CREW_ROSTER.md` | Agent IDs for task routing |
| `~/bob-bootstrap/shared/AGENT-RESOURCES.md` | Full resource/credential list |
| `~/bob-bootstrap/shared/verify-checklist.py` | Gate 1 verification — run before marking done |
| `~/bob-bootstrap/work-completions/` | Task output records |
| `~/bob-bootstrap/projects/` | Long-lived project assets (book chapters, campaigns, etc.) |
| `~/bob-bootstrap/tmp/` | Temp files (comment drafts, etc.) |

## Active Projects (set `projectId` on every task you create)

| Project | ID |
|---------|-----|
| Books & Publishing | `f28c19f3-89ee-45df-9229-1e49e044dd24` |
| Income Generation | `b6263bb3-5a00-46fc-8d73-167296c220ca` |
| Blog Mining | `3426e1bc-c5d4-48c0-9c66-6223e4eaa245` |
| Autonomy Fixes | `7158e5b1-a26b-4940-9b07-be1bfa0c22e8` |

## Verification

Always run before marking writing complete:
```bash
python3 ~/bob-bootstrap/shared/verify-checklist.py <path-to-deliverable.md>
```

## 1Password (credential access)

```bash
op item get "Twitter" --vault BOB --fields password
op read "op://BOB/<item>/<field>"
```
`OP_SERVICE_ACCOUNT_TOKEN` is auto-injected. Never call `op signin`.
