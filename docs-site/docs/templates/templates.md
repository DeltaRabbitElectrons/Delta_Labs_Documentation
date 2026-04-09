---
title: Untitled
sidebar_label: Untitled
---

# Delta Labs - Code Templates & Examples

> **Quick Reference Guide for Developers**  
> **Version**: 1.0.0

This document provides ready-to-use templates and real examples from the Delta Labs codebase.

---

## 📦 Table of Contents

1. [Component Templates](#component-templates)
2. [Context Templates](#context-templates)
3. [Hook Templates](#hook-templates)
4. [Type Definition Templates](#type-definition-templates)
5. [Routing Templates](#routing-templates)
6. [Module Structure Template](#module-structure-template)

---

## 1. Component Templates

### 1.1 Basic Component Template

```typescript
/**
 * [ComponentName]
 * [Brief description]
 */

import React from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface [ComponentName]Props {
  title: string;
  description?: string;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const [ComponentName]: React.FC<[ComponentName]Props> = ({
  title,
  description,
  onClick,
  className = '',
}) => {
  return (
    <div className={`component-base ${className}`}>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {onClick && <button onClick={onClick}>Action</button>}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default [ComponentName];
```

### 1.2 Component with Variants (Real Example from Button.tsx)

```typescript
/**
 * Delta Labs Button Component
 * Reusable, theme-aware button with variants
 */

import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  children, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses: Record<string, string> = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-secondary-500 text-primary-500 hover:bg-secondary-600',
    outline: 'border border-primary-500 text-primary-500 hover:bg-primary-50',
    ghost: 'text-primary-500 hover:bg-primary-50',
    danger: 'bg-error-500 text-white hover:bg-error-600',
  };
  
  const sizeClasses: Record<string, string> = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    xl: 'h-14 px-8 text-lg',
  };
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    loading && 'opacity-50 cursor-not-allowed',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};
```

### 1.3 Component Index File Template

```typescript
/**
 * [ComponentName] - Exports
 */

export { [ComponentName] } from './[ComponentName]';
export type { [ComponentName]Props } from './[ComponentName]';
export default from './[ComponentName]';
```

---

## 2. Context Templates

### 2.1 Full Context Template with Reducer

```typescript
/**
 * [Module] Context
 * [Description of what this context manages]
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { [State], [ContextValue] } from '../types';

// ============================================================================
// ACTIONS
// ============================================================================

type [Module]Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA'; payload: DataType[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_ITEM'; payload: DataType }
  | { type: 'UPDATE_ITEM'; payload: { id: string; data: Partial<DataType> } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_ERROR' };

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
    
    case 'ADD_ITEM':
      return { ...state, data: [...state.data, action.payload] };
    
    case 'UPDATE_ITEM':
      return {
        ...state,
        data: state.data.map(item =>
          item.id === action.payload.id
            ? { ...item, ...action.payload.data }
            : item
        ),
      };
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        data: state.data.filter(item => item.id !== action.payload),
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
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
  // FETCH METHODS
  // ============================================================================

  const fetchData = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // TODO: Replace with actual API call
      const response = await api.fetchData();
      dispatch({ type: 'SET_DATA', payload: response.data });
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ============================================================================
  // CRUD METHODS
  // ============================================================================

  const addItem = async (data: DataType): Promise<void> => {
    try {
      const response = await api.addItem(data);
      dispatch({ type: 'ADD_ITEM', payload: response.data });
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const updateItem = async (id: string, data: Partial<DataType>): Promise<void> => {
    try {
      await api.updateItem(id, data);
      dispatch({ type: 'UPDATE_ITEM', payload: { id, data } });
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const removeItem = async (id: string): Promise<void> => {
    try {
      await api.removeItem(id);
      dispatch({ type: 'REMOVE_ITEM', payload: id });
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    fetchData();
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: [ContextValue] = {
    ...state,
    fetchData,
    addItem,
    updateItem,
    removeItem,
    clearError,
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

---

## 3. Hook Templates

### 3.1 Basic Hook Template

```typescript
/**
 * use[Feature]
 * [Description of what this hook does]
 */

import { useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface Use[Feature]Options {
  initialValue?: any;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface Use[Feature]Return {
  data: any;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function use[Feature](options?: Use[Feature]Options): Use[Feature]Return {
  const [data, setData] = useState(options?.initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch logic here
      const result = await someAsyncOperation();
      setData(result);
      options?.onSuccess?.(result);
    } catch (err) {
      const error = err as Error;
      setError(error);
      options?.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
```

### 3.2 Simple Toggle Hook

```typescript
/**
 * useToggle
 * Simple boolean toggle hook
 */

import { useState, useCallback } from 'react';

export function useToggle(initialValue = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);
  
  const toggle = useCallback(() => {
    setValue(v => !v);
  }, []);
  
  return [value, toggle, setValue];
}

// Usage:
// const [isOpen, toggleOpen, setIsOpen] = useToggle(false);
```

### 3.3 Local Storage Hook

```typescript
/**
 * useLocalStorage
 * Persist state in localStorage
 */

import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}
```

---

## 4. Type Definition Templates

### 4.1 Module Types Template

```typescript
/**
 * [Module Name] - TypeScript Definitions
 * [Description]
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export interface [Entity] {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// UNION TYPES
// ============================================================================

export type [Entity]Status = 
  | 'Active' 
  | 'Inactive' 
  | 'Pending' 
  | 'Archived';

export type [Entity]Category = 
  | 'CategoryA' 
  | 'CategoryB' 
  | 'CategoryC';

// ============================================================================
// STATE TYPES
// ============================================================================

export interface [Module]State {
  items: [Entity][];
  selectedItem: [Entity] | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status: [Entity]Status | null;
    category: [Entity]Category | null;
    searchQuery: string;
  };
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface [Module]ContextValue extends [Module]State {
  // Fetch methods
  fetchItems: () => Promise<void>;
  fetchItemById: (id: string) => Promise<void>;
  
  // CRUD methods
  createItem: (data: Partial<[Entity]>) => Promise<void>;
  updateItem: (id: string, data: Partial<[Entity]>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  
  // Filter methods
  setStatusFilter: (status: [Entity]Status | null) => void;
  setCategoryFilter: (category: [Entity]Category | null) => void;
  setSearchQuery: (query: string) => void;
  
  // Utility methods
  selectItem: (item: [Entity] | null) => void;
  clearError: () => void;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface [Entity]ListResponse {
  items: [Entity][];
  total: number;
  page: number;
  limit: number;
}

export interface [Entity]Response {
  item: [Entity];
  message: string;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface [Entity]CardProps {
  item: [Entity];
  onEdit?: (item: [Entity]) => void;
  onDelete?: (id: string) => void;
  onClick?: (item: [Entity]) => void;
}

// ============================================================================
// EXPORTS (for backward compatibility)
// ============================================================================

export type {
  [Entity] as [Entity]Type,
};
```

---

## 5. Routing Templates

### 5.1 Route Definition Template

```typescript
/**
 * [Module] Routes
 * Route definitions for [Module] module
 */

import type { [Module]Route } from '../types/routeTypes';

// Lazy-loaded components
const DashboardPage = React.lazy(() => import('../views/DashboardPage'));
const DetailPage = React.lazy(() => import('../views/DetailPage'));
const ListPage = React.lazy(() => import('../views/ListPage'));

export const [module]Routes: [Module]Route[] = [
  {
    path: '/dashboard',
    component: DashboardPage,
    exact: true,
    guards: [],
  },
  {
    path: '/list',
    component: ListPage,
    exact: true,
    guards: ['auth'],
  },
  {
    path: '/detail/:id',
    component: DetailPage,
    exact: true,
    guards: ['auth'],
  },
];
```

### 5.2 Route Types Template

```typescript
/**
 * Route Types
 */

export interface [Module]Route {
  path: string;
  component: React.ComponentType<any>;
  exact?: boolean;
  guards?: string[];
  children?: [Module]Route[];
  meta?: {
    title?: string;
    description?: string;
    requiresAuth?: boolean;
  };
}

export interface RouteParams {
  [key: string]: string;
}

export interface NavigationState {
  currentRoute: [Module]Route | null;
  params: RouteParams;
  history: string[];
}
```

### 5.3 Navigation Hook Template

```typescript
/**
 * use[Module]Navigation
 * Navigation hook for [Module] module
 */

import { useState, useCallback } from 'react';
import type { [Module]Route, RouteParams } from '../types/routeTypes';

export function use[Module]Navigation() {
  const [currentRoute, setCurrentRoute] = useState<[Module]Route | null>(null);
  const [params, setParams] = useState<RouteParams>({});

  const navigate = useCallback((path: string, routeParams?: RouteParams) => {
    // Navigation logic
    setParams(routeParams || {});
  }, []);

  const goBack = useCallback(() => {
    // Go back logic
  }, []);

  return {
    currentRoute,
    params,
    navigate,
    goBack,
  };
}
```

---

## 6. Module Structure Template

### 6.1 Complete Module Folder Structure

```
src/modules/[ModuleName]/
├── views/
│   ├── [Component1]/
│   │   ├── [Component1].tsx
│   │   ├── index.ts
│   │   └── README.md
│   └── index.ts
├── context/
│   ├── [Module]Context.tsx
│   └── index.ts
├── features/
│   ├── [feature1]/
│   │   ├── views/
│   │   ├── hooks/
│   │   └── index.ts
│   └── [feature2]/
│       ├── views/
│       ├── hooks/
│       └── index.ts
├── routing/
│   ├── guards/
│   │   └── RouteGuard.tsx
│   ├── hooks/
│   │   └── use[Module]Navigation.ts
│   ├── routes/
│   │   └── [module]Routes.ts
│   ├── types/
│   │   └── routeTypes.ts
│   ├── [Module]Router.tsx
│   └── index.ts
├── types/
│   ├── index.ts
│   └── [specific].ts
├── utils/
│   ├── validation.ts
│   ├── formatters.ts
│   └── index.ts
└── index.ts
```

### 6.2 Module Index File Template

```typescript
/**
 * [Module Name] - Main Index
 * [Description of module purpose]
 */

// ============================================================================
// CONTEXT EXPORTS
// ============================================================================

export { [Module]Provider, use[Module] } from './context/[Module]Context';

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

export { default as [Module]Page } from './views/[Module]Page';
export { default as [Module]Layout } from './views/[Module]Layout';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  [Entity],
  [Entity]Status,
  [Entity]Category,
  [Module]State,
  [Module]ContextValue,
} from './types';

// ============================================================================
// UTILS EXPORTS
// ============================================================================

export * from './utils';

// ============================================================================
// ROUTING EXPORTS
// ============================================================================

export { default as [Module]Router } from './routing/[Module]Router';
export { use[Module]Navigation } from './routing/hooks/use[Module]Navigation';
```

---

## 📌 Usage Examples

### Creating a New Component

1. Create folder: `src/components/theme/MyComponent/`
2. Create `MyComponent.tsx` using template
3. Create `index.ts` with exports
4. Add to `src/components/theme/index.ts`

### Creating a New Module

1. Create folder: `src/modules/MyModule/`
2. Follow module structure template
3. Create context using context template
4. Create types using type template
5. Create index.ts using module index template
6. Export from `src/index.ts`

### Creating a New Hook

1. Create file: `src/hooks/useMyFeature.ts`
2. Use hook template
3. Export from appropriate index.ts

---

**Last Updated**: 2026-01-21  
**Maintained By**: Delta Labs Development Team
