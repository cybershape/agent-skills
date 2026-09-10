# Playwright Commands Reference

Complete reference for all playwright-server commands.

## Table of Contents

- [Interaction Commands](#interaction-commands)
- [Inspection Commands](#inspection-commands)
- [Wait Commands](#wait-commands)
- [Tab Management](#tab-management)
- [Dialog Handling](#dialog-handling)
- [JavaScript Evaluation](#javascript-evaluation)

## Interaction Commands

### click - Click element

```bash
curl -s localhost:3210 -d '{"cmd":"click","selector":"button[type=submit]"}'
curl -s localhost:3210 -d '{"cmd":"click","selector":"text=Sign In"}'
curl -s localhost:3210 -d '{"cmd":"click","selector":"#login-button"}'
```

### dblclick - Double click

```bash
curl -s localhost:3210 -d '{"cmd":"dblclick","selector":".item"}'
```

### fill - Fill input field

Clears the field first, then types the value. Best for form inputs.

```bash
curl -s localhost:3210 -d '{"cmd":"fill","selector":"input[name=email]","value":"test@example.com"}'
curl -s localhost:3210 -d '{"cmd":"fill","selector":"#password","value":"secret123"}'
```

### type - Type with key events

Types character by character. Use when you need keypress events.

```bash
curl -s localhost:3210 -d '{"cmd":"type","selector":"input[name=search]","text":"query"}'
curl -s localhost:3210 -d '{"cmd":"type","selector":"input","text":"slow","delay":100}'
```

### press - Press keyboard key

```bash
curl -s localhost:3210 -d '{"cmd":"press","key":"Enter"}'
curl -s localhost:3210 -d '{"cmd":"press","selector":"input","key":"Enter"}'
curl -s localhost:3210 -d '{"cmd":"press","key":"Tab"}'
# Keys: Tab, Escape, ArrowDown, ArrowUp, Backspace, etc.
```

### select - Select dropdown option

```bash
curl -s localhost:3210 -d '{"cmd":"select","selector":"select[name=country]","value":"US"}'
curl -s localhost:3210 -d '{"cmd":"select","selector":"select","values":["opt1","opt2"]}'
```

### check / uncheck - Checkboxes

```bash
curl -s localhost:3210 -d '{"cmd":"check","selector":"input[type=checkbox]"}'
curl -s localhost:3210 -d '{"cmd":"uncheck","selector":"#remember-me"}'
```

### hover - Mouse hover

```bash
curl -s localhost:3210 -d '{"cmd":"hover","selector":".dropdown-trigger"}'
```

### focus - Focus element

```bash
curl -s localhost:3210 -d '{"cmd":"focus","selector":"input[name=email]"}'
```

## Inspection Commands

### text - Get element text content

```bash
curl -s localhost:3210 -d '{"cmd":"text","selector":".message"}'
# Returns: {"text":"Hello World"}
```

### innerText - Get rendered text

```bash
curl -s localhost:3210 -d '{"cmd":"innerText","selector":"body"}'
```

### innerHTML - Get HTML content

```bash
curl -s localhost:3210 -d '{"cmd":"innerHTML","selector":"#content"}'
```

### value - Get input value

```bash
curl -s localhost:3210 -d '{"cmd":"value","selector":"input[name=email]"}'
# Returns: {"value":"test@example.com"}
```

### attribute - Get element attribute

```bash
curl -s localhost:3210 -d '{"cmd":"attribute","selector":"a","name":"href"}'
# Returns: {"value":"/path/to/page"}
```

### visible - Check visibility

```bash
curl -s localhost:3210 -d '{"cmd":"visible","selector":".error-message"}'
# Returns: {"visible":true} or {"visible":false}
```

### enabled - Check if enabled

```bash
curl -s localhost:3210 -d '{"cmd":"enabled","selector":"button[type=submit]"}'
```

### checked - Check if checked

```bash
curl -s localhost:3210 -d '{"cmd":"checked","selector":"input[type=checkbox]"}'
```

### count - Count matching elements

```bash
curl -s localhost:3210 -d '{"cmd":"count","selector":".list-item"}'
# Returns: {"count":5}
```

### console - Get console messages

```bash
curl -s localhost:3210 -d '{"cmd":"console"}'
# Returns: {"messages":[{"type":"log","text":"Hello"},{"type":"error","text":"Oops"}]}

curl -s localhost:3210 -d '{"cmd":"console","clear":true}'
```

## Wait Commands

### wait - Wait for selector

```bash
# Wait for element to be visible (default)
curl -s localhost:3210 -d '{"cmd":"wait","selector":".loaded"}'

# Wait states: visible, hidden, attached, detached
curl -s localhost:3210 -d '{"cmd":"wait","selector":".spinner","state":"hidden"}'

# Custom timeout (ms)
curl -s localhost:3210 -d '{"cmd":"wait","selector":".slow","timeout":60000}'
```

### waitUrl - Wait for URL change

```bash
# Exact URL
curl -s localhost:3210 -d '{"cmd":"waitUrl","pattern":"http://localhost:3000/dashboard"}'

# Glob pattern
curl -s localhost:3210 -d '{"cmd":"waitUrl","pattern":"**/dashboard"}'

# Regex (wrap in slashes)
curl -s localhost:3210 -d '{"cmd":"waitUrl","pattern":"/\\/users\\/\\d+/"}'
```

### waitLoad - Wait for load state

```bash
curl -s localhost:3210 -d '{"cmd":"waitLoad"}'
# States: domcontentloaded, load, networkidle
curl -s localhost:3210 -d '{"cmd":"waitLoad","state":"networkidle"}'
```

### sleep - Wait fixed time

```bash
curl -s localhost:3210 -d '{"cmd":"sleep","ms":1000}'
```

## Tab Management

### tabs - List open tabs

```bash
curl -s localhost:3210 -d '{"cmd":"tabs"}'
# Returns: {"tabs":[{"index":0,"url":"http://...","active":true}]}
```

### newTab - Open new tab

```bash
curl -s localhost:3210 -d '{"cmd":"newTab"}'
curl -s localhost:3210 -d '{"cmd":"newTab","url":"http://example.com"}'
```

### switchTab - Switch to tab

```bash
curl -s localhost:3210 -d '{"cmd":"switchTab","index":0}'
```

### closeTab - Close tab

```bash
curl -s localhost:3210 -d '{"cmd":"closeTab"}'          # Close current
curl -s localhost:3210 -d '{"cmd":"closeTab","index":1}'  # Close specific
```

## Dialog Handling

Register handler before triggering the dialog:

```bash
# Accept next dialog
curl -s localhost:3210 -d '{"cmd":"dialog","action":"accept"}'

# Dismiss next dialog
curl -s localhost:3210 -d '{"cmd":"dialog","action":"dismiss"}'

# Accept prompt with text
curl -s localhost:3210 -d '{"cmd":"dialog","action":"accept","text":"my input"}'
```

## JavaScript Evaluation

### eval - Run JavaScript on page

```bash
# Get page title
curl -s localhost:3210 -d '{"cmd":"eval","script":"document.title"}'

# Get localStorage
curl -s localhost:3210 -d '{"cmd":"eval","script":"localStorage.getItem(\"token\")"}'

# Complex expression
curl -s localhost:3210 -d '{"cmd":"eval","script":"Array.from(document.querySelectorAll(\"li\")).map(e => e.textContent)"}'
```
