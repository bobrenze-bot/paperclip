# Import Package Diff Tool

Compares two Paperclip import packages for overlap and drift.

## Usage

```bash
node packages/diff/import-diff.js --left <path> --right <path>
```

## Options

- `--left <path>`   Path to left package directory (REQUIRED)
- `--right <path>`  Path to right package directory (REQUIRED)
- `--help, -h`      Show this help message

## Output

The tool provides:

1. **Summary**: Quick overview of found entities and differences
2. **Detailed Report**: Colored terminal output categorized by:
   - Overlap (entities in both packages)
   - Conflicts (same slug, different content)
   - Drift (entities only in left or right package)
3. **JSON Report**: Machine-readable output for automation

## Example

### Create test packages

```bash
# Left package (v1)
mkdir -p ./package-v1/agents
echo '---
slug: ceo
name: CEO Agent
---
# CEO Agent' > ./package-v1/agents/ceo.md

echo '---
slug: cto
name: CTO Agent
---
# CTO Agent' > ./package-v1/agents/cto.md

# Right package (v2)
mkdir -p ./package-v2/agents
echo '---
slug: ceo
name: Chief Executive Officer
---
# CEO Agent v2' > ./package-v2/agents/ceo.md

echo '---
slug: cfo
name: CFO Agent
---
# CFO Agent' > ./package-v2/agents/cfo.md
```

### Run the diff

```bash
node packages/diff/import-diff.js --left ./package-v1 --right ./package-v2
```

### Sample Output

```
=== OVERLAP (in both packages) ===
  agent: cto (left: agents/cto.md, right: agents/cto.md)

=== CONFLICTS (same slug, different content) ===
  agent: ceo
    Left:  agents/ceo.md [a1b2c3d4]
    Right: agents/ceo.md [e5f6g7h8]

=== DRIFT (only in left package) ===
  No left-only entities

=== DRIFT (only in right package) ===
  agent: cfo (agents/cfo.md)
```

## JSON Output

The tool also prints a JSON report to stdout for programmatic use:

```json
{
  "left": "/path/to/package-v1",
  "right": "/path/to/package-v2",
  "timestamp": "2026-04-25T...",
  "leftCount": 2,
  "rightCount": 2,
  "summary": {
    "overlap": 1,
    "leftDrift": 0,
    "rightDrift": 1,
    "conflicts": 1
  },
  "details": {
    "overlap": [...],
    "leftDrift": [],
    "rightDrift": [...],
    "conflicts": [...]
  }
}
```

## Integration with CI/CD

Example GitHub Actions step:

```yaml
- name: Diff import packages
  run: |
    node packages/diff/import-diff.js --left ./backup-$(date +%Y%m%d) --right ./backup-$(date +%Y%m%d -d '1 day ago') > ./diff-report.json
  
- name: Check for conflicts
  run: |
    CONFLICTS=$(jq '.summary.conflicts' ./diff-report.json)
    if [ "$CONFLICTS" -gt 0 ]; then
      echo "Found $CONFLICTS conflicts - review required"
      exit 1
    fi
```

## Hashing

All entity files use SHA-256 hashing (truncated to 8 characters) for fast comparison. This allows:

- Quick detection of content changes
- Easy identification of drifted entities
- No need to store full file content in memory

## Entity Kinds

The tool recognizes these Paperclip package entity types:

- **company**: COMPANY.md, TEAM.md, AGENTS.md
- **agent**: agents/*.md
- **project**: projects/*.md
- **issue**: tasks/*.md
- **skill**: skills/*.md

Files that don't match these patterns are ignored.
