---
title: Coding Standards
sidebar_label: Coding Standards
---

# Delta Labs - Coding Standards & Best Practices

> **Version**: 1.0.0  
> **Last Updated**: 2026-01-21  
> **Status**: Official Company Standard

---

## 📋 Table of Contents

1. [File & Folder Structure](#file--folder-structure)
2. [Naming Conventions](#naming-conventions)
3. [Component Architecture](#component-architecture)
4. [TypeScript Standards](#typescript-standards)
5. [Context & State Management](#context--state-management)
6. [Routing & Navigation](#routing--navigation)
7. [Custom Hooks](#custom-hooks)
8. [Styling Standards](#styling-standards)
9. [Import/Export Standards](#importexport-standards)
10. [Documentation Standards](#documentation-standards)
11. [Error Handling](#error-handling)
12. [Code Organization](#code-organization)
13. [Quick Reference](#quick-reference)

---

## 1. File & Folder Structure

### 1.1 Module Organization

**Standard Structure**:
```
src/
├── modules/
│   └── [ModuleName]/
│       ├── views/               # Module-specific views (composed of library components)
│       ├── context/             # Context providers
│       ├── features/            # Feature-based sub-modules
│       ├── routing/             # Routing configuration
│       │   ├── guards/         # Route guards
│       │   ├── hooks/          # Navigation hooks
│       │   ├── routes/         # Route definitions
│       │   └── types/          # Routing types
│       ├── types/               # TypeScript definitions
│       ├── utils/               # Utility functions
│       └── index.ts             # Public API exports
```

### 1.2 Component Folder Structure

**✅ CORRECT**:
```
components/
└── theme/
    └── Button/
        ├── Button.tsx           # Main component
        ├── Button.types.ts      # Type definitions (optional)
        ├── index.ts             # Re-export
        └── README.md            # Component documentation (optional)
```

**❌ INCORRECT**:
```
components/
├── button.tsx                   # Wrong: not in folder
├── Button.js                    # Wrong: not TypeScript
└── MyButton/
    └── component.tsx            # Wrong: unclear naming
```

### 1.3 Feature-Based Organization

For complex modules, use feature-based organization:

```
features/
├── dashboard/
│   ├── components/
│   ├── hooks/
│   └── index.ts
├── enrolled-course-detail/
│   ├── features/                # Nested features
│   │   ├── exercise/
│   │   ├── qa/
│   │   └── resources/
│   ├── components/
│   └── EnrolledCourseDetailLayout.tsx
```

**Rule**: If a feature has >20 files, consider breaking it into sub-features.

---

## 2. Naming Conventions

### 2.1 Files & Folders

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase | `Button.tsx`, `UserProfile.tsx` |
| **Contexts** | PascalCase + Context suffix | `ThemeContext.tsx`, `AuthContext.tsx` |
| **Hooks** | camelCase + use prefix | `useAuth.ts`, `useCourseNavigation.ts` |
| **Utils** | camelCase | `validation.ts`, `formatters.ts` |
| **Types** | camelCase or PascalCase | `types.ts`, `CourseTypes.ts` |
| **Constants** | camelCase | `constants.ts`, `apiEndpoints.ts` |
| **Folders** | kebab-case | `enrolled-courses/`, `user-profile/` |

### 2.2 Variables & Functions

```typescript
// ✅ CORRECT
const userName = 'John';                    // camelCase for variables
const MAX_RETRY_COUNT = 3;                  // UPPER_SNAKE_CASE for constants
function fetchUserData() {}                 // camelCase for functions
const handleButtonClick = () => {};         // camelCase for handlers

// ❌ INCORRECT
const UserName = 'John';                    // Wrong: not PascalCase context
const max_retry_count = 3;                  // Wrong: not UPPER_SNAKE_CASE
function FetchUserData() {}                 // Wrong: not camelCase
```

### 2.3 Components & Types

```typescript
// ✅ CORRECT
interface ButtonProps {}                   // PascalCase + Props suffix
type CourseCategory = 'Physics' | 'Math';  // PascalCase for types
const Button: React.FC<ButtonProps> = () => {};  // PascalCase for components

// ❌ INCORRECT
interface buttonProps {}                   // Wrong: not PascalCase
type course_category = string;             // Wrong: not PascalCase
const button = () => {};                   // Wrong: not PascalCase
```

### 2.4 Event Handlers

**Standard Pattern**: `handle[Action]` or `on[Action]`

```typescript
// ✅ CORRECT
const handleClick = () => {};
const handleSubmit = () => {};
const onUserLogin = () => {};
const onCourseEnroll = () => {};

// ❌ INCORRECT
const click = () => {};                    // Wrong: unclear
const doSubmit = () => {};                 // Wrong: not standard
const userLogin = () => {};                // Wrong: missing prefix
```

---

## 3. Component Architecture

### 3.1 Component File Structure

**Standard Template**:

```typescript
/**
 * [Component Name]
 * [Brief description of component purpose]
 */

import React from 'react';
import type { [Types] } from './types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface [Component]Props {
  // Props definition
}

// ============================================================================
// COMPONENT
// ============================================================================

export const [Component]: React.FC<[Component]Props> = ({
  prop1,
  prop2,
  ...props
}) => {
  // Component logic
  
  return (
    // JSX
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default [Component];
```

### 3.2 Props Interface Standards

**✅ CORRECT**:

```typescript
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  children: React.ReactNode;
}
```

**Rules**:
1. Always export props interfaces
2. Use `?` for optional props
3. Provide default values in destructuring
4. Extend HTML element props when applicable
5. Use union types for variants

### 3.3 Component Patterns

#### Pattern 1: Functional Component with Props

```typescript
export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary',      // Default values
  size = 'md', 
  loading = false, 
  children, 
  className = '', 
  disabled,
  ...props                  // Rest props
}) => {
  // Logic here
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}            // Spread remaining props
    >
      {children}
    </button>
  );
};
```

#### Pattern 2: Component with Variants

```typescript
const variantClasses: Record<string, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-secondary-500 text-primary-500 hover:bg-secondary-600',
  outline: 'border border-primary-500 text-primary-500 hover:bg-primary-50',
};

const sizeClasses: Record<string, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};
```

**Rule**: Use `Record<string, string>` for variant mappings.

---

## 4. TypeScript Standards

### 4.1 Type Definitions

**Location**: Create dedicated `types/` folder or `types.ts` file

```typescript
// ============================================================================
// CORE TYPES
// ============================================================================

export interface Course {
  id: string;
  title: string;
  description: string;
  // ... more fields
}

// ============================================================================
// UNION TYPES
// ============================================================================

export type CourseCategory = 
  | 'Physics' 
  | 'Chemistry' 
  | 'Mathematics' 
  | 'Biology';

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

// ============================================================================
// STATE TYPES
// ============================================================================

export interface CourseState {
  enrolledCourses: Enrollment[];
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface CourseContextValue extends CourseState {
  fetchCourses: () => Promise<void>;
  enrollInCourse: (courseId: string) => Promise<void>;
}

// ============================================================================
// EXPORTS (for backward compatibility)
// ============================================================================

export type {
  Course as CourseType,
  Enrollment as EnrollmentType,
};
```

### 4.2 Type vs Interface

**Use `interface` for**:
- Object shapes
- Component props
- Extendable types

**Use `type` for**:
- Union types
- Intersection types
- Mapped types
- Type aliases

```typescript
// ✅ CORRECT
interface ButtonProps {
  variant: 'primary' | 'secondary';
}

type CourseCategory = 'Physics' | 'Math';
type Status = 'loading' | 'success' | 'error';

// ❌ INCORRECT
type ButtonProps = {                       // Should use interface
  variant: 'primary' | 'secondary';
}

interface CourseCategory {                 // Should use type
  value: 'Physics' | 'Math';
}
```

### 4.3 Generic Types

```typescript
// ✅ CORRECT
type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
};

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
}

// Usage
const response: ApiResponse<Course> = await fetchCourse();
```

### 4.4 Type Assertions

```typescript
// ✅ CORRECT
const element = document.getElementById('root') as HTMLElement;
const data = JSON.parse(str) as UserData;

// ❌ INCORRECT
const element = <HTMLElement>document.getElementById('root');  // Wrong: JSX conflict
```

---

## 5. Context & State Management

### 5.1 Context File Structure

**Standard Template**:

```typescript
/**
 * [Module] Context
 * [Description of context purpose]
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { [State], [ContextValue] } from '../types';

// ============================================================================
// ACTIONS
// ============================================================================

type [Module]Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA'; payload: DataType[] }
  | { type: 'SET_ERROR'; payload: string | null };

// ============================================================================
// REDUCER
// ============================================================================

const [module]Reducer = (state: [State], action: [Module]Action): [State] => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_DATA':
      return { ...state, data: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: [State] = {
  data: [],
  isLoading: false,
  error: null,
};

// ============================================================================
// CONTEXT
// ============================================================================

const [Module]Context = createContext<[ContextValue] | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface [Module]ProviderProps {
  children: ReactNode;
}

export function [Module]Provider({ children }: [Module]ProviderProps) {
  const [state, dispatch] = useReducer([module]Reducer, initialState);

  // Methods
  const fetchData = async (): Promise<void> => {
    // Implementation
  };

  const contextValue: [ContextValue] = {
    ...state,
    fetchData,
  };

  return (
    <[Module]Context.Provider value={contextValue}>
      {children}
    </[Module]Context.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function use[Module](): [ContextValue] {
  const context = useContext([Module]Context);
  
  if (context === undefined) {
    throw new Error('use[Module] must be used within a [Module]Provider');
  }
  
  return context;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default [Module]Context;
```

### 5.2 Action Naming

**Pattern**: `[VERB]_[NOUN]` in UPPER_SNAKE_CASE

```typescript
// ✅ CORRECT
type CourseAction =
  | { type: 'SET_LOADING_COURSES'; payload: boolean }
  | { type: 'SET_ENROLLED_COURSES'; payload: Enrollment[] }
  | { type: 'ADD_ENROLLMENT'; payload: Enrollment }
  | { type: 'UPDATE_ENROLLMENT'; payload: { id: string; data: Partial<Enrollment> } }
  | { type: 'REMOVE_WISHLIST_ITEM'; payload: string }
  | { type: 'CLEAR_ERROR' };

// ❌ INCORRECT
type CourseAction =
  | { type: 'loading'; payload: boolean }           // Wrong: not descriptive
  | { type: 'courses'; payload: Enrollment[] }      // Wrong: not action
  | { type: 'addEnrollment'; payload: Enrollment }  // Wrong: not UPPER_SNAKE_CASE
```

### 5.3 Context Value Pattern

```typescript
// ✅ CORRECT
export interface CourseContextValue extends CourseState {
  // Async methods return Promise<void>
  fetchEnrolledCourses: () => Promise<void>;
  enrollInCourse: (courseId: string) => Promise<void>;
  
  // Sync methods return void
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: CourseCategory | null) => void;
  clearError: () => void;
}
```

---

## 6. Routing & Navigation

### 6.1 Route Definition

**File**: `routing/routes/[module]Routes.ts`

```typescript
import type { CourseRoute } from '../types/routeTypes';

export const courseRoutes: CourseRoute[] = [
  {
    path: '/dashboard',
    component: DashboardPage,
    exact: true,
    guards: [],
  },
  {
    path: '/courses/:courseId',
    component: CourseDetailPage,
    exact: true,
    guards: ['auth'],
  },
  {
    path: '/courses/:courseId/lesson/:lessonId',
    component: LessonPage,
    exact: true,
    guards: ['auth', 'enrollment'],
  },
];
```

### 6.2 Route Types

```typescript
export interface CourseRoute {
  path: string;
  component: React.ComponentType<any>;
  exact?: boolean;
  guards?: string[];
  children?: CourseRoute[];
}

export interface RouteParams {
  [key: string]: string;
}
```

### 6.3 Navigation Hook

```typescript
export function useCourseNavigation() {
  const navigate = (path: string, params?: RouteParams) => {
    // Implementation
  };

  const goBack = () => {
    // Implementation
  };

  return {
    navigate,
    goBack,
    currentRoute,
    params,
  };
}
```

---

## 7. Custom Hooks

### 7.1 Hook File Structure

```typescript
/**
 * [Hook Name]
 * [Description]
 */

import { useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface Use[Feature]Options {
  // Options
}

interface Use[Feature]Return {
  // Return value
}

// ============================================================================
// HOOK
// ============================================================================

export function use[Feature](options?: Use[Feature]Options): Use[Feature]Return {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  return {
    // Return values
  };
}
```

### 7.2 Hook Naming

**Pattern**: `use[Feature]` or `use[Module][Feature]`

```typescript
// ✅ CORRECT
export function useAuth() {}
export function useCourse() {}
export function useCourseNavigation() {}
export function useFormValidation() {}
export function useLocalStorage() {}

// ❌ INCORRECT
export function getAuth() {}              // Wrong: not use prefix
export function authHook() {}             // Wrong: not use prefix
export function useAuthenticationSystem() {}  // Wrong: too verbose
```

### 7.3 Hook Return Pattern

```typescript
// ✅ CORRECT - Return object for multiple values
export function useAuth() {
  return {
    user,
    isAuthenticated,
    login,
    logout,
    isLoading,
  };
}

// ✅ CORRECT - Return array for simple values
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = () => setValue(v => !v);
  return [value, toggle] as const;
}
```

---

## 8. Styling Standards

### 8.1 Tailwind CSS Usage

**✅ CORRECT**:

```typescript
// Use design tokens from tailwind.config.js
<button className="bg-primary-600 text-white hover:bg-primary-700 rounded-lg px-4 py-2">
  Click Me
</button>

// Conditional classes
const classes = [
  'base-class',
  variant === 'primary' && 'bg-primary-600',
  size === 'lg' && 'h-12 px-6',
  isLoading && 'opacity-50 cursor-not-allowed',
  className,
].filter(Boolean).join(' ');
```

**❌ INCORRECT**:

```typescript
// Don't use arbitrary values when tokens exist
<button className="bg-[#174A5F]">  // Wrong: use bg-primary-600

// Don't use inline styles
<button style={{ backgroundColor: '#174A5F' }}>  // Wrong: use Tailwind
```

### 8.2 Class Organization

**Order**: Layout → Spacing → Typography → Colors → Effects

```typescript
// ✅ CORRECT
className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"

// ❌ INCORRECT (random order)
className="text-white px-4 flex bg-primary-600 rounded-lg py-2 items-center"
```

### 8.3 Design Token Usage

**Always use design tokens**:

```typescript
// ✅ CORRECT
bg-primary-{50-900}      // Primary colors
bg-secondary-{50-900}    // Secondary colors
bg-success-{50-900}      // Success colors
text-primary             // Text colors
border-primary           // Border colors
shadow-md                // Shadows
rounded-lg               // Border radius
```

---

## 9. Import/Export Standards

### 9.1 Import Order

**Standard Order**:

```typescript
// 1. React & React-related
import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// 2. External libraries
import { someLibrary } from 'external-package';

// 3. Internal modules (absolute imports)
import { Button } from '@/components/theme';
import { useCourse } from '@/modules/Course';

// 4. Relative imports - Components
import { FeatureCard } from './components/FeatureCard';

// 5. Relative imports - Hooks
import { useCourseNavigation } from './hooks/useCourseNavigation';

// 6. Relative imports - Utils
import { formatDate } from './utils/formatters';

// 7. Relative imports - Types
import type { CourseState, CourseAction } from './types';

// 8. Styles (if any)
import './styles.css';
```

### 9.2 Export Patterns

**Module Index File** (`index.ts`):

```typescript
/**
 * [Module Name] - Main Index
 * [Description]
 */

// ============================================================================
// CONTEXT EXPORTS
// ============================================================================

export { CourseProvider, useCourse } from './context/CourseContext';

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

export { default as CoursePage } from './components/CoursePage';
export { default as CourseLayout } from './components/CourseLayout';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  Course,
  CourseCategory,
  CourseLevel,
  Enrollment,
  CourseState,
} from './types';

// ============================================================================
// UTILS EXPORTS
// ============================================================================

export * from './utils';
```

### 9.3 Named vs Default Exports

**Use Named Exports for**:
- Components (preferred)
- Hooks
- Utilities
- Types

**Use Default Exports for**:
- Page components
- Route components
- Context objects

```typescript
// ✅ CORRECT
export const Button: React.FC<ButtonProps> = () => {};  // Named export
export default Button;                                   // Also provide default

// ✅ CORRECT
export function useAuth() {}                            // Named export only

// ❌ INCORRECT
export default () => {};                                // Anonymous default
```

---

## 10. Documentation Standards

### 10.1 File Header

**Every file must have a header**:

```typescript
/**
 * [Component/Module Name]
 * [Brief description of purpose and functionality]
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md">
 *   Click Me
 * </Button>
 * ```
 */
```

### 10.2 Section Separators

Use consistent section separators:

```typescript
// ============================================================================
// SECTION NAME
// ============================================================================
```

**Standard Sections**:
- TYPES & INTERFACES
- CONSTANTS
- COMPONENT / HOOK / CONTEXT
- HELPER FUNCTIONS
- EXPORTS

### 10.3 Function Documentation

```typescript
/**
 * Validates user email format
 * 
 * @param email - Email address to validate
 * @returns True if email is valid, false otherwise
 * 
 * @example
 * ```ts
 * const isValid = validateEmail('user@example.com');
 * ```
 */
export function validateEmail(email: string): boolean {
  // Implementation
}
```

### 10.4 Complex Logic Comments

```typescript
// ✅ CORRECT - Explain WHY, not WHAT
// Check if tab already exists to prevent duplicates
const existingTab = prevTabs.find(t => t.id === tab.id);

// ❌ INCORRECT - Obvious from code
// Find tab with matching id
const existingTab = prevTabs.find(t => t.id === tab.id);
```

---

## 11. Error Handling

### 11.1 Error Handling Pattern

```typescript
// ============================================================================
// API ERROR HANDLER
// ============================================================================

const handleApiError = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

// ============================================================================
// ASYNC METHOD WITH ERROR HANDLING
// ============================================================================

const fetchData = async (): Promise<void> => {
  dispatch({ type: 'SET_LOADING', payload: true });
  
  try {
    const response = await api.fetchData();
    dispatch({ type: 'SET_DATA', payload: response.data });
  } catch (error) {
    const errorMessage = handleApiError(error);
    dispatch({ type: 'SET_ERROR', payload: errorMessage });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false });
  }
};
```

### 11.2 Error Boundaries

```typescript
// TODO: Implement error boundaries for production
// See: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
```

---

## 12. Code Organization

### 12.1 Component Size

**Rules**:
- Keep components under 300 lines
- Extract complex logic into hooks
- Break large components into smaller ones
- Use composition over inheritance

### 12.2 Function Size

**Rules**:
- Keep functions under 50 lines
- One function = one responsibility
- Extract complex logic into helper functions

### 12.3 File Size

**Rules**:
- Keep files under 500 lines
- Split large files into multiple files
- Use barrel exports (index.ts) for organization

---

## 13. Quick Reference

### 13.1 Checklist for New Components

- [ ] File in correct folder structure
- [ ] PascalCase naming
- [ ] File header documentation
- [ ] Props interface exported
- [ ] Default props in destructuring
- [ ] TypeScript types for all props
- [ ] Section separators used
- [ ] Named export + default export
- [ ] Added to index.ts

### 13.2 Checklist for New Contexts

- [ ] File structure follows template
- [ ] Actions in UPPER_SNAKE_CASE
- [ ] Reducer with all action types
- [ ] Initial state defined
- [ ] Provider component created
- [ ] Hook with error checking
- [ ] Context value properly typed
- [ ] Exported from module index

### 13.3 Checklist for New Hooks

- [ ] Starts with `use` prefix
- [ ] camelCase naming
- [ ] Return type defined
- [ ] Options interface (if needed)
- [ ] Proper dependency arrays
- [ ] Documented with JSDoc

### 13.4 Common Patterns Quick Reference

```typescript
// Component
export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {};

// Hook
export function useFeature(): UseFeatureReturn {}

// Context
export function FeatureProvider({ children }: ProviderProps) {}
export function useFeature(): FeatureContextValue {}

// Types
export interface ComponentProps {}
export type UnionType = 'a' | 'b' | 'c';

// Constants
export const API_BASE_URL = 'https://api.example.com';
```

---

## 📌 Enforcement

### Code Review Checklist

All code must pass this checklist before merging:

1. ✅ Follows file/folder structure standards
2. ✅ Naming conventions followed
3. ✅ TypeScript types properly defined
4. ✅ Documentation headers present
5. ✅ Section separators used
6. ✅ Error handling implemented
7. ✅ No console.logs in production code
8. ✅ Imports properly organized
9. ✅ Design tokens used (no arbitrary values)
10. ✅ Component size under 300 lines

### Automated Checks (Future)

- ESLint rules for naming conventions
- Prettier for code formatting
- TypeScript strict mode
- Import order linting

---

## 🔄 Updates & Versioning

This document is a living standard. Updates will be versioned and communicated to the team.

**Change Request Process**:
1. Propose change with reasoning
2. Team discussion
3. Approval by tech lead
4. Update documentation
5. Communicate to team

---

**Document Owner**: Delta Labs Development Team  
**Contact**: [Your Contact Information]  
**Last Review**: 2026-01-21