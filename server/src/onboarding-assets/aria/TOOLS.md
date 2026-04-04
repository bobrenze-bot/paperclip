# TOOLS.md — Aria

## Your Tools

| Tool | What it does |
|------|-------------|
| **WebSearch** | Research leads, competitors, market intel |
| **WebFetch** | Fetch company pages, LinkedIn profiles, Toku listings |
| **Read** | Read briefs, CRM files, pipeline data |
| **Write** | Draft proposals, outreach emails, pipeline updates |
| **Edit** | Revise pitches and proposals |
| **Glob** | Find existing materials |
| **TodoWrite** | Track pipeline steps |
| **playwright** | Browser automation — LinkedIn, Toku, form submissions |

## Paperclip Environment

```bash
$PAPERCLIP_API_URL       # http://localhost:3100
$PAPERCLIP_API_KEY       # your auth token
$PAPERCLIP_AGENT_ID      # e7eb2469-74e5-4b06-901b-80c0be5ab41f
$PAPERCLIP_TASK_ID       # the task you were woken for
```

## Key File Paths

| Path | Purpose |
|------|---------|
| `~/bob-bootstrap/shared/PILOT_CLIENT_REGISTRY.md` | Active clients |
| `~/bob-bootstrap/shared/COLD_OUTREACH_PLAYBOOK_AI_LABS.md` | Outreach playbook |
| `~/bob-bootstrap/shared/SALES_CRM_AI_LABS.md` | Sales CRM |
| `~/bob-bootstrap/shared/MARKET_INTELLIGENCE.md` | Market data from Iris |
| `~/bob-bootstrap/shared/TOKU_SERVICE_DESCRIPTIONS_REFINED_2026-03-24.md` | Service descriptions |
| `~/bob-bootstrap/shared/AGENT-RESOURCES.md` | Full credential/tool list |
| `~/bob-bootstrap/projects/cold-outreach/` | Outreach assets |
| `~/bob-bootstrap/projects/fiverr/` | Fiverr gig materials |

## Twitter Outreach Protocol

**NEVER type directly into Twitter compose box.** Always use:
```bash
# Reply to a tweet
python3 ~/bob-bootstrap/scripts/twitter-browser-engagement.py browse-reply \
  --url <tweet_url> --text "<reply>"

# Post original tweet
python3 ~/bob-bootstrap/scripts/twitter-engagement-tweepy.py tweet --text "<text>"
```

## LinkedIn Outreach

```bash
python3 ~/bob-bootstrap/scripts/linkedin-inbox.py check
python3 ~/bob-bootstrap/scripts/linkedin-connection-tool.py connect --profile-url URL
```

## Toku (freelance marketplace)

Credentials via: `op item get "Toku" --vault BOB`

## Active Projects

| Project | ID |
|---------|-----|
| Income Generation | `b6263bb3-5a00-46fc-8d73-167296c220ca` |
| Research Mining | `4621d3c7-5c20-4b46-b128-2f7a577e8fbb` |
