const hasLocalStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const authStorage = undefined;
export const persistSession = hasLocalStorage;
export const autoRefreshToken = hasLocalStorage;
