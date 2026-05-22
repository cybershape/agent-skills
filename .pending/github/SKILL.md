---
name: github
description: Work with GitHub using the gh CLI. Use when creating/managing pull requests, reviewing code, managing issues, viewing GitHub Actions runs, creating releases, or making API requests. Triggers on GitHub-related tasks like "create a PR", "list open issues", "check CI status", "merge this PR", or "create a release".
allowed-tools: Bash, Read, Task
---

# GitHub CLI Skill

Use **gh** for all GitHub operations from the command line.

## Prerequisites

Check authentication status:

```bash
gh auth status
```

If not authenticated:

```bash
gh auth login
```

## Quick Reference

| Task | Command |
|------|---------|
| Create PR | `gh pr create` |
| List PRs | `gh pr list` |
| View PR | `gh pr view 123` |
| Checkout PR | `gh pr checkout 123` |
| Merge PR | `gh pr merge 123` |
| List issues | `gh issue list` |
| Create issue | `gh issue create` |
| View issue | `gh issue view 123` |
| Check CI status | `gh pr checks` |
| View runs | `gh run list` |
| Create release | `gh release create v1.0.0` |

## Core Workflows

### Pull Requests

Create a PR from current branch:

```bash
gh pr create --fill                    # Auto-fill title/body from commits
gh pr create --title "Title" --body "Description"
gh pr create --draft                   # Create as draft
gh pr create --base main               # Target specific branch
```

List and filter PRs:

```bash
gh pr list                             # Open PRs
gh pr list --state all                 # All PRs
gh pr list --author @me                # Your PRs
gh pr list --search "review:required"  # Needs review
```

**For complete PR operations**: See [references/pr.md](references/pr.md)

### Code Review

Review a PR:

```bash
gh pr review 123 --approve
gh pr review 123 --request-changes --body "Please fix X"
gh pr review 123 --comment --body "Looks good overall"
```

View changes:

```bash
gh pr diff 123                         # View diff
gh pr checks 123                       # View CI status
```

**For complete review workflows**: See [references/review.md](references/review.md)

### Issues

Create and manage issues:

```bash
gh issue create --title "Bug" --body "Description"
gh issue list --label bug
gh issue view 123
gh issue close 123
```

**For complete issue operations**: See [references/issues.md](references/issues.md)

### GitHub Actions

View workflow runs:

```bash
gh run list                            # Recent runs
gh run view                            # Latest run details
gh run view 123456                     # Specific run
gh run watch                           # Watch current run
```

**For complete Actions workflows**: See [references/actions.md](references/actions.md)

### Releases

Create releases:

```bash
gh release create v1.0.0               # Create from tag
gh release create v1.0.0 --generate-notes
gh release list
```

**For complete release operations**: See [references/releases.md](references/releases.md)

### API Requests

Make authenticated API calls:

```bash
gh api repos/{owner}/{repo}
gh api repos/{owner}/{repo}/pulls --jq '.[].title'
```

**For complete API usage**: See [references/api.md](references/api.md)

## Common Flags

| Flag | Description |
|------|-------------|
| `-R owner/repo` | Target different repo |
| `--web` | Open in browser |
| `--json fields` | JSON output |
| `--jq expression` | Filter JSON |

## Repository Context

gh auto-detects the current repository. Override with:

```bash
gh pr list -R owner/repo
```

Or set default:

```bash
gh repo set-default owner/repo
```
