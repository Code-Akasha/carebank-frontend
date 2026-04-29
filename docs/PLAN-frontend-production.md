# PLAN: Frontend Production Upgrade

## Overview
Update the frontend application to incorporate authentication (Login/Registration flows), session persistence, and API interceptors. Most importantly, build out the Admin Observability Dashboard to display real-time metrics, system health, risk flags, and an immutable log of agent actions to prove operational transparency.

## Status Update (2026-04-29)
- Fixed API client import paths and wired Bills discovery + Admin Webhooks to backend endpoints.

## Project Type
**WEB**

## Success Criteria
- [ ] Login screen authenticates users and stores the JWT securely.
- [ ] Axios/Fetch instances automatically attach the `Authorization: Bearer <token>` to all backend and mockbank requests.
- [ ] Admin Dashboard shell is accessible (ideally protected by role).
- [ ] Admin Views display live metrics (Active Sessions, Total Users, Avg Latency), Agent Logs, and Users at Risk.

## Tech Stack
- **React** (Vite)
- **TailwindCSS** (Formatting Admin UI)
- **Zustand / Context API** (Auth Session state)
- **Chart.js / Recharts** (For rendering system health metrics)

## File Structure Additions
```text
src/
├── pages/
│   ├── auth/
│   │   └── Login.jsx
│   └── admin/
│       ├── AdminLayout.jsx
│       ├── DashboardOverview.jsx
│       └── AgentLogs.jsx
├── context/
│   └── AuthProvider.jsx
└── api/
    └── client.js (Interceptor configuration)
```

## Task Breakdown

### 1. Implement Auth Flow & Interceptor
- **Agent:** `frontend-specialist`
- **Skills:** `frontend-design`, `clean-code`
- **Priority:** P0
- **INPUT:** `src`
- **OUTPUT:** Login page UI, Auth context/store, and global API interceptor setup to attach JWTs.
- **VERIFY:** Attempting to visit `/dashboard` redirects to `/login` if no valid token is found.

### 2. Admin Dashboard Layout & Routing
- **Agent:** `frontend-specialist`
- **Priority:** P1
- **OUTPUT:** Sidebar layout dedicated to the Admin view, cleanly separated from the consumer dashboard UI.
- **VERIFY:** Navigating to `/admin` successfully renders the empty admin shell.

### 3. Live Metrics Overview UI
- **Agent:** `frontend-specialist`
- **Priority:** P1
- **Dependencies:** Task 2
- **INPUT:** View to hit `/admin/system/health`
- **OUTPUT:** KPI Cards (Total Users, Active Sessions, LLM Calls/Min, Avg Latency) and high-level charts.
- **VERIFY:** UI updates either dynamically via sockets or via regular polling of the backend API.

### 4. Agent Logs & Risk Flags Table
- **Agent:** `frontend-specialist`
- **Priority:** P1
- **Dependencies:** Task 2
- **INPUT:** View to hit `/admin/logs` and `/admin/users/risks`
- **OUTPUT:** Sortable, paginated data grid to view discrete actions taken by agents across the system, enabling an audit trail.
- **VERIFY:** The grid allows filtering by `user_id` or `agent_type`.

## Phase X: Verification
- [ ] UI Audit: WCAG Contrast and Touch Targets check (`ux_audit.py`).
- [ ] Authentication: Ensure tokens are not leaked in URL parameters.
- [ ] Build Check: `npm run build` succeeds.
- [ ] Run: Test full user login flow, then switch context to Admin view to see logs.
