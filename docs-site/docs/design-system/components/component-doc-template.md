---
title: Component Doc Template
sidebar_label: Component Doc Template
---

# Component Doc Template

Use this structure when you add a new component to the catalog. Copy it into a new file like `button.md`, `modal.md`, `data-table.md`, and fill in the placeholders.

---

## Template

```markdown
---
title: [ComponentName]
sidebar_position: 10
---

# [ComponentName]

> **Level**: Atom | Molecule | Organism | Template  
> **Location**: `src/components/…` or `src/components/theme/…`

---

## Purpose

One or two sentences: what this component does and when to use it.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `propName` | `type` | `default` | Description |

---

## Variants

### Visual
- **variantName** — when to use, example.

### Size
- **sm** / **md** / **lg** — …

### State
- **disabled**, **loading**, **error** — …

---

## Examples

### Basic
\`\`\`tsx
<ComponentName prop="value">
  Content
</ComponentName>
\`\`\`

### With variant
\`\`\`tsx
<ComponentName variant="primary" size="md">
  Submit
</ComponentName>
\`\`\`

---

## Design Tokens

- **Colors**: e.g. `primary-600`, `text-primary`
- **Spacing**: e.g. `p-4`, `gap-2`
- **Typography**: e.g. `text-sm`, `font-medium`

(See [Design Tokens](../design-tokens) for the full set.)

---

## When to Use

- Use when…
- Avoid when…

---

## Related

- [Design System standards](../design-system)
- [Design Tokens](../design-tokens)
- Other related components: [OtherComponent](./other-component)
```

---

## Workflow

1. **Design & build** the component in Delta Labs (per [Design System](../design-system)).
2. **Create** `docs/design-system/components/<component-name>` using the template above.
3. **Add** a row to the [Component Catalog](./component-catalog) table so it appears in the index.