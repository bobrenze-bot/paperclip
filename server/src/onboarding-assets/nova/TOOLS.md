# TOOLS.md — Nova

## Your Tools

| Tool | What it does |
|------|-------------|
| **Read** | Read creative briefs and existing assets |
| **Write** | Write output files, asset manifests |
| **Edit** | Edit asset metadata or config files |
| **Glob** | Find existing creative assets |
| **Grep** | Search for asset usage across projects |
| **Bash** | Run media tools, FFmpeg, local scripts |
| **WebSearch** | Research creative references, style trends |
| **WebFetch** | Fetch reference images, audio samples |
| **image** | Generate images via AI |
| **audio** | Generate audio/music via AI |
| **tts** | Text-to-speech generation |
| **playwright** | Browser automation (Figma, Canva, social media) |

## Paperclip Environment

```bash
$PAPERCLIP_API_URL       # http://localhost:3100
$PAPERCLIP_API_KEY       # your auth token
$PAPERCLIP_AGENT_ID      # 454eec3a-e285-43b8-a5a7-144bc2d82e62
$PAPERCLIP_TASK_ID       # the task you were woken for
```

## Creative Tool Selection Guide

| Task | Primary Tool | Fallback |
|------|-------------|---------|
| Photorealistic images | nano-banana-pro | DALL-E 3 |
| Stylized / artistic images | Stable Diffusion | Leonardo |
| Music / soundtracks | Suno | Audio AI |
| Voiceover / narration | tts (ElevenLabs) | OpenAI Whisper TTS |
| Video editing / clips | FFmpeg (Bash) | — |
| UI mockups / prototypes | Figma (playwright) | — |
| Social media graphics | Canva (playwright) | — |

## Key File Paths

| Path | Purpose |
|------|---------|
| `~/bob-bootstrap/shared/AGENT-RESOURCES.md` | **All credentials for creative tools** |
| `~/bob-bootstrap/shared/BRAND_POSITIONING_Verified_by_BobRenze.md` | Brand voice/style |
| `~/bob-bootstrap/projects/social-media/` | Social content |
| `~/bob-bootstrap/projects/juno-and-chip/illustrations/` | Book illustrations |
| `~/bob-bootstrap/projects/bobrenze.com/` | Web assets |
| `~/bob-bootstrap/projects/fiverr/` | Fiverr portfolio assets |
| `~/bob-bootstrap/work-completions/` | Task records |

## Creative Brief → Execution Protocol

1. **Understand the brief**: What's the goal? What feeling? What platform?
2. **Check existing assets**: Don't regenerate what already exists
3. **Choose tool**: See selection guide above
4. **Generate at usable quality**: Not max parameters for their own sake
5. **Save to project folder** (not just work-completions if it's a long-lived asset)
6. **Note your decisions**: What tool, what prompt approach, what you'd change

## Platform Specs (quick reference)

| Platform | Format | Size |
|----------|--------|------|
| Twitter/X header | PNG/JPG | 1500×500 |
| Twitter/X post | PNG/JPG | 1200×675 |
| TikTok video | MP4 | 1080×1920 |
| LinkedIn post | PNG/JPG | 1200×627 |
| Email header | PNG | 600×200 |
| Favicon | PNG | 32×32, 64×64, 192×192 |

## Active Projects

| Project | ID |
|---------|-----|
| Income Generation | `b6263bb3-5a00-46fc-8d73-167296c220ca` |
| Books & Publishing | `f28c19f3-89ee-45df-9229-1e49e044dd24` |
| Self-Directed Startup | `c94f4adf-4501-4c7b-a170-29400e3decbd` |
