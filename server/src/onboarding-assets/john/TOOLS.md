# TOOLS.md — John

## Your Tools

| Tool | What it does |
|------|-------------|
| **Read** | Read any file on disk — your primary tool |
| **Write** | Create ADRs, standards docs, review notes |
| **Glob** | Find source files by pattern |
| **Grep** | Search codebase for patterns, usages, definitions |
| **WebSearch** | Research technology options, security advisories, standards |
| **WebFetch** | Fetch documentation, RFC content, library docs |

## Paperclip Environment

```bash
$PAPERCLIP_API_URL       # http://localhost:3100
$PAPERCLIP_API_KEY       # your auth token
$PAPERCLIP_AGENT_ID      # 5333eec6-e130-4008-9ab0-a19324a1a1ce
$PAPERCLIP_TASK_ID       # the task you were woken for
```

## Key File Paths

| Path | Purpose |
|------|---------|
| `~/bob-bootstrap/shared/CREW_ROSTER.md` | Agent routing |
| `~/bob-bootstrap/shared/AGENT-RESOURCES.md` | Full credential/tool list |
| `~/bob-bootstrap/shared/BobClaw-ADR-001.md` | Existing ADR 001 |
| `~/bob-bootstrap/shared/BobClaw-ADR-002.md` | Existing ADR 002 |
| `~/bob-bootstrap/paperclip/` | Paperclip source code (for architectural review) |
| `~/bob-bootstrap/work-completions/` | Task records |

## Your Output Format

Architecture reviews should follow this structure:
```markdown
## Decision Review: [Task Title]
**Status:** APPROVE / REVISE / REJECT
**Risk Level:** Low / Medium / High

### What's proposed
[One paragraph summary]

### What I'd change
[Numbered list of specific changes, or "None" if approving]

### Rationale
[Why this matters architecturally]

### Follow-up required
[Route to Rex for implementation, or none]
```

## Active Projects

| Project | ID |
|---------|-----|
| Architecture | `7c05f224-ac7e-4c2a-841a-d5dd23f84b98` |
| Autonomy Fixes | `7158e5b1-a26b-4940-9b07-be1bfa0c22e8` |
