# GitHub API Usage

Complete reference for `gh api` commands.

## Table of Contents

- [Basic Requests](#basic-requests)
- [HTTP Methods](#http-methods)
- [Parameters](#parameters)
- [Output Formatting](#output-formatting)
- [Pagination](#pagination)
- [Common Endpoints](#common-endpoints)
- [GraphQL](#graphql)

## Basic Requests

### Simple GET

```bash
gh api repos/{owner}/{repo}            # Current repo
gh api repos/cli/cli                   # Specific repo
gh api user                            # Authenticated user
gh api users/octocat                   # Specific user
```

### Placeholders

`{owner}`, `{repo}`, and `{branch}` are auto-filled from current repo:

```bash
gh api repos/{owner}/{repo}
gh api repos/{owner}/{repo}/branches/{branch}
```

### Different Repo

```bash
gh api repos/other/repo
gh api -X GET /repos/other/repo/issues
```

## HTTP Methods

### GET (default)

```bash
gh api repos/{owner}/{repo}
gh api repos/{owner}/{repo}/issues
```

### POST

```bash
gh api repos/{owner}/{repo}/issues \
  -f title="Bug report" \
  -f body="Description"
```

### PATCH

```bash
gh api repos/{owner}/{repo}/issues/123 \
  -X PATCH \
  -f state="closed"
```

### PUT

```bash
gh api repos/{owner}/{repo}/subscription \
  -X PUT \
  -f subscribed=true
```

### DELETE

```bash
gh api repos/{owner}/{repo}/issues/123/labels/bug \
  -X DELETE
```

## Parameters

### String Parameters (-f)

```bash
gh api repos/{owner}/{repo}/issues \
  -f title="Title" \
  -f body="Body text"
```

### Typed Parameters (-F)

```bash
# Integers
gh api repos/{owner}/{repo}/issues \
  -F per_page=100

# Booleans
gh api repos/{owner}/{repo} \
  -X PATCH \
  -F private=true

# Null
gh api repos/{owner}/{repo}/issues/123 \
  -X PATCH \
  -F milestone=null
```

### From File (-F @file)

```bash
gh api repos/{owner}/{repo}/issues \
  -f title="Title" \
  -F body=@description.md
```

### From Stdin

```bash
echo "Comment text" | gh api repos/{owner}/{repo}/issues/123/comments \
  -F body=@-
```

### Raw Body (--input)

```bash
cat data.json | gh api repos/{owner}/{repo}/issues --input -
```

## Output Formatting

### JSON Filtering (--jq)

```bash
# Extract single field
gh api user --jq '.login'

# Extract from array
gh api repos/{owner}/{repo}/issues --jq '.[].title'

# Multiple fields
gh api repos/{owner}/{repo}/issues --jq '.[] | {number, title}'

# Filter array
gh api repos/{owner}/{repo}/issues --jq '[.[] | select(.labels[].name == "bug")]'

# Count
gh api repos/{owner}/{repo}/issues --jq 'length'
```

### Template Output (--template)

```bash
gh api repos/{owner}/{repo}/issues \
  --template '{{range .}}{{.number}}: {{.title}}{{"\n"}}{{end}}'
```

### Headers Only

```bash
gh api repos/{owner}/{repo} --include   # Show response headers
gh api repos/{owner}/{repo} -i
```

### Silent

```bash
gh api repos/{owner}/{repo}/issues/123 -X PATCH -f state=closed --silent
```

## Pagination

### Automatic Pagination

```bash
gh api repos/{owner}/{repo}/issues --paginate
gh api repos/{owner}/{repo}/issues --paginate --jq '.[].title'
```

### Manual Pagination

```bash
gh api repos/{owner}/{repo}/issues -F per_page=100 -F page=1
gh api repos/{owner}/{repo}/issues -F per_page=100 -F page=2
```

### Limit Results

```bash
gh api repos/{owner}/{repo}/issues --paginate --jq '.[:10]'
```

## Common Endpoints

### Repository

```bash
# Repo info
gh api repos/{owner}/{repo}

# List branches
gh api repos/{owner}/{repo}/branches

# List tags
gh api repos/{owner}/{repo}/tags

# List contributors
gh api repos/{owner}/{repo}/contributors

# Repo stats
gh api repos/{owner}/{repo}/traffic/views
gh api repos/{owner}/{repo}/traffic/clones
```

### Issues and PRs

```bash
# List issues
gh api repos/{owner}/{repo}/issues

# Single issue
gh api repos/{owner}/{repo}/issues/123

# Issue comments
gh api repos/{owner}/{repo}/issues/123/comments

# PR files changed
gh api repos/{owner}/{repo}/pulls/123/files

# PR reviews
gh api repos/{owner}/{repo}/pulls/123/reviews

# PR commits
gh api repos/{owner}/{repo}/pulls/123/commits
```

### Users and Organizations

```bash
# Current user
gh api user

# User repos
gh api users/username/repos

# Org members
gh api orgs/orgname/members

# Org repos
gh api orgs/orgname/repos
```

### Actions

```bash
# List workflows
gh api repos/{owner}/{repo}/actions/workflows

# List runs
gh api repos/{owner}/{repo}/actions/runs

# Specific run
gh api repos/{owner}/{repo}/actions/runs/123456789

# Run jobs
gh api repos/{owner}/{repo}/actions/runs/123456789/jobs

# Artifacts
gh api repos/{owner}/{repo}/actions/artifacts
```

### Search

```bash
# Search repos
gh api search/repositories -f q="language:rust stars:>1000"

# Search issues
gh api search/issues -f q="repo:{owner}/{repo} is:issue is:open"

# Search code
gh api search/code -f q="filename:package.json repo:{owner}/{repo}"
```

## GraphQL

### Basic Query

```bash
gh api graphql -f query='
  query {
    viewer {
      login
      name
    }
  }
'
```

### With Variables

```bash
gh api graphql -f query='
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      name
      stargazerCount
    }
  }
' -f owner='{owner}' -f repo='{repo}'
```

### Query from File

```bash
gh api graphql -F query=@query.graphql -F owner='{owner}' -F repo='{repo}'
```

### Common GraphQL Queries

```bash
# PR with reviews
gh api graphql -f query='
  query($number: Int!) {
    repository(owner: "{owner}", name: "{repo}") {
      pullRequest(number: $number) {
        title
        reviews(first: 10) {
          nodes {
            author { login }
            state
          }
        }
      }
    }
  }
' -F number=123

# User contributions
gh api graphql -f query='
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
      }
    }
  }
' -f login=username
```

## Error Handling

### Check Status

```bash
gh api repos/{owner}/{repo} && echo "Success" || echo "Failed"
```

### Verbose Output

```bash
gh api repos/{owner}/{repo} --verbose
```

### HTTP Status in Script

```bash
status=$(gh api repos/{owner}/{repo} --jq '.status // 200' 2>/dev/null)
```

## Authentication

### Check Auth

```bash
gh auth status
gh api user
```

### Different Host

```bash
gh api repos/owner/repo --hostname github.example.com
```

### Token in Header

```bash
gh api repos/{owner}/{repo} --header 'Accept: application/vnd.github+json'
```
