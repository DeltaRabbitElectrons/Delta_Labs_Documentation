---
title: Design Principles
sidebar_label: Design Principles
---

# Design System & Component Library — Core Principles

> **Version**: 1.0.0  
> **Status**: Official Company Standard  
> **Critical**: This document defines the SINGLE SOURCE OF TRUTH for all UI components

---

## 🎯 Core Philosophy

### The Golden Rule

> **ALL components MUST be designed, documented, and implemented in the component library FIRST before being used in any feature or module.**

**No exceptions**. This ensures:
- ✅ Consistency across the entire application
- ✅ Reusability and maintainability
- ✅ Single source of truth for all UI patterns
- ✅ Easier refactoring and updates
- ✅ Better collaboration between designers and developers

---

## Atomic Design Principles

Delta Labs follows **Atomic Design** methodology with 5 levels:

### Component Hierarchy

| Level | Description | Examples | Can Contain |
|-------|-------------|----------|-------------|
| **Atoms** | Basic HTML elements styled | Button, Input, Icon, Text | Only HTML elements |
| **Molecules** | Simple component groups | SearchBar, FormField, Card | Atoms + HTML |
| **Organisms** | Complex, standalone sections | Header, Sidebar, Table, Modal | Molecules + Atoms |
| **Templates** | Page-level layouts | DashboardLayout, ContentLayout | Organisms + Molecules |
| **Pages** | Specific instances | Dashboard, CourseDetail | Templates + data |

### Composition Rules

**✅ CORRECT**: Molecules use Atoms; Organisms use Molecules and Atoms; Templates use Organisms.

**❌ INCORRECT**: Atoms using Molecules; skipping levels (e.g. Template using only Atoms).

---

## 📖 See Also

- [Design Tokens](./design-tokens) — colors, typography, spacing.
- [Component Catalog](./components/component-catalog) — document every component here.
- [API Standards](./api-standards) — REST and frontend integration.