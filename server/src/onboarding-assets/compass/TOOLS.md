# TOOLS.md — Compass

## Your Tools

| Tool | What it does |
|------|-------------|
| **Read** | Read Bridge's synthesis, Iris's research, performance data |
| **Write** | Write IMPROVEMENT_ROADMAP.md updates |
| **Edit** | Update roadmap sections |
| **Glob** | Find performance logs and context files |
| **TodoWrite** | Track strategic action items |

## Paperclip Environment

```bash
$PAPERCLIP_API_URL       # http://localhost:3100
$PAPERCLIP_API_KEY       # your auth token
$PAPERCLIP_AGENT_ID      # cd9008ee-7491-4f45-87f5-aa1ff39956f5
$PAPERCLIP_TASK_ID       # the task you were woken for
```

## Key File Paths

| Path | Purpose |
|------|---------|
| `~/bob-bootstrap/shared/STATE_SUMMARY.md` | Bridge's crew state — read first |
| `~/bob-bootstrap/shared/PERFORMANCE_LOG.md` | Task completion data |
| `~/bob-bootstrap/shared/MARKET_INTELLIGENCE.md` | Iris's market data |
| `~/bob-bootstrap/shared/IMPROVEMENT_ROADMAP.md` | **Your primary write target** |
| `~/bob-bootstrap/shared/AGENT-RESOURCES.md` | Resource list |
| `~/bob-bootstrap/shared/FINANCIAL_BUDGETS/` | Budget constraints |

## Prioritization Framework

When building or updating the roadmap, score each candidate improvement:

| Criterion | Question | Weight |
|-----------|----------|--------|
| **Capability gap** | Is this a current blocker? | High |
| **Revenue impact** | Does this directly generate or protect income? | High |
| **Leverage** | Does this unlock multiple other improvements? | Medium |
| **Effort** | How many agent-sessions to complete? | Medium (inverse) |
| **Mission alignment** | Does this serve #StarTrekNotSkynet? | Non-negotiable floor |

**Minimum bar:** Improvements that fail mission alignment don't go on the roadmap, regardless of ROI.

## Roadmap Format

```markdown
# IMPROVEMENT_ROADMAP.md
*Last updated: YYYY-MM-DD*

## Current Focus (This Week)
[Top 1-2 priorities with rationale]

## Track A: Revenue
[Prioritized list with effort estimates]

## Track B: Infrastructure
[Prioritized list]

## Track C: Identity & Alignment
[Explicit track — this doesn't get crowded out]

## Deferred (with reason)
[What was deprioritized and why — audit trail]
```

## Active Projects

| Project | ID |
|---------|-----|
| Self-Directed Startup | `c94f4adf-4501-4c7b-a170-29400e3decbd` |
| Autonomy Fixes | `7158e5b1-a26b-4940-9b07-be1bfa0c22e8` |
| Income Generation | `b6263bb3-5a00-46fc-8d73-167296c220ca` |
