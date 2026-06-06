# Obsidian MCP Setup — Connect Antigravity to Your Vault

## What This Does

The Obsidian MCP plugin lets Antigravity read/write your Obsidian vault
directly during sessions, without copy-pasting prompts.

## Setup (Free, 15 minutes)

### Step 1: Install the MCP plugin in Obsidian

- Open Obsidian Settings → Community Plugins → Browse
- Search "MCP" or install from: `github.com/MarkusPfundstein/mcp-obsidian`
- Enable the plugin
- In plugin settings: set vault path to your `docs/` folder

### Step 2: Add to Antigravity Configuration

In your Antigravity IDE configuration (typically in your system MCP servers list, accessible under developer tools/options):

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "mcp-obsidian"],
      "env": {
        "VAULT_PATH": "/home/abhi/Downloads/Realtime Collaborative Document Editor/docs"
      }
    }
  }
}
```

### Step 3: Use in sessions

Antigravity can now call tools like:

- `read_note("03-daily-logs/current-day")` — reads current log
- `write_note("03-daily-logs/current-day", content)` — updates log
- `search_notes("phase 09")` — finds relevant notes
- `list_notes("02-phases")` — lists all phase files

### Automation: Morning Brief

Add to your shell profile (`.zshrc` or `.bashrc`):

```bash
alias collab-start='npm run vault:update && code . && antigravity'
```

This updates the vault context then opens the project in VS Code + Antigravity.
