# clj-kondo Analysis Reference

## Analysis Options

```bash
clj-kondo --lint path --config '{
  :output {:format :json},
  :analysis {
    :var-definitions true,      # defn, def, defmacro, etc.
    :var-usages true,           # all var references
    :namespace-definitions true, # ns forms
    :namespace-usages true,     # require, use, import
    :locals true,               # let bindings, fn args
    :local-usages true,         # local var references
    :keywords true,             # keyword analysis
    :protocol-impls true        # protocol implementations
  }
}'
```

## Find Symbol Definition

```bash
# Search entire project
clj-kondo --lint src components bases \
  --config '{:output {:format :json}, :analysis {:var-definitions true}}' \
  | jq '(.analysis.var_definitions // [])[] | select(.name == "my-function")'

# Search with namespace filter
clj-kondo --lint src \
  --config '{:output {:format :json}, :analysis {:var-definitions true}}' \
  | jq '(.analysis.var_definitions // [])[] | select(.ns == "my.namespace" and .name == "my-function")'
```

## Find Symbol References

```bash
clj-kondo --lint src components bases \
  --config '{:output {:format :json}, :analysis {:var-usages true}}' \
  | jq '(.analysis.var_usages // [])[] | select(.name == "my-function")'
```

## Find References to Specific Namespace

```bash
clj-kondo --lint src \
  --config '{:output {:format :json}, :analysis {:var-usages true}}' \
  | jq '(.analysis.var_usages // [])[] | select(.to == "my.namespace")'
```

## Get Namespace Dependencies

```bash
clj-kondo --lint src \
  --config '{:output {:format :json}, :analysis {:namespace-usages true}}' \
  | jq '.analysis.namespace_usages'
```

## Full Analysis (All Symbol Types)

```bash
clj-kondo --lint path/to/file.clj \
  --config '{:output {:format :json},
             :analysis {:var-definitions true,
                       :var-usages true,
                       :namespace-definitions true,
                       :namespace-usages true}}'
```

## Output Formats

### JSON (for parsing)

```bash
clj-kondo --lint file.clj --config '{:output {:format :json}, :analysis {...}}'
```

### EDN (native Clojure)

```bash
clj-kondo --lint file.clj --config '{:output {:format :edn}, :analysis {...}}'
```

## var_definitions Fields

- `filename`, `row`, `col`, `end_row`, `end_col` - Location
- `ns` - Namespace
- `name` - Symbol name
- `defined_by` - Defining form (e.g., `clojure.core/defn`)
- `fixed_arities` - Set of fixed argument counts
- `doc` - Docstring (if present)
- `private` - Boolean for private vars

## var_usages Fields

- `from` - Namespace where usage occurs
- `to` - Namespace where symbol is defined
- `name` - Symbol name
- `arity` - Number of arguments in call
- `from_var` - Containing function/var
- `row`, `col` - Location of usage

## Common jq Patterns

### Get symbol names

```bash
| jq '[(.analysis.var_definitions // [])[] | .name]'
```

### Get symbol with location

```bash
| jq '(.analysis.var_definitions // [])[] | {name, row, filename}'
```

### Filter by defining form

```bash
| jq '(.analysis.var_definitions // [])[] | select(.defined_by == "clojure.core/defn")'
```

### Filter out private vars

```bash
| jq '(.analysis.var_definitions // [])[] | select(.private != true)'
```

## Performance Tips

1. **Scope your lint path** - `--lint src` is faster than `--lint .`
2. **Enable only needed analysis** - Don't request `:var-usages` if you only need definitions
3. **Use jq early filtering** - Filter large JSON streams efficiently
4. **Cache results** - clj-kondo maintains a `.clj-kondo/.cache` directory
