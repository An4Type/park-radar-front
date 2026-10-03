import type { StateStorage } from 'zustand/middleware';

function memoryStorage(): StateStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

export function safeStorage(): StateStorage {
  try {
    const storage = globalThis.localStorage;
    const probe = '__pr_probe__';
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch {
    return memoryStorage();
  }
}
