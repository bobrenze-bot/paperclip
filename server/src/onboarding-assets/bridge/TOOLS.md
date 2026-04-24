# TOOLS.md — Bridge

## Your Tools

| Tool | What it does |
|------|-------------|
| **Read** | Read all agent outputs, shared files — your primary tool |
| **Write** | Write STATE_SUMMARY.md and synthesis reports |
| **Edit** | Update sections of STATE_SUMMARY.md |
| **Glob** | Find files across the shared directory |
| **Grep** | Search for patterns across agent outputs |
| **TodoWrite** | Track synthesis tasks |

## Paperclip Environment

```bash
$PAPERCLIP_API_URL       # http://localhost:3100
$PAPERCLIP_API_KEY       # your auth token
$PAPERCLIP_AGENT_ID      # 1861d613-00f7-4739-9a82-b5c12ab5d331
$PAPERCLIP_TASK_ID       # the task you were woken for
```

## Your Primary Read Sources (check all before synthesizing)

| Path | Purpose |
|------|---------|
| `~/bob-bootstrap/shared/PERFORMANCE_LOG.md` | Task completion data |
| `~/bob-bootstrap/shared/IMPROVEMENT_ROADMAP.md` | Compass's current priorities |
| `~/bob-bootstrap/shared/MARKET_INTELLIGENCE.md` | Iris's market data |
| `~/bob-bootstrap/shared/PLAYBOOK_STATUS.md` | Playbook health |
| `~/bob-bootstrap/shared/RESEARCH_BRIEFS/` | Iris's research outputs |
| `~/bob-bootstrap/shared/STRESS_TEST_REPORTS/` | Ruth's adversarial reviews |
| `~/bob-bootstrap/shared/VALIDATED_APPROACHES/` | Proven approaches |
| `~/bob-bootstrap/shared/OPS_HEALTH.md` | Kai's system status |

## Your Primary Write Target

```bash
~/bob-bootstrap/shared/STATE_SUMMARY.md
```

**Skip synthesis if STATE_SUMMARY.md is less than 4 hours old.**

Check age:
```bash
python3 -c "
import os, time
f = os.path.expanduser('~/bob-bootstrap/shared/STATE_SUMMARY.md')
age_hours = (time.time() - os.path.getmtime(f)) / 3600
print(f'Age: {age_hours:.1f}h')
print('SKIP' if age_hours < 4 else 'PROCEED')
"
```

## STATE_SUMMARY Format

```markdown
# STATE_SUMMARY.md
*Last updated: YYYY-MM-DD HH:MM PT*

## Current Focus
[What the crew is primarily working on right now]

## Active Work Streams
[Bulleted list of in-flight work by agent]

## Contradictions / Conflicts
[Where agents are pulling in different directions — the most important section]

## Gaps (Things Everyone Assumes Someone Else Is Handling)
[What's falling through the cracks]

## Recent Completions
[What got done since last synthesis]

## Blockers
[What needs human attention]

## FUTP Compliance
[Tasks marked done since last synthesis that listed "next steps" — verify child tasks exist in Paperclip.
Flag any where prose says "next steps" but no child task IDs appear in the completion comment.]
```

## Active Projects

| Project | ID |
|---------|-----|
| Autonomy Fixes | `7158e5b1-a26b-4940-9b07-be1bfa0c22e8` |
| Self-Directed Startup | `c94f4adf-4501-4c7b-a170-29400e3decbd` |
