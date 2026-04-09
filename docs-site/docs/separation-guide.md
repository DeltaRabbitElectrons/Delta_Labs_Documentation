---
title: Separation Guide
sidebar_label: Separation Guide
---

<!-- # Design System vs Coding Standards - Clear Separation -->

> **Quick Reference**: What goes where

---

## 🎨 Design System (UI/UX Focus)

**Location**: `docs/design-system/`

### What It Covers

✅ **Component Structure**
- Atomic design levels (Atom, Molecule, Organism, Template)
- Component hierarchy and composition
- Which components can contain which

✅ **Visual Patterns**
- Layout templates (Dashboard, Canvas, Split)
- Navigation patterns (Header, Sidebar, TabBar)
- UI components (Button, Card, Modal, Table)

✅ **Variant Definitions**
- Visual variants (primary, secondary, outline)
- Size variants (xs, sm, md, lg, xl)
- State variants (hover, active, disabled)

✅ **Component Organization**
- Folder structure for components
- Required files (Component, Types, Variants, README)
- Component documentation format

✅ **Usage Guidelines**
- When to use which component
- How to combine components
- Variant selection guide

### What It Does NOT Cover

❌ Variable naming (camelCase, PascalCase)  
❌ TypeScript syntax rules  
❌ Import/export conventions  
❌ File naming conventions  
❌ Code formatting rules  
❌ Error handling patterns  
❌ State management implementation

---

## 💻 Coding Standards (Code Quality Focus)

**Location**: `docs/coding-standards/`

### What It Covers

✅ **Naming Conventions**
- File naming (PascalCase, camelCase, kebab-case)
- Variable naming
- Function naming
- Event handler naming

✅ **TypeScript Standards**
- Type vs Interface usage
- Generic types
- Type assertions
- Type definitions location

✅ **Code Organization**
- File structure
- Import order
- Export patterns
- Module organization

✅ **React Patterns**
- Component implementation (not structure)
- Hook patterns
- Props destructuring
- Event handlers

✅ **State Management**
- Context implementation
- Reducer patterns
- Action naming
- State updates

✅ **Code Quality**
- Error handling
- Documentation comments
- Code formatting
- Best practices

### What It Does NOT Cover

❌ Component visual design  
❌ Layout patterns  
❌ UI composition rules  
❌ Variant definitions  
❌ When to use which component  
❌ Component folder structure  
❌ Design patterns

---

## 📊 Comparison Table

| Aspect | Design System | Coding Standards |
|--------|---------------|------------------|
| **Focus** | What to build | How to write code |
| **Audience** | Designers + Developers | Developers only |
| **Content** | UI patterns, layouts | Code conventions |
| **Examples** | "Use DashboardLayout for admin pages" | "Use camelCase for variables" |
| **Decisions** | Visual and structural | Technical and syntactic |

---

## 🎯 Example Scenarios

### Scenario 1: Creating a Button

**Design System Answers**:
- What variants exist? (primary, secondary, outline)
- What sizes? (sm, md, lg)
- What states? (hover, active, disabled)
- Where is it located? (`components/atoms/Button`)
- What files are needed? (Button.tsx, types.ts, variants.ts)

**Coding Standards Answers**:
- How to name the file? (Button.tsx - PascalCase)
- How to name props? (ButtonProps interface)
- How to structure imports? (React first, then types)
- How to handle errors? (try-catch pattern)
- How to document? (JSDoc comments)

### Scenario 2: Creating a Dashboard Page

**Design System Answers**:
- Use DashboardLayout template
- Header + Sidebar + Content structure
- Which components to use (Header, Sidebar organisms)
- How to compose layout

**Coding Standards Answers**:
- File location (`modules/Dashboard/views/`)
- File naming (DashboardPage.tsx)
- Import organization
- Context usage pattern
- Error boundary implementation

### Scenario 3: Adding a New Variant

**Design System Answers**:
- Where to add? (variants.ts file)
- How to document? (README.md update)
- What to include? (CSS classes, examples)
- When to use? (Usage guidelines)

**Coding Standards Answers**:
- How to name the variant? (camelCase in code)
- Type definition syntax (union type)
- Export pattern
- Documentation format (JSDoc)

---

## ✅ Checklist: Which Document?

### Ask Yourself:

**"Is this about WHAT the UI looks like or HOW it's structured?"**
→ Design System

**"Is this about HOW to write the code?"**
→ Coding Standards

**"Do I need a ready-to-use template?"**
→ Templates

**"Do I need project overview?"**
→ Overview

---

## 🔗 Cross-References

### When Design System References Coding Standards

```markdown
<!-- In Design System -->
For implementation details, see [TypeScript Standards](/coding-standards/coding-standards#4-typescript-standards)
```

### When Coding Standards References Design System

```markdown
<!-- In Coding Standards -->
For component structure, see [Design System — Component Library](/design-system/design-system#2-component-library-structure)
```

---

## 📝 Summary

| Document | Purpose | Key Question |
|----------|---------|--------------|
| **Design System** | UI/UX standards | "What should it look like?" |
| **Coding Standards** | Code quality | "How should I write it?" |
| **Templates** | Quick start | "Give me boilerplate" |
| **Overview** | Understanding | "How does it all work?" |

---

**No Overlap**: Each document has a single, clear purpose.  
**Complete Coverage**: Together, they cover everything needed.  
**Easy Navigation**: Clear boundaries make finding information easy.

---

**Last Updated**: 2026-01-21  
**Maintained By**: Delta Labs Development Team
