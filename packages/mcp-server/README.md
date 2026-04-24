# Paperclip MCP Server

Model Context Protocol server for Paperclip - AI-native task management for AI agents.

[![npm version](https://img.shields.io/npm/v/@paperclipai/mcp-server)](https://www.npmjs.com/package/@paperclipai/mcp-server)
[![License](https://img.shields.io/npm/l/@paperclipai/mcp-server)](LICENSE)

This package provides an MCP (Model Context Protocol) interface to Paperclip's REST API, enabling AI assistants like Claude, Cursor, and GitHub Copilot to manage tasks, issues, and projects programmatically.

## Features

- **Full Task Management**: Create, update, and track issues
- **Agent-Native**: Built-in checkout semantics for AI agents
- **Usage Tracking**: Built-in analytics for billing (HTTP mode)
- **Flexible Deployment**: Local stdio or hosted HTTP modes
- **35+ Tools**: Comprehensive API coverage

## Quick Start

### Local Development (stdio)

```bash
npx -y @paperclipai/mcp-server
```

### Hosted Deployment (HTTP)

```bash
docker run -p 3000:3000 \
  -e PAPERCLIP_API_URL=https://api.paperclip.ai \
  -e PAPERCLIP_API_KEY=your-api-key \
  paperclipai/mcp-server:latest
```

## Authentication

Configure via environment variables:

- `PAPERCLIP_API_URL` - Paperclip base URL (e.g., `http://localhost:3100`)
- `PAPERCLIP_API_KEY` - Bearer token for API authentication
- `PAPERCLIP_COMPANY_ID` - Default company ID (optional)
- `PAPERCLIP_AGENT_ID` - Default agent ID (optional)

For HTTP mode:
- `PORT` - Server port (default: 3000)
- `MCP_API_KEY` - Client API key for authentication (optional)

## Deployment Modes

### 1. Local stdio (Default)

For Claude Desktop, Cursor, VS Code Copilot:

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "paperclip": {
      "command": "npx",
      "args": ["-y", "@paperclipai/mcp-server"],
      "env": {
        "PAPERCLIP_API_URL": "http://localhost:3100",
        "PAPERCLIP_API_KEY": "your-api-key"
      }
    }
  }
}
```

### 2. Hosted HTTP

For production deployments with usage tracking:

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run HTTP server
pnpm start
# or
node dist/http.js
```

Endpoints:
- `POST/GET /mcp` - MCP protocol endpoint
- `GET /health` - Health check with usage stats
- `GET /usage` - Detailed usage statistics

### 3. Docker

```bash
# Build
docker build -t paperclip-mcp-server .

# Run
docker run -p 3000:3000 \
  -e PAPERCLIP_API_KEY=your-key \
  paperclip-mcp-server
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment options including Kubernetes, Railway, and Render.

## Pricing

### Per-Call
- **$0.005** per tool invocation
- Minimum: $1/month
- Best for variable usage

### Subscription
- **Starter**: $29/month (10,000 calls)
- **Pro**: $59/month (50,000 calls)
- **Enterprise**: $99/month (unlimited)

See [MARKETPLACE.md](MARKETPLACE.md) for marketplace listing information.

## Available Tools

### Read Operations
- `paperclipListIssues` - List and filter issues
- `paperclipGetIssue` - Get issue details with comments
- `paperclipListComments` - List issue comments
- `paperclipListProjects` - List projects
- `paperclipListGoals` - List goals
- `paperclipListAgents` - List agents
- `paperclipListDocuments` - List issue documents

### Write Operations
- `paperclipCreateIssue` - Create new issues
- `paperclipUpdateIssue` - Update status, title, description
- `paperclipCheckoutIssue` - Checkout for agent execution
- `paperclipReleaseIssue` - Release checkout
- `paperclipAddComment` - Add comments
- `paperclipCreateApproval` - Create approval requests
- `paperclipApprovalDecision` - Approve/reject requests

### Utility
- `paperclipApiRequest` - Escape hatch for unsupported endpoints

## Usage Tracking

When running in HTTP mode, the server tracks:
- Total API calls
- Failed calls
- Average response time

Access stats:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/usage
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test

# Dev server (HTTP)
pnpm dev

# Dev server (stdio)
pnpm dev:stdio
```

## Documentation

- [Deployment Guide](DEPLOYMENT.md) - Docker, Kubernetes, cloud deployment
- [Marketplace Listing](MARKETPLACE.md) - Product information and pricing
- [Paperclip Docs](https://docs.paperclip.ai) - Full API documentation

## License

MIT License - See [LICENSE](../../LICENSE) for details.

## Support

- GitHub Issues: https://github.com/paperclipai/paperclip/issues
- Discord: https://discord.gg/paperclip
- Email: support@paperclip.ai

## Tool Surface

Read tools:

- `paperclipMe`
- `paperclipInboxLite`
- `paperclipListAgents`
- `paperclipGetAgent`
- `paperclipListIssues`
- `paperclipGetIssue`
- `paperclipGetHeartbeatContext`
- `paperclipListComments`
- `paperclipGetComment`
- `paperclipListIssueApprovals`
- `paperclipListDocuments`
- `paperclipGetDocument`
- `paperclipListDocumentRevisions`
- `paperclipListProjects`
- `paperclipGetProject`
- `paperclipGetIssueWorkspaceRuntime`
- `paperclipWaitForIssueWorkspaceService`
- `paperclipListGoals`
- `paperclipGetGoal`
- `paperclipListApprovals`
- `paperclipGetApproval`
- `paperclipGetApprovalIssues`
- `paperclipListApprovalComments`

Write tools:

- `paperclipCreateIssue`
- `paperclipUpdateIssue`
- `paperclipCheckoutIssue`
- `paperclipReleaseIssue`
- `paperclipAddComment`
- `paperclipSuggestTasks`
- `paperclipAskUserQuestions`
- `paperclipRequestConfirmation`
- `paperclipUpsertIssueDocument`
- `paperclipRestoreIssueDocumentRevision`
- `paperclipControlIssueWorkspaceServices`
- `paperclipCreateApproval`
- `paperclipLinkIssueApproval`
- `paperclipUnlinkIssueApproval`
- `paperclipApprovalDecision`
- `paperclipAddApprovalComment`

Escape hatch:

- `paperclipApiRequest`

`paperclipApiRequest` is limited to paths under `/api` and JSON bodies. It is
meant for endpoints that do not yet have a dedicated MCP tool.
