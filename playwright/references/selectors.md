# Playwright Selector Strategies

Playwright supports multiple selector types for targeting elements.

## CSS Selectors

Standard CSS selectors:

```bash
"button[type=submit]"
"#login-form input[name=email]"
".error-message"
"div.card > h2"
"input:first-child"
```

## Text Selectors

Match by visible text:

```bash
"text=Sign In"           # Exact match
"text=Submit"            # Exact match
"text=/Sign\\s+In/i"     # Regex match (case insensitive)
```

## Role Selectors (Accessibility)

Match by ARIA role and accessible name:

```bash
"role=button[name='Sign In']"
"role=textbox[name='Email']"
"role=link[name='Home']"
"role=heading[level=1]"
"role=checkbox[checked=true]"
```

## XPath Selectors

Full XPath support:

```bash
"xpath=//button[@type='submit']"
"xpath=//div[contains(@class, 'error')]"
"xpath=//h1[text()='Welcome']"
```

## Combining Selectors

Chain selectors with `>>`:

```bash
"#form >> input[name=email]"           # CSS then CSS
".modal >> button:has-text('OK')"      # CSS with text filter
"role=dialog >> role=button[name='Close']"  # Role then role
```

## Filtering Selectors

### :has-text() - Contains text

```bash
"button:has-text('Submit')"
"div:has-text('Error')"
```

### :has() - Contains element

```bash
"div:has(> img)"           # Div with direct child img
"form:has(input[required])"  # Form with required input
```

### :nth-match() - Nth occurrence

```bash
":nth-match(button, 2)"    # Second button on page
":nth-match(.item, 3)"     # Third .item element
```

## Selector Best Practices

1. **Prefer role selectors** for accessibility testing
2. **Use text selectors** for user-visible content
3. **Use CSS for structure** (IDs, classes, attributes)
4. **Avoid XPath** unless necessary (slower, harder to read)
5. **Use data-testid** attributes for testing: `[data-testid="submit-btn"]`

## Debugging Selectors

Use `snapshot` command to see the accessibility tree:

```bash
curl -s localhost:3210 -d '{"cmd":"snapshot"}'
```

This shows:
- Element types and roles
- Accessible names
- Structure and hierarchy

Use this output to construct appropriate selectors.
