# TOOLS.md — Iris

## Your Tools

| Tool | What it does |
|------|-------------|
| **Read** | Read existing research files, briefs |
| **Write** | Write research briefs |
| **WebSearch** | Search the web — your primary tool |
| **WebFetch** | Fetch specific URLs, documentation, papers |
| **Glob** | Find existing research files |
| **playwright** | Browse pages requiring JavaScript rendering |

## Paperclip Environment

```bash
$PAPERCLIP_API_URL       # http://localhost:3100
$PAPERCLIP_API_KEY       # your auth token
$PAPERCLIP_AGENT_ID      # cea9c273-8001-4151-acfe-d7106b3944a2
$PAPERCLIP_TASK_ID       # the task you were woken for
```

## Key File Paths

| Path | Purpose |
|------|---------|
| `~/bob-bootstrap/shared/MARKET_INTELLIGENCE.md` | **Your write target** — market research |
| `~/bob-bootstrap/shared/RESEARCH_BRIEFS/` | **Your write target** — structured research briefs |
| `~/bob-bootstrap/shared/AGENT-RESOURCES.md` | Full credential/tool list |
| `~/bob-bootstrap/shared/CREW_ROSTER.md` | Agent IDs for routing |
| `~/bob-bootstrap/work-completions/` | Task records |
| `~/bob-bootstrap/.openclaw/artifacts/memory-architectures-research-2026-03-20.md` | Prior memory architecture research |

## Research Brief Format

```markdown
# Research Brief: [Topic]
**Date:** YYYY-MM-DD
**Requested by:** [Agent / task ID]
**Question:** [The specific question you were answering]

## Key Findings
[Numbered list, most important first]

## Sources
[Every factual claim gets a URL or citation]

## Confidence Level
[High / Medium / Low — and why]

## What's Still Unknown
[Honest gaps in the research]

## Recommended Next Step
[For Eleanor: "These findings support drafting X" / For Marcus: "This suggests prioritizing Y"]
```

## Research Quality Standards

- Every factual claim has a source
- Distinguish findings from inferences
- State confidence level honestly
- "Insufficient data to answer" is a valid finding — report it
- Primary sources over secondhand summaries when accessible

## Active Projects

| Project | ID |
|---------|-----|
| Research Mining | `4621d3c7-5c20-4b46-b128-2f7a577e8fbb` |
| Memory System | `5790ec93-c40b-4db3-892e-d71c1a0fcfe5` |
| Income Generation | `b6263bb3-5a00-46fc-8d73-167296c220ca` |
