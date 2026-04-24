# TOOLS.md — Marcus

## Your Tools

| Tool | What it does |
|------|-------------|
| **Read** | Read task files, briefs, shared docs |
| **Write** | Write routing plans, synthesis outputs |
| **Edit** | Update in-flight tracking files |
| **Glob** | Find files by pattern |
| **Grep** | Search shared context |
| **TodoWrite** | Track multi-step orchestration |

## Paperclip Environment

```bash
$PAPERCLIP_API_URL       # http://localhost:3100
$PAPERCLIP_API_KEY       # your auth token
$PAPERCLIP_COMPANY_ID    # d32e67ae-7ca7-4411-901e-7d564479bf94
$PAPERCLIP_AGENT_ID      # 5f266bb6-c593-4f52-af47-4c0b4be91c87
$PAPERCLIP_TASK_ID       # the task you were woken for
```

## Routing — Agent IDs (always use PATCH, never @mention)

| Agent | ID |
|-------|-----|
| Eleanor (writer) | `88fafdb6-bb2a-4a1b-b7fc-3d525a8dcbf0` |
| Ruth (QA) | `a4485a87-3171-4e46-b396-2a253c872110` |
| Rex (coder) | `4c709656-24c6-48eb-bc1a-28afb9d59f12` |
| Kai (devops) | `cb5494d1-964e-4e27-8ec0-cb0c1a349a12` |
| Iris (research) | `cea9c273-8001-4151-acfe-d7106b3944a2` |
| John (VP eng) | `5333eec6-e130-4008-9ab0-a19324a1a1ce` |
| Aria (sales) | `e7eb2469-74e5-4b06-901b-80c0be5ab41f` |
| Bridge (synthesis) | `1861d613-00f7-4739-9a82-b5c12ab5d331` |
| Compass (PM) | `cd9008ee-7491-4f45-87f5-aa1ff39956f5` |
| Mira (front-end) | `b92920f1-f9b6-46ce-8395-7d0d401e747f` |
| Nova (media) | `454eec3a-e285-43b8-a5a7-144bc2d82e62` |
| Bob (CEO) | `5898c86d-5c54-4d49-81ed-a48fbfcd58e6` |
| Board (human) | `assigneeAgentId: null, assigneeUserId: "local-board"` |

## Reassign Pattern (copy-paste)

```python
python3 << 'END_PYTHON'
import urllib.request, json, os
NEXT_AGENT_ID = "<id-from-table>"
payload = {"assigneeAgentId": NEXT_AGENT_ID, "status": "todo"}
url = os.environ["PAPERCLIP_API_URL"] + "/api/issues/" + os.environ["PAPERCLIP_TASK_ID"]
req = urllib.request.Request(url, json.dumps(payload).encode(),
    {"Authorization": "Bearer " + os.environ["PAPERCLIP_API_KEY"], "Content-Type": "application/json"},
    method="PATCH")
print(urllib.request.urlopen(req).read().decode())
END_PYTHON
```

## Key File Paths

| Path | Purpose |
|------|---------|
| `~/bob-bootstrap/shared/CREW_ROSTER.md` | Full routing guide |
| `~/bob-bootstrap/shared/STATE_SUMMARY.md` | Current crew state |
| `~/bob-bootstrap/shared/CREW_LOG.md` | Ship's log — write cross-task patterns here |
| `~/bob-bootstrap/shared/AGENT-RESOURCES.md` | Full resource list |
| `~/bob-bootstrap/shared/3-Gate-Protocol.md` | Quality workflow |

## Creating Subtasks (FUTP)

You **can** create subtasks directly via the API. Use `POST /api/companies/{COMPANY_ID}/issues` with `parentId` set to link to the parent task.

```python
python3 << 'END_PYTHON'
import urllib.request, json, os
task_data = {
    "title": "[PHASE] Action — Context",
    "parentId": os.environ["PAPERCLIP_TASK_ID"],  # links to parent
    "assigneeAgentId": "<agent-uuid>",
    "projectId": "<project-uuid>",
    "status": "todo",
    "priority": "medium"
}
url = os.environ["PAPERCLIP_API_URL"] + "/api/companies/" + os.environ["PAPERCLIP_COMPANY_ID"] + "/issues"
req = urllib.request.Request(url, json.dumps(task_data).encode(),
    {"Authorization": "Bearer " + os.environ["PAPERCLIP_API_KEY"], "Content-Type": "application/json"},
    method="POST")
result = json.loads(urllib.request.urlopen(req).read())
print("Created:", result["id"], result["identifier"])
END_PYTHON
```
