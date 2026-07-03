import { useCallback, useState } from "react";
import type { Instance } from "./types";

const INSTANCES_KEY = "lta.instances.v1";
const SELECTED_KEY = "lta.selectedInstance.v1";

function loadInstances(): Instance[] {
  try {
    const raw = localStorage.getItem(INSTANCES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Instance[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveInstances(instances: Instance[]): void {
  localStorage.setItem(INSTANCES_KEY, JSON.stringify(instances));
}

export function useInstances(): {
  instances: Instance[];
  selectedId: string | null;
  select: (id: string | null) => void;
  add: (name: string, baseUrl: string) => Instance;
  remove: (id: string) => void;
} {
  const [instances, setInstances] = useState<Instance[]>(loadInstances);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => localStorage.getItem(SELECTED_KEY) || null,
  );

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) localStorage.setItem(SELECTED_KEY, id);
    else localStorage.removeItem(SELECTED_KEY);
  }, []);

  const add = useCallback((name: string, baseUrl: string): Instance => {
    const instance: Instance = {
      id: crypto.randomUUID().slice(0, 8),
      name: name.trim(),
      baseUrl: baseUrl.trim().replace(/\/+$/, ""),
    };
    setInstances((prev) => {
      const next = [...prev, instance];
      saveInstances(next);
      return next;
    });
    return instance;
  }, []);

  const remove = useCallback((id: string) => {
    setInstances((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveInstances(next);
      return next;
    });
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  return { instances, selectedId, select, add, remove };
}
