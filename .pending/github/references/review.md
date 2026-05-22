# Code Review Workflows

Complete reference for reviewing pull requests with `gh`.

## Table of Contents

- [Reviewing PRs](#reviewing-prs)
- [Viewing Changes](#viewing-changes)
- [Adding Comments](#adding-comments)
- [Review Workflows](#review-workflows)

## Reviewing PRs

### Submit Review

```bash
gh pr review 123 --approve
gh pr review 123 --request-changes --body "Please fix the tests"
gh pr review 123 --comment --body "Some general feedback"
```

### Review Options

```bash
gh pr review 123 --approve --body "LGTM!"
gh pr review 123 --body-file review.md
```

### Review Current Branch's PR

```bash
gh pr review --approve                 # Approve current PR
gh pr review --request-changes --body "Fix X"
```

## Viewing Changes

### View Diff

```bash
gh pr diff                             # Current branch's PR
gh pr diff 123                         # Specific PR
gh pr diff 123 --patch                 # Patch format
gh pr diff 123 --name-only             # File names only
```

### View in Browser

```bash
gh pr view 123 --web                   # Full PR page
gh pr diff 123 --web                   # Diff view in browser
```

### View with Context

```bash
gh pr view 123 --comments              # Include all comments
```

### JSON Output for Analysis

```bash
gh pr view 123 --json additions,deletions,changedFiles
gh pr view 123 --json files --jq '.files[].path'
```

## Adding Comments

### PR-level Comments

```bash
gh pr comment 123 --body "Comment text"
gh pr comment 123 --body-file comment.md
```

### Edit Last Comment

```bash
gh pr comment 123 --edit-last --body "Updated comment"
```

### View Comments

```bash
gh pr view 123 --comments
```

### API for Line Comments

Line comments require the API:

```bash
# Get the commit SHA and diff position first
gh api repos/{owner}/{repo}/pulls/123/files

# Add review comment
gh api repos/{owner}/{repo}/pulls/123/comments \
  -f body="Comment on specific line" \
  -f commit_id="SHA" \
  -f path="file.js" \
  -F line=42 \
  -F side=RIGHT
```

## Review Workflows

### Efficient Review Process

1. **Check PR status and context**:
   ```bash
   gh pr view 123
   gh pr checks 123
   ```

2. **View the diff**:
   ```bash
   gh pr diff 123
   ```

3. **Checkout locally for deeper review**:
   ```bash
   gh pr checkout 123
   # Run tests, explore code
   ```

4. **Submit review**:
   ```bash
   gh pr review 123 --approve --body "Tested locally, LGTM"
   ```

### Finding PRs to Review

```bash
# PRs requesting your review
gh pr status

# PRs needing review in repo
gh pr list --search "review:required"

# PRs by team needing review
gh pr list --search "team-review-requested:org/team"

# Draft PRs (might need early feedback)
gh pr list --search "draft:true"
```

### Review with CI Context

```bash
# Check if CI passed before reviewing
gh pr checks 123

# Watch CI while reviewing
gh pr checks 123 --watch
```

### Batch Review Status

```bash
# Get review status for multiple PRs
gh pr list --json number,title,reviewDecision \
  --jq '.[] | "\(.number): \(.title) [\(.reviewDecision)]"'
```

### Re-request Review

After making changes, authors can re-request review:

```bash
gh pr edit 123 --add-reviewer username
```

## Review States

PR review decisions:
- `APPROVED` - Approved for merge
- `CHANGES_REQUESTED` - Changes needed
- `COMMENTED` - General comments only
- `PENDING` - Review in progress
- `REVIEW_REQUIRED` - Needs review

Query by state:

```bash
gh pr list --search "review:approved"
gh pr list --search "review:changes_requested"
gh pr list --search "review:required"
gh pr list --search "review:none"
```

## After Review

### Merge Approved PR

```bash
gh pr merge 123 --squash --delete-branch
```

### Request Changes Fixed

After changes are pushed:

```bash
gh pr view 123                         # Check updates
gh pr diff 123                         # Review new changes
gh pr review 123 --approve             # Approve after fixes
```
