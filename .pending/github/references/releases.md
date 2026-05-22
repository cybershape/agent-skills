# Release Management

Complete reference for `gh release` commands.

## Table of Contents

- [Creating Releases](#creating-releases)
- [Listing Releases](#listing-releases)
- [Viewing Releases](#viewing-releases)
- [Editing Releases](#editing-releases)
- [Assets](#assets)
- [Deleting Releases](#deleting-releases)

## Creating Releases

### Basic Creation

```bash
gh release create v1.0.0               # Create from existing tag
gh release create v1.0.0 --target main # Create tag on branch
```

### With Release Notes

```bash
gh release create v1.0.0 --generate-notes        # Auto-generate from PRs
gh release create v1.0.0 --notes "Release notes"
gh release create v1.0.0 --notes-file CHANGELOG.md
```

### Draft and Prerelease

```bash
gh release create v1.0.0-beta --prerelease
gh release create v1.0.0 --draft                 # Create as draft
```

### With Assets

```bash
gh release create v1.0.0 dist/*.zip              # Upload files
gh release create v1.0.0 'dist/app.zip#App Binary'  # With label
gh release create v1.0.0 dist/*.tar.gz dist/*.zip
```

### Full Example

```bash
gh release create v1.0.0 \
  --title "Version 1.0.0" \
  --notes-file CHANGELOG.md \
  --target main \
  dist/app-linux.tar.gz \
  dist/app-macos.tar.gz \
  dist/app-windows.zip
```

### Latest Flag

```bash
gh release create v2.0.0 --latest                # Mark as latest (default)
gh release create v1.0.1 --latest=false          # Don't mark as latest
```

### Discussion Category

```bash
gh release create v1.0.0 --discussion-category "Announcements"
```

## Listing Releases

### Basic Listing

```bash
gh release list                        # All releases
gh release list --limit 10             # Limit results
gh release list --exclude-drafts       # Exclude drafts
gh release list --exclude-pre-releases # Exclude prereleases
```

### JSON Output

```bash
gh release list --json tagName,name,publishedAt
gh release list --json tagName --jq '.[].tagName'
```

## Viewing Releases

### View Release

```bash
gh release view                        # Latest release
gh release view v1.0.0                 # Specific release
gh release view v1.0.0 --web           # Open in browser
```

### JSON Output

```bash
gh release view v1.0.0 --json tagName,body,assets
gh release view v1.0.0 --json assets --jq '.assets[].name'
```

## Editing Releases

### Edit Fields

```bash
gh release edit v1.0.0 --title "New Title"
gh release edit v1.0.0 --notes "Updated notes"
gh release edit v1.0.0 --notes-file NEW_CHANGELOG.md
gh release edit v1.0.0 --tag v1.0.1    # Change tag
```

### Change Status

```bash
gh release edit v1.0.0 --draft=false   # Publish draft
gh release edit v1.0.0 --draft         # Convert to draft
gh release edit v1.0.0 --prerelease    # Mark as prerelease
gh release edit v1.0.0 --prerelease=false
gh release edit v1.0.0 --latest        # Mark as latest
gh release edit v1.0.0 --latest=false
```

### Discussion

```bash
gh release edit v1.0.0 --discussion-category "Releases"
```

## Assets

### Upload Assets

```bash
gh release upload v1.0.0 dist/*.zip
gh release upload v1.0.0 'app.zip#Application' # With label
gh release upload v1.0.0 file.tar.gz --clobber # Overwrite existing
```

### Download Assets

```bash
gh release download                    # Latest release assets
gh release download v1.0.0             # Specific release
gh release download v1.0.0 --pattern "*.tar.gz"
gh release download v1.0.0 --dir ./downloads
gh release download v1.0.0 --archive zip  # Download source archive
gh release download v1.0.0 --archive tar.gz
```

### Download Specific Asset

```bash
gh release download v1.0.0 --pattern "app-linux-*"
gh release download v1.0.0 --pattern "checksums.txt"
```

### Delete Assets

```bash
gh release delete-asset v1.0.0 app.zip
gh release delete-asset v1.0.0 app.zip --yes  # Skip confirmation
```

## Deleting Releases

### Delete Release

```bash
gh release delete v1.0.0               # Delete release (keeps tag)
gh release delete v1.0.0 --yes         # Skip confirmation
gh release delete v1.0.0 --cleanup-tag # Delete tag too
```

## Common Workflows

### Create Release from Tag

```bash
# Assuming tag already exists
gh release create v1.0.0 --generate-notes
```

### Create Tag and Release

```bash
gh release create v1.0.0 --target main --generate-notes
```

### Release with Build Artifacts

```bash
# Build first
npm run build

# Create release with artifacts
gh release create v1.0.0 \
  --generate-notes \
  dist/app-linux.tar.gz \
  dist/app-macos.tar.gz \
  dist/app-windows.zip
```

### Draft Release Workflow

```bash
# 1. Create draft
gh release create v1.0.0 --draft --generate-notes

# 2. Upload artifacts as they're built
gh release upload v1.0.0 dist/linux.tar.gz
gh release upload v1.0.0 dist/macos.tar.gz

# 3. Publish when ready
gh release edit v1.0.0 --draft=false
```

### Prerelease Workflow

```bash
# Create beta
gh release create v1.0.0-beta.1 --prerelease --generate-notes

# Later, create stable
gh release create v1.0.0 --generate-notes
```

### Compare Releases

```bash
# View changes between releases
gh api repos/{owner}/{repo}/compare/v1.0.0...v1.1.0
```
