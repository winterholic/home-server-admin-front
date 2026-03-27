# home-server-admin-front

홈 서버 관리 대시보드 프론트엔드 프로젝트.

## 기술 스택

- **React 19** + **TypeScript** (strict)
- **Vite 7** (빌드 툴)
- **Tailwind CSS v4** (`@tailwindcss/vite` 플러그인)
- **React Router DOM v7**
- **Axios** — API 클라이언트
- **Recharts** — 차트/그래프
- **lucide-react** — 아이콘
- **clsx** — 조건부 클래스

## 기획 문서
docs/plan-guide.md

## 개발 명령어

```bash
npm run dev       # 개발 서버 (Vite HMR)
npm run build     # tsc -b && vite build
npm run lint      # ESLint
npm run preview   # 빌드 결과물 미리보기
```

## 프로젝트 구조

```
src/
  api/            # Axios 클라이언트 및 API 함수 (client.ts, mockData.ts)
  components/     # 재사용 컴포넌트
    common/
    dashboard/
    layout/       # Layout 컴포넌트 (공통 레이아웃)
    logs/
    monitoring/
    services/
    settings/
  hooks/          # 커스텀 훅
  pages/          # 페이지 컴포넌트
    DashboardPage.tsx
    MonitoringPage.tsx
    ServicesPage.tsx
    LogsPage.tsx
    SettingsPage.tsx
  types/          # TypeScript 타입 정의
  App.tsx         # 라우팅 설정
  main.tsx        # 엔트리 포인트
```

## 라우팅

| 경로 | 페이지 |
|------|--------|
| `/` | Dashboard |
| `/monitoring` | Monitoring |
| `/services` | Services |
| `/logs` | Logs |
| `/settings` | Settings |

## API 프록시

개발 서버에서 `/api/*` 요청은 `http://localhost:8000`으로 프록시됩니다 (`vite.config.ts`).

## 배포

- Docker + nginx로 서빙 (`Dockerfile`, `docker-compose.yml`, `nginx.conf`)
- 프로덕션 배포 시 `vite.config.ts`의 `API_TARGET` 값 확인
