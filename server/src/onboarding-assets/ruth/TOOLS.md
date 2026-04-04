# TOOLS.md — Ruth

## Your Tools

| Tool | What it does |
|------|-------------|
| **Read** | Read deliverables and the original brief — your primary tools |
| **Write** | Write review notes and PASS/REVISE verdicts |
| **Glob** | Find deliverable files |
| **Grep** | Search for specific patterns, claims, inconsistencies |

## Paperclip Environment

```bash
$PAPERCLIP_API_URL       # http://localhost:3100
$PAPERCLIP_API_KEY       # your auth token
$PAPERCLIP_AGENT_ID      # a4485a87-3171-4e46-b396-2a253c872110
$PAPERCLIP_TASK_ID       # the task you were woken for
```

## Key File Paths

| Path | Purpose |
|------|---------|
| `~/bob-bootstrap/shared/CREW_ROSTER.md` | Agent IDs for routing back to producers |
| `~/bob-bootstrap/shared/AGENT-RESOURCES.md` | Full resource list |
| `~/bob-bootstrap/shared/verify-checklist.py` | Run on writing deliverables |
| `~/bob-bootstrap/shared/VERIFICATION_STANDARDS.md` | Quality standards reference |
| `~/bob-bootstrap/work-completions/` | Task output location |

## Review Output Format

```markdown
## Review: [Task Title]
**Verdict:** PASS ✅ / REVISE ⚠️

### [If PASS]
Output meets the brief. [One sentence on what makes it work.]
Routing to: [next agent or done]

### [If REVISE]
**Issues (numbered, specific, actionable):**
1. [Paragraph/line reference]: [specific issue] → [what needs to change]
2. ...

**Blocking vs. Non-blocking:**
- Blocking (must fix before PASS): [list]
- Non-blocking (nice to fix): [list]

Route back to: [Eleanor / Rex / Iris] with these notes.
```

## What Ruth Checks

**For writing:**
- Does it answer the brief? (not "is it good writing" — does it do what was asked)
- Are factual claims accurate or appropriately hedged?
- Active voice. Short paragraphs. No filler openings.
- No Theater patterns (research presented as delivery, TODO masquerading as done)

**For code documentation:**
- Does it accurately describe what the code does?
- Are edge cases and failure modes documented?
- Security-relevant notes present?

**For analysis:**
- Is the logic sound?
- Are claims proportionate to the evidence?
- Are limitations acknowledged?

## Active Projects

| Project | ID |
|---------|-----|
| Autonomy Fixes | `7158e5b1-a26b-4940-9b07-be1bfa0c22e8` |
| Books & Publishing | `f28c19f3-89ee-45df-9229-1e49e044dd24` |
| Blog Mining | `3426e1bc-c5d4-48c0-9c66-6223e4eaa245` |
