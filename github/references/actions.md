# GitHub Actions

Complete reference for `gh run` and `gh workflow` commands.

## Table of Contents

- [Viewing Runs](#viewing-runs)
- [Watching Runs](#watching-runs)
- [Re-running Workflows](#re-running-workflows)
- [Workflow Management](#workflow-management)
- [Artifacts](#artifacts)
- [Caches](#caches)

## Viewing Runs

### List Runs

```bash
gh run list                            # Recent runs
gh run list --limit 50                 # More results
gh run list --workflow test.yml        # Specific workflow
gh run list --branch main              # Specific branch
gh run list --user @me                 # Your runs
gh run list --event push               # By trigger event
gh run list --status failure           # By status
```

### Run Statuses

```bash
gh run list --status queued
gh run list --status in_progress
gh run list --status completed
gh run list --status success
gh run list --status failure
gh run list --status cancelled
```

### JSON Output

```bash
gh run list --json databaseId,status,conclusion,name
gh run list --json status --jq '.[].status'
```

### View Run Details

```bash
gh run view                            # Latest run
gh run view 123456789                  # Specific run ID
gh run view 123456789 --web            # Open in browser
```

### View Jobs

```bash
gh run view 123456789 --job 987654     # Specific job
gh run view 123456789 --log            # Full log output
gh run view 123456789 --log-failed     # Only failed job logs
```

### Exit Codes

```bash
gh run view 123456789 --exit-status    # Exit with run's status code
```

## Watching Runs

### Watch Live

```bash
gh run watch                           # Watch latest run
gh run watch 123456789                 # Watch specific run
gh run watch --exit-status             # Exit with run's status
gh run watch --interval 10             # Check every 10 seconds
```

## Re-running Workflows

### Re-run

```bash
gh run rerun 123456789                 # Re-run entire workflow
gh run rerun 123456789 --failed        # Re-run only failed jobs
gh run rerun 123456789 --job 987654    # Re-run specific job
gh run rerun 123456789 --debug         # Re-run with debug logging
```

### Cancel

```bash
gh run cancel 123456789                # Cancel running workflow
```

### Delete

```bash
gh run delete 123456789                # Delete run record
```

## Workflow Management

### List Workflows

```bash
gh workflow list                       # All workflows
gh workflow list --all                 # Include disabled
```

### View Workflow

```bash
gh workflow view test.yml              # View workflow details
gh workflow view test.yml --web        # Open in browser
gh workflow view test.yml --yaml       # Show workflow YAML
```

### Run Workflow Manually

```bash
gh workflow run test.yml               # Trigger workflow_dispatch
gh workflow run test.yml --ref develop # On specific branch
gh workflow run test.yml -f input1=value1 -f input2=value2
gh workflow run test.yml --json        # Input from JSON
```

### Enable/Disable

```bash
gh workflow disable test.yml
gh workflow enable test.yml
```

## Artifacts

### Download Artifacts

```bash
gh run download                        # Latest run's artifacts
gh run download 123456789              # Specific run
gh run download 123456789 --name logs  # Specific artifact
gh run download 123456789 --dir ./out  # Output directory
gh run download 123456789 --pattern "*.zip"
```

### List Artifacts

```bash
gh run view 123456789 --json artifacts
```

## Caches

### List Caches

```bash
gh cache list                          # All caches
gh cache list --limit 100
gh cache list --sort size_in_bytes     # Sort by size
gh cache list --order desc
gh cache list --key node-modules       # Filter by key
```

### Delete Caches

```bash
gh cache delete KEY                    # Delete by key
gh cache delete --all                  # Delete all caches
```

## Common Workflows

### Check CI Status for PR

```bash
gh pr checks                           # Current PR
gh pr checks 123                       # Specific PR
gh pr checks 123 --watch               # Watch until done
gh pr checks 123 --fail-fast           # Exit on first failure
```

### Wait for CI Then Merge

```bash
gh pr checks 123 --watch && gh pr merge 123 --squash
```

### Debug Failed Run

```bash
# 1. Find failed run
gh run list --status failure --limit 5

# 2. View failure details
gh run view 123456789 --log-failed

# 3. Re-run with debug
gh run rerun 123456789 --debug
```

### Trigger Deploy Workflow

```bash
gh workflow run deploy.yml \
  -f environment=production \
  -f version=v1.2.3
```

### Monitor Deployment

```bash
# Start workflow
gh workflow run deploy.yml -f environment=staging

# Watch the run
gh run list --workflow deploy.yml --limit 1
gh run watch
```
