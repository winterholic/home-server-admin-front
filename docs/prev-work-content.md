# 이전 작업 내용 (홈서버 관리 대시보드 프론트엔드)

## 최종 업데이트: 2026-03-28

---

## 완료된 작업 (2026-03-28 - 세션 2)

### 이슈 #6: IP 접속 현황 탭 추가
- **파일**: `src/pages/LogsPage.tsx`, `src/api/client.ts`, `src/types/index.ts`
- **내용**:
  - LogsPage 헤더에 "로그 대시보드" / "IP 접속 현황" 탭 토글 추가
  - `AccessIpsTab` 컴포넌트: 고유 IP 수, 의심 IP 수, 전체 요청 수 카드
  - IP별 테이블: 요청 수, 마지막 접속, 상태코드 배지, 요청 경로
  - 의심 IP(50회 이상) 빨간색 하이라이트
  - 행 클릭 시 경로 목록 펼침 (accordion)
  - 시간 범위 필터: 1h / 6h / 24h / 72h
  - `fetchAccessIps(hours, limit)` API 함수 추가
  - `AccessIpEntry`, `AccessIpsResponse` 타입 추가

### 이슈 #5 추가: 서비스 타입 아이콘 표시
- **파일**: `src/pages/ServicesPage.tsx`
- **내용**: `ServiceTypeIcon` 컴포넌트 추가 (docker=Box, nohup=Terminal, systemd=Settings2)

### 대시보드 서비스 현황 안정성
- **파일**: `src/pages/DashboardPage.tsx`
- **내용**: `Promise.all` → `Promise.allSettled`로 교체. fetchServices() 실패 시에도 대시보드 정상 표시

---

## 완료된 작업 (2026-03-28 - 세션 1)

### 1. 모니터링 페이지 X축 시간 포맷 개선
### 2. 디스크 표시 개선 (파티션별)
### 3. 서비스 로그 docker 지원
### 4. 이메일 설정 간소화

---

## 다음 세션에서 작업할 내용

### 로그 모달 개선 (ServicesPage)
- 자동 스크롤 (하단 고정)
- 실시간 갱신 (폴링 인터벌)

### 모니터링 히스토리 파티션별 디스크
- MonitoringPage에서 디스크 파티션별 히스토리 그래프

---

## 주요 파일 현황

```
src/
├── api/
│   └── client.ts           # fetchAccessIps() 추가
├── pages/
│   ├── DashboardPage.tsx    # Promise.allSettled
│   ├── LogsPage.tsx         # IP 접속 현황 탭 추가
│   └── ServicesPage.tsx     # 서비스 타입 아이콘
└── types/
    └── index.ts             # AccessIpEntry, AccessIpsResponse 추가
```

## API 변경사항 (백엔드 연동)

| 메서드 | 경로 | 변경 내용 |
|--------|------|-----------|
| `GET` | `/api/logs/access-ips` | 신규 - nginx access.log IP 집계 |
