/**
 * Module-level in-memory token store.
 * Access token은 localStorage가 아닌 메모리에만 보관 (XSS 방어).
 * Refresh token은 서버에서 HttpOnly 쿠키로 관리.
 */
let _token: string | null = null;

export const getToken = (): string | null => _token;
export const setToken = (token: string | null): void => {
  _token = token;
};
