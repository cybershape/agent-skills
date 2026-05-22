# Playwright Common Workflows

## Login Flow

```bash
# Ensure server running
curl -sf localhost:3210/health || (node ~/.claude/bin/playwright-server.js &>/dev/null & sleep 1)

# Start browser and navigate
curl -s localhost:3210 -d '{"cmd":"start"}'
curl -s localhost:3210 -d '{"cmd":"navigate","url":"http://localhost:3000/login"}'

# Get snapshot to understand page
curl -s localhost:3210 -d '{"cmd":"snapshot"}'

# Fill credentials
curl -s localhost:3210 -d '{"cmd":"fill","selector":"input[name=email]","value":"user@example.com"}'
curl -s localhost:3210 -d '{"cmd":"fill","selector":"input[name=password]","value":"password123"}'

# Submit
curl -s localhost:3210 -d '{"cmd":"click","selector":"button[type=submit]"}'

# Wait for redirect
curl -s localhost:3210 -d '{"cmd":"waitUrl","pattern":"**/dashboard"}'

# Verify success
curl -s localhost:3210 -d '{"cmd":"snapshot"}'
```

## Form Testing

```bash
# Fill all fields
curl -s localhost:3210 -d '{"cmd":"fill","selector":"#name","value":"John Doe"}'
curl -s localhost:3210 -d '{"cmd":"fill","selector":"#email","value":"john@example.com"}'
curl -s localhost:3210 -d '{"cmd":"select","selector":"#country","value":"US"}'
curl -s localhost:3210 -d '{"cmd":"check","selector":"#terms"}'

# Submit and wait
curl -s localhost:3210 -d '{"cmd":"click","selector":"button[type=submit]"}'
curl -s localhost:3210 -d '{"cmd":"wait","selector":".success-message"}'

# Check result
curl -s localhost:3210 -d '{"cmd":"text","selector":".success-message"}'
```

## Error Verification

```bash
# Trigger error
curl -s localhost:3210 -d '{"cmd":"fill","selector":"#email","value":"invalid"}'
curl -s localhost:3210 -d '{"cmd":"click","selector":"button[type=submit]"}'

# Check error appears
curl -s localhost:3210 -d '{"cmd":"wait","selector":".error"}'
curl -s localhost:3210 -d '{"cmd":"visible","selector":".error"}'
curl -s localhost:3210 -d '{"cmd":"text","selector":".error"}'
```

## Multi-Page Navigation

```bash
# Navigate through pages
curl -s localhost:3210 -d '{"cmd":"navigate","url":"http://localhost:3000"}'
curl -s localhost:3210 -d '{"cmd":"click","selector":"text=Products"}'
curl -s localhost:3210 -d '{"cmd":"waitUrl","pattern":"**/products"}'
curl -s localhost:3210 -d '{"cmd":"click","selector":".product-card:first-child"}'
curl -s localhost:3210 -d '{"cmd":"waitUrl","pattern":"**/products/*"}'
curl -s localhost:3210 -d '{"cmd":"back"}'
curl -s localhost:3210 -d '{"cmd":"waitUrl","pattern":"**/products"}'
```

## Screenshot Comparison

```bash
# Capture before state
curl -s localhost:3210 -d '{"cmd":"screenshot","path":"/tmp/before.png"}'

# Make changes
curl -s localhost:3210 -d '{"cmd":"click","selector":"button[data-action=toggle]"}'

# Capture after state
curl -s localhost:3210 -d '{"cmd":"screenshot","path":"/tmp/after.png"}'
```

## Troubleshooting

### Server won't start

```bash
# Check if port is in use
lsof -i :3210

# Kill existing process
pkill -f playwright-server

# Start with debug output
node ~/.claude/bin/playwright-server.js
```

### Browser not starting

```bash
# Reinstall browsers
cd ~/.claude/bin && npx playwright install chromium
```

### Selector not found

1. Use `snapshot` to see page structure
2. Use `wait` before interacting with dynamic elements
3. Try alternative selectors (text, role, css)

### Timeout errors

```bash
# Increase timeout
curl -s localhost:3210 -d '{"cmd":"wait","selector":".slow","timeout":60000}'
```

### Element not interactable

```bash
# Wait for visibility first
curl -s localhost:3210 -d '{"cmd":"wait","selector":"button","state":"visible"}'

# Try scrolling element into view
curl -s localhost:3210 -d '{"cmd":"eval","script":"document.querySelector(\"button\").scrollIntoView()"}'
```

## Environment Variables

- `PLAYWRIGHT_PORT` - Server port (default: 3210)
