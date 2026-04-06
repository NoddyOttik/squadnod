// Stable per-tab identity for game rosters (display names alone are not unique across sessions).
const STORAGE_KEY = 'squadMemberKey';

export function getOrCreateMemberKey() {
  if (typeof window === 'undefined') return '';
  try {
    let k = sessionStorage.getItem(STORAGE_KEY);
    if (k && k.length > 0 && k.length <= 128) return k;
    k =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `m_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    sessionStorage.setItem(STORAGE_KEY, k);
    return k;
  } catch {
    return `m_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  }
}
