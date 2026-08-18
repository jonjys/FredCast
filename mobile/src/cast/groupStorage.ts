/** Shared group session — 6-digit room code, no Clerk / email. */

export const GROUP_STORAGE_KEY = 'fredcast_group_v3';

export type StoredGroup = {
  code: string;
  name: string;
  nickname: string;
  role: 'admin' | 'member';
  token: string;
  savedAt: number;
};

export function loadGroup(): StoredGroup | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(GROUP_STORAGE_KEY);
    if (!raw) return null;
    const g = JSON.parse(raw) as StoredGroup;
    if (!g?.code || Date.now() - g.savedAt > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(GROUP_STORAGE_KEY);
      return null;
    }
    return g;
  } catch {
    return null;
  }
}

export function saveGroup(g: StoredGroup) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(g));
  } catch {
    /* ignore */
  }
}

export function clearGroup() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(GROUP_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function formatGroupCode(code: string): string {
  const d = code.replace(/\D/g, '').slice(0, 6);
  if (d.length < 4) return d;
  return `${d.slice(0, 3)} ${d.slice(3)}`;
}
