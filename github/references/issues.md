# Issue Management

Complete reference for `gh issue` commands.

## Table of Contents

- [Creating Issues](#creating-issues)
- [Listing Issues](#listing-issues)
- [Viewing Issues](#viewing-issues)
- [Editing Issues](#editing-issues)
- [Comments](#comments)
- [Closing and Reopening](#closing-and-reopening)
- [Labels and Assignment](#labels-and-assignment)

## Creating Issues

### Basic Creation

```bash
gh issue create                        # Interactive mode
gh issue create --title "Bug title" --body "Description"
```

### Creation Options

```bash
gh issue create --title "Title" --body "Body" \
  --assignee @me \
  --label bug,urgent \
  --milestone "v1.0" \
  --project "Backlog"
```

### From File

```bash
gh issue create --title "Title" --body-file issue.md
```

### Web Mode

```bash
gh issue create --web                  # Open in browser
```

### From Template

```bash
gh issue create --template bug_report.md
```

## Listing Issues

### Basic Listing

```bash
gh issue list                          # Open issues
gh issue list --state all              # All states
gh issue list --state closed           # Closed only
```

### Filtering

```bash
gh issue list --assignee @me           # Assigned to you
gh issue list --author @me             # Created by you
gh issue list --mention @me            # Mentioning you
gh issue list --label bug              # By label
gh issue list --label "bug,urgent"     # Multiple labels (AND)
gh issue list --milestone "v1.0"       # By milestone
```

### Search Queries

```bash
gh issue list --search "is:open label:bug"
gh issue list --search "no:assignee"
gh issue list --search "created:>2024-01-01"
gh issue list --search "updated:<2024-01-01"
gh issue list --search "comments:>10"
gh issue list --search "in:title keyword"
gh issue list --search "in:body keyword"
```

### Output Control

```bash
gh issue list --limit 100              # More results
gh issue list --json number,title,labels
gh issue list --json number,title --jq '.[].title'
```

## Viewing Issues

### Basic View

```bash
gh issue view 123                      # By number
gh issue view https://github.com/o/r/issues/123  # By URL
```

### View Options

```bash
gh issue view 123 --web                # Open in browser
gh issue view 123 --comments           # Include comments
gh issue view 123 --json title,body,labels,assignees
```

## Editing Issues

### Edit Fields

```bash
gh issue edit 123 --title "New title"
gh issue edit 123 --body "New body"
gh issue edit 123 --body-file updated.md
```

### Labels

```bash
gh issue edit 123 --add-label bug,urgent
gh issue edit 123 --remove-label wontfix
```

### Assignment

```bash
gh issue edit 123 --add-assignee user1,user2
gh issue edit 123 --remove-assignee user3
```

### Milestone and Project

```bash
gh issue edit 123 --milestone "v2.0"
gh issue edit 123 --add-project "Roadmap"
gh issue edit 123 --remove-project "Backlog"
```

## Comments

### Add Comment

```bash
gh issue comment 123 --body "Comment text"
gh issue comment 123 --body-file comment.md
```

### Edit Last Comment

```bash
gh issue comment 123 --edit-last --body "Updated comment"
```

### Web Comment

```bash
gh issue comment 123 --web             # Comment in browser
```

## Closing and Reopening

### Close

```bash
gh issue close 123                     # Close issue
gh issue close 123 --comment "Closing because..."
gh issue close 123 --reason completed  # completed, not_planned, reopened
gh issue close 123 --reason "not planned"
```

### Reopen

```bash
gh issue reopen 123
gh issue reopen 123 --comment "Reopening because..."
```

## Labels and Assignment

### View Labels

```bash
gh label list
gh label list --search bug
```

### Create Labels

```bash
gh label create "needs-triage" --color FF0000 --description "Needs triage"
gh label clone source-repo             # Clone labels from another repo
```

### Edit Labels

```bash
gh label edit bug --name "bug-report" --color 00FF00
gh label delete old-label
```

## Lock/Unlock

```bash
gh issue lock 123                      # Lock conversation
gh issue lock 123 --reason spam        # off-topic, too heated, resolved, spam
gh issue unlock 123
```

## Pin/Unpin

```bash
gh issue pin 123                       # Pin to repo
gh issue unpin 123
```

## Transfer

```bash
gh issue transfer 123 new-repo         # Transfer to another repo
```

## Delete

```bash
gh issue delete 123                    # Delete issue (admin only)
gh issue delete 123 --yes              # Skip confirmation
```

## Status Overview

```bash
gh issue status                        # Issues relevant to you
```

Shows:
- Issues assigned to you
- Issues mentioning you
- Issues you created

## Develop Branch

Create a linked branch for an issue:

```bash
gh issue develop 123                   # Create branch for issue
gh issue develop 123 --name my-branch  # Custom branch name
gh issue develop 123 --base develop    # From specific base
gh issue develop 123 --checkout        # Checkout immediately
```

List linked branches:

```bash
gh issue develop 123 --list
```
