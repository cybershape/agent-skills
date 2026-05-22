# Pull Request Operations

Complete reference for `gh pr` commands.

## Table of Contents

- [Creating PRs](#creating-prs)
- [Listing PRs](#listing-prs)
- [Viewing PRs](#viewing-prs)
- [Checkout](#checkout)
- [Merging](#merging)
- [Editing](#editing)
- [Status and Checks](#status-and-checks)
- [Closing and Reopening](#closing-and-reopening)

## Creating PRs

### Basic Creation

```bash
gh pr create                           # Interactive mode
gh pr create --fill                    # Auto-fill from commits
gh pr create --title "Title" --body "Body"
```

### Creation Options

```bash
gh pr create --draft                   # Create as draft
gh pr create --base main               # Target branch
gh pr create --head feature-branch     # Source branch
gh pr create --assignee @me            # Assign to self
gh pr create --reviewer user1,user2    # Request reviewers
gh pr create --label bug,urgent        # Add labels
gh pr create --milestone "v1.0"        # Set milestone
gh pr create --project "Board"         # Add to project
```

### From Template

```bash
gh pr create --template bug.md         # Use PR template
gh pr create --body-file description.md
```

### Web Mode

```bash
gh pr create --web                     # Open in browser to finish
```

## Listing PRs

### Basic Listing

```bash
gh pr list                             # Open PRs (default)
gh pr list --state all                 # All states
gh pr list --state closed              # Closed only
gh pr list --state merged              # Merged only
```

### Filtering

```bash
gh pr list --author @me                # Your PRs
gh pr list --author username           # Specific author
gh pr list --assignee @me              # Assigned to you
gh pr list --label bug                 # By label
gh pr list --base main                 # Target branch
gh pr list --head feature              # Source branch
```

### Search Queries

```bash
gh pr list --search "is:open review:required"
gh pr list --search "draft:false"
gh pr list --search "updated:>2024-01-01"
gh pr list --search "involves:username"
```

### Output Control

```bash
gh pr list --limit 50                  # More results
gh pr list --json number,title,author  # JSON output
gh pr list --json number,title --jq '.[].title'
```

## Viewing PRs

### Basic View

```bash
gh pr view                             # Current branch's PR
gh pr view 123                         # By number
gh pr view feature-branch              # By branch name
gh pr view https://github.com/o/r/pull/123  # By URL
```

### View Options

```bash
gh pr view 123 --web                   # Open in browser
gh pr view 123 --comments              # Include comments
gh pr view 123 --json title,body,reviews
```

### View Diff

```bash
gh pr diff                             # Current PR
gh pr diff 123                         # Specific PR
gh pr diff 123 --patch                 # Patch format
```

## Checkout

### Basic Checkout

```bash
gh pr checkout 123                     # Checkout by number
gh pr checkout feature-branch          # By branch name
```

### Checkout Options

```bash
gh pr checkout 123 --force             # Force checkout
gh pr checkout 123 --detach            # Detached HEAD
gh pr checkout 123 --branch my-branch  # Custom local branch name
gh pr checkout 123 --recurse-submodules
```

## Merging

### Basic Merge

```bash
gh pr merge                            # Current branch's PR
gh pr merge 123                        # By number
```

### Merge Methods

```bash
gh pr merge 123 --merge                # Merge commit (default)
gh pr merge 123 --squash               # Squash and merge
gh pr merge 123 --rebase               # Rebase and merge
```

### Merge Options

```bash
gh pr merge 123 --auto                 # Auto-merge when checks pass
gh pr merge 123 --delete-branch        # Delete branch after merge
gh pr merge 123 --admin                # Admin override
gh pr merge 123 --subject "Commit message"
gh pr merge 123 --body "Extended description"
```

### Disable Auto-merge

```bash
gh pr merge 123 --disable-auto
```

## Editing

### Edit PR

```bash
gh pr edit 123 --title "New title"
gh pr edit 123 --body "New body"
gh pr edit 123 --body-file updated.md
gh pr edit 123 --base develop          # Change target branch
```

### Labels

```bash
gh pr edit 123 --add-label bug,urgent
gh pr edit 123 --remove-label wip
```

### Assignees and Reviewers

```bash
gh pr edit 123 --add-assignee user1
gh pr edit 123 --remove-assignee user2
gh pr edit 123 --add-reviewer user1,team/core
gh pr edit 123 --remove-reviewer user3
```

### Milestone and Project

```bash
gh pr edit 123 --milestone "v2.0"
gh pr edit 123 --add-project "Roadmap"
gh pr edit 123 --remove-project "Backlog"
```

### Draft Status

```bash
gh pr ready 123                        # Mark ready for review
gh pr ready 123 --undo                 # Convert back to draft
```

## Status and Checks

### PR Status

```bash
gh pr status                           # Overview of relevant PRs
```

Shows:
- PRs you created
- PRs requesting your review
- PRs on current branch

### CI Checks

```bash
gh pr checks                           # Current PR's checks
gh pr checks 123                       # Specific PR
gh pr checks 123 --watch               # Watch until complete
gh pr checks 123 --fail-fast           # Exit on first failure
```

### Required Checks

```bash
gh pr checks 123 --required            # Only required checks
```

## Closing and Reopening

### Close

```bash
gh pr close 123                        # Close PR
gh pr close 123 --comment "Reason"     # With comment
gh pr close 123 --delete-branch        # Delete branch too
```

### Reopen

```bash
gh pr reopen 123                       # Reopen closed PR
gh pr reopen 123 --comment "Reopening because..."
```

## Comments

```bash
gh pr comment 123 --body "Comment text"
gh pr comment 123 --body-file comment.md
gh pr comment 123 --edit-last          # Edit your last comment
```

## Update Branch

```bash
gh pr update-branch 123                # Update with base branch
gh pr update-branch 123 --rebase       # Rebase instead of merge
```

## Lock/Unlock

```bash
gh pr lock 123                         # Lock conversation
gh pr lock 123 --reason spam
gh pr unlock 123                       # Unlock conversation
```
