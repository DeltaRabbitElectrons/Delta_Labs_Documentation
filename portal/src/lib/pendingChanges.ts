// src/lib/pendingChanges.ts

export interface PendingChange {
  type: string;
  saveFn: () => Promise<void>;
}

class PendingChangesStore {
  private changes: Map<string, PendingChange & { namespace?: string }> = new Map();
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    listener();
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  registerChange(type: string, id: string, saveFn: () => Promise<void>, namespace?: string) {
    const key = namespace ? `${namespace}:${type}:${id}` : `${type}:${id}`;
    this.changes.set(key, { type, saveFn, namespace });
    this.notify();
  }

  removeChange(type: string, id: string, namespace?: string) {
    const key = namespace ? `${namespace}:${type}:${id}` : `${type}:${id}`;
    if (this.changes.delete(key)) {
      this.notify();
    }
  }

  removeByNamespace(namespace: string) {
    let deleted = false;
    for (const [key, value] of this.changes.entries()) {
      if (value.namespace === namespace) {
        this.changes.delete(key);
        deleted = true;
      }
    }
    if (deleted) this.notify();
  }

  async flushAll() {
    const allChanges = Array.from(this.changes.values());
    for (const change of allChanges) {
      await change.saveFn();
    }
    this.changes.clear();
    this.notify();
  }

  getAll(): PendingChange[] {
    return Array.from(this.changes.values());
  }

  hasPendingChanges(): boolean {
    return this.changes.size > 0;
  }

  getPendingCount(): number {
    return this.changes.size;
  }

  clearChanges() {
    this.changes.clear();
    this.notify();
  }
  
  hasChanges(): boolean {
    return this.hasPendingChanges();
  }
  
  getCount(): number {
    return this.getPendingCount();
  }

  clear() {
    this.clearChanges();
  }
}

// Singleton — shared across all components
export const pendingChanges = new PendingChangesStore();
