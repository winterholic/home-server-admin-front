import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import axios from 'axios';
import { setToken } from '../api/tokenStore';

declare const __API_BASE_URL__: string;

/**
 * 보안 설계:
 * - Access token: 메모리(React state + tokenStore)에만 보관, 15분 만료
 *   → localStorage 미사용으로 XSS 탈취 불가
 * - Refresh token: 서버가 HttpOnly 쿠키로 설정, JS 접근 불가
 *   → 앱 로드 시 /auth/refresh 호출로 세션 자동 복원
 * - 로그아웃: /auth/logout 호출 → 서버가 쿠키 삭제
 */

const USER_KEY = 'nodectrl_user'; // username만 저장 (민감 정보 아님)

interface AuthState {
  token: string | null;
  username: string | null;
  initialized: boolean; // 초기 세션 복원 완료 여부
}

interface AuthContextValue {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  initialized: boolean;
  login: (token: string, username: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    username: localStorage.getItem(USER_KEY),
    initialized: false,
  });

  // 앱 로드 시 refresh 쿠키로 세션 자동 복원
  useEffect(() => {
    axios
      .post<{ access_token: string; username: string }>(
        `${__API_BASE_URL__}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then(({ data }) => {
        setToken(data.access_token);
        localStorage.setItem(USER_KEY, data.username);
        setAuth({ token: data.access_token, username: data.username, initialized: true });
      })
      .catch(() => {
        setToken(null);
        localStorage.removeItem(USER_KEY);
        setAuth({ token: null, username: null, initialized: true });
      });
  }, []);

  const login = useCallback((token: string, username: string) => {
    setToken(token);
    localStorage.setItem(USER_KEY, username);
    setAuth({ token, username, initialized: true });
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post(
        `${__API_BASE_URL__}/auth/logout`,
        {},
        { withCredentials: true },
      );
    } catch {
      // 서버 에러가 나도 로컬 상태는 초기화
    }
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setAuth({ token: null, username: null, initialized: true });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...auth, isAuthenticated: !!auth.token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
