# TOOLS.md — Rex

## Your Tools

| Tool | What it does |
|------|-------------|
| **Read** | Read source files — use BEFORE touching anything |
| **Write** | Create new files |
| **Edit** | Targeted string replacement in existing files |
| **Bash** | Execute shell commands, run scripts, test code |
| **Glob** | Find files by pattern |
| **Grep** | Search codebase for patterns, definitions, usages |
| **TodoWrite** | Track multi-step implementations |

## Paperclip Environment

```bash
$PAPERCLIP_API_URL       # http://localhost:3100
$PAPERCLIP_API_KEY       # your auth token
$PAPERCLIP_AGENT_ID      # 4c709656-24c6-48eb-bc1a-28afb9d59f12
$PAPERCLIP_TASK_ID       # the task you were woken for
```

## Key File Paths

| Path | Purpose |
|------|---------|
| `~/bob-bootstrap/shared/AGENT-RESOURCES.md` | Full credential/tool list |
| `~/bob-bootstrap/shared/CREW_ROSTER.md` | Agent IDs for routing |
| `~/bob-bootstrap/shared/verify-checklist.py` | **Run before marking done** |
| `~/bob-bootstrap/shared/VALIDATED_APPROACHES/` | Proven code patterns |
| `~/bob-bootstrap/scripts/` | Existing scripts (read before rewriting) |
| `~/bob-bootstrap/work-completions/` | Task output records |

## Git Rules (NEVER break these)

```bash
# ✅ OK
git add <specific-files>
git commit -m "BOB-XXX: description"
git push origin <branch>

# ❌ NEVER
git push --force
git reset --hard
git branch -D
git rebase -i  (interactive)
```

## 1Password

```bash
# Get credential
op item get "Twitter" --vault BOB --fields password
op read "op://BOB/<item>/<field>"

# List all items
op item list --vault BOB
```
`OP_SERVICE_ACCOUNT_TOKEN` is auto-injected.

## Verification Gate (MANDATORY)

```bash
python3 ~/bob-bootstrap/shared/verify-checklist.py <path-to-deliverable>
# Exit 0 = PASS → deliver to Ruth
# Exit 1 = FAIL → fix and re-run
```

## Twitter Scripting

```bash
# Browser-based reply (Free API tier doesn't support replies via API)
python3 ~/bob-bootstrap/scripts/twitter-browser-engagement.py browse-reply \
  --url <tweet_url> --text "<reply>"

# Original tweet via Tweepy
python3 ~/bob-bootstrap/scripts/twitter-engagement-tweepy.py tweet --text "<text>"
```

## Active Projects

| Project | ID |
|---------|-----|
| Autonomy Fixes | `7158e5b1-a26b-4940-9b07-be1bfa0c22e8` |
| Architecture | `7c05f224-ac7e-4c2a-841a-d5dd23f84b98` |
| Voice Agent | `a8cad6da-b10f-4448-b645-d0531536de6a` |
| Income Generation | `b6263bb3-5a00-46fc-8d73-167296c220ca` |
