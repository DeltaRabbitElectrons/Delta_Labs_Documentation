---
title: Ws:Explanation:Readmetheme
sidebar_label: Ws:Explanation:Readmetheme
id: readmetheme
---

````markdown
# src/components/theme/ — Design System Primitives

**Location:** `deltalabs-frontend/src/components/theme/`
**Type:** Base UI Component Library (Design System)

---

## Overview

These are the **atomic building blocks** of the entire UI. Every other component
in the application is built by composing these primitives. They are intentionally
simple, generic, and highly reusable.

They consume design tokens from `src/styles/design-tokens.css` so that a single
token change propagates to every primitive instantly.

---

## Button.tsx & buttonStyles.ts

The standard interactive button. Supports variants and sizes:

| Variant | Visual Use |
|---|---|
| `primary` | Main call-to-action (filled, brand colour) |
| `secondary` | Supporting action (outlined) |
| `ghost` | Low emphasis (transparent background) |
| `destructive` | Dangerous actions (red) |

`buttonStyles.ts` contains the CSS class logic (using `cn()`) shared between
`Button.tsx` and `ButtonLink.tsx`.

---

## ButtonLink.tsx

Identical to `Button` visually but renders as a Next.js `<Link>` so it navigates
without a full page reload. Use when a "button" is actually navigating somewhere.

---

## Input.tsx / Textarea.tsx / Select.tsx

Standard form controls with consistent styling.
- `Input` — single-line text.
- `Textarea` — multi-line text.
- `Select` — styled `<select>` dropdown.

All accept standard HTML attributes (`placeholder`, `disabled`, `required`, etc.)
plus an optional `error` prop that turns the border red.

---

## SearchInput.tsx

An `Input` with a search icon on the left and an optional clear (×) button on the
right. Emits `onChange` like a normal input and an `onClear` callback.

---

## Field.tsx

A **form field wrapper** that composes: label + control + helper text + error message.

```
[label]
[Input / Select / Textarea]
[helper text or error message]
```

Use `Field` around any form control to automatically get the label, accessibility
`htmlFor` linkage, and error display. Individual inputs don't handle labels themselves.

---

## Checkbox.tsx

A styled checkbox. Accepts a `label` prop to render its own label inline.
Built on the native `<input type="checkbox">` for accessibility.

---

## RadioGroup.tsx

A set of radio options. Takes an `options` array and a `value` / `onChange` pair.
Renders each option as a labelled radio button with consistent styling.

---

## Card.tsx

A surface container with a white/dark background, border, and subtle shadow.
Accepts optional `header`, `children`, and `footer` slots.
Used everywhere to group related content visually.

---

## Dialog.tsx

An accessible modal dialog. Features:
- **Backdrop** — clicking outside closes the dialog (optional).
- **Focus trap** — keyboard focus stays inside the dialog while open.
- **Escape key** closes the dialog.
- Accepts `isOpen`, `onClose`, `title`, and `children` props.

Built on top of the native `<dialog>` element or a custom accessible implementation.

---

## StatusBanner.tsx

An inline alert banner. Four semantic variants:

| Variant | Colour | Use |
|---|---|---|
| `success` | Green | Confirmation messages |
| `error` | Red | Error messages |
| `warning` | Amber | Cautionary messages |
| `info` | Blue | Neutral information |

---

## Table.tsx

A data table component with:
- `<TableHead>` — column headers.
- `<TableBody>` — rows of data.
- `<TableRow>` — one row.
- `<TableCell>` — one cell.

Handles responsive overflow scrolling automatically.

---

## Typography.tsx

Semantic heading and text components that pair the right HTML element with the right
design token styling:
- `<Heading level={1}>` → `<h1>` with `--font-size-3xl`.
- `<Body size="sm">` → `<p>` with `--font-size-sm`.

Prevents inconsistent ad-hoc font sizes scattered through components.

---

## utils.ts & utils.test.ts

`utils.ts` — small helper like `cn(...classes)` (merges CSS class names, filtering
out falsy values). Used throughout all theme components.

`utils.test.ts` — unit tests for `utils.ts` functions.

---

## index.ts

Re-exports all primitives for clean barrel imports:
```typescript
import { Button, Card, Dialog, Field, Input } from '@/components/theme';
```
````
