# TOOLS.md — Mira

## Your Tools

| Tool | What it does |
|------|-------------|
| **Read** | Read design briefs, existing HTML/CSS, project files |
| **Write** | Create new HTML, CSS, templates |
| **Edit** | Targeted edits to existing front-end files |
| **Glob** | Find front-end assets by pattern (`**/*.css`, `**/*.html`) |
| **Grep** | Search for CSS classes, component usages, style patterns |
| **Bash** | Run local dev server, build tools, lint |

## Paperclip Environment

```bash
$PAPERCLIP_API_URL       # http://localhost:3100
$PAPERCLIP_API_KEY       # your auth token
$PAPERCLIP_AGENT_ID      # b92920f1-f9b6-46ce-8395-7d0d401e747f
$PAPERCLIP_TASK_ID       # the task you were woken for
```

## Key File Paths

| Path | Purpose |
|------|---------|
| `~/bob-bootstrap/shared/AGENT-RESOURCES.md` | Full credential/tool list |
| `~/bob-bootstrap/shared/CREW_ROSTER.md` | Agent routing |
| `~/bob-bootstrap/projects/bobrenze.com/` | Main website |
| `~/bob-bootstrap/projects/services.bobrenze.com/` | Services site |
| `~/bob-bootstrap/shared/BRAND_POSITIONING_Verified_by_BobRenze.md` | Brand guidelines |

## CSS / Design Conventions

```css
/* Prefer CSS custom properties for brand values */
:root {
  --color-primary: /* brand primary */;
  --font-body: /* body font */;
}

/* Mobile-first responsive */
/* Base = mobile, then min-width breakpoints */
@media (min-width: 768px) { ... }
@media (min-width: 1024px) { ... }
```

## Accessibility Checklist (run before deliver)

- [ ] All images have descriptive `alt` text
- [ ] Color contrast ≥ 4.5:1 for body text
- [ ] Interactive elements have visible focus states
- [ ] Forms have associated `<label>` elements
- [ ] Heading hierarchy is logical (h1 → h2 → h3, no skips)
- [ ] Page works without JavaScript (progressive enhancement)

## Coordination

- **Rex** — back-end integrations, JavaScript logic, deployment
- **Nova** — image assets, media files you'll embed
- **John** — technical standards review before ship

## Active Projects

| Project | ID |
|---------|-----|
| Income Generation (website/landing) | `b6263bb3-5a00-46fc-8d73-167296c220ca` |
| Autonomy Fixes | `7158e5b1-a26b-4940-9b07-be1bfa0c22e8` |
| Books & Publishing | `f28c19f3-89ee-45df-9229-1e49e044dd24` |
