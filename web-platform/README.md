# NARQA EBOS — Enterprise Business Operating System

**Operational Prototype v0.1**

NARQA EBOS is the Enterprise Business Operating System built for NARQA Technology Company, governed by the NARQA Enterprise Architecture Framework (NEAF). It provides a unified operational platform covering organization management, project tracking, supplier management, procurement, and enterprise architecture governance.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NARQA EBOS — v0.1                            │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   Frontend   │    │   Backend    │    │    Database      │  │
│  │  React 19    │◄──►│  Express 4   │◄──►│  MySQL / TiDB    │  │
│  │  Tailwind 4  │    │  tRPC v11    │    │  Drizzle ORM     │  │
│  │  shadcn/ui   │    │  TypeScript  │    │  Drizzle / MySQL │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│                                                                 │
│  Authentication: Manus OAuth 2.0                                │
│  Role System: admin | manager | user                            │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | React | 19 |
| UI Components | shadcn/ui + Tailwind CSS | 4 |
| API Layer | tRPC | 11 |
| Backend Runtime | Node.js + Express | 22 / 4 |
| Database | MySQL / TiDB | Compatible |
| ORM | Drizzle ORM | Latest |
| Authentication | Manus OAuth 2.0 | — |
| Language | TypeScript | 5 |
| Testing | Vitest | 2 |

---

## Modules

### 1. Enterprise Control Tower
Real-time dashboard showing live KPIs across all modules: active projects, pending purchase requests, supplier count, architecture decisions, and system health indicators.

### 2. Organization Management
Manage the company profile, branches (up to multi-city), and departments. Supports hierarchical department structure linked to branches.

### 3. Project Management
Full project lifecycle management: create projects, assign team members, track status (planning → active → on_hold → completed → cancelled), and monitor budgets.

### 4. Supplier Management
Maintain a categorized supplier registry with contact details, ratings (1–5), status tracking (active / inactive / blacklisted), and registration information.

### 5. Purchase Requests
End-to-end procurement workflow: create requests with line items, submit for review, approve or reject with comments, and track full approval history.

**Approval Flow:**
```
Draft → Submitted → Under Review → Approved / Rejected
                 ↘                ↘
                 Cancelled        Cancelled
```

### 6. Architecture Governance (NEAF)
Implements the NARQA Enterprise Architecture Framework governance:
- **Architecture Reviews (AR):** Scheduled reviews with outcomes (pass / conditional_pass / fail / deferred)
- **Architecture Decisions (ADR):** Decision records with full context (problem, decision, rationale, alternatives, implications)
- **Traceability Matrix:** Links decisions to reviews with typed relationships (originated_from, validated_by, superseded_by, related_to)

### 7. User Management
Manage system users, assign roles (admin / manager / user), link to departments and branches, and activate/deactivate accounts.

---

## Database Schema

```
users                    → System users with role-based access
company                  → Single company profile
branches                 → Company branches (multi-city)
departments              → Departments linked to branches
projects                 → Projects with team and budget tracking
project_team_members     → Many-to-many: projects ↔ users
supplier_categories      → Supplier classification taxonomy
suppliers                → Supplier registry with ratings
purchase_requests        → Procurement requests with approval flow
purchase_request_items   → Line items for purchase requests
architecture_reviews     → NEAF architecture review records
architecture_decisions   → Architecture Decision Records (ADR)
traceability_matrix      → Links between decisions and reviews
activity_log             → Audit trail for all system actions
smart_intake_drafts      → OCR, voice command, and WhatsApp review drafts
```

---

## Installation Guide

### Prerequisites
- Node.js 22+
- pnpm 9+
- MySQL 8+ or TiDB compatible database

### Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd narqa-ebos-prototype

# 2. Install dependencies
pnpm install

# 3. Configure environment variables
# Set DATABASE_URL, JWT_SECRET, VITE_APP_ID, OAUTH_SERVER_URL,
# and VITE_OAUTH_PORTAL_URL through your secure environment manager.

# 4. Apply database migrations
pnpm drizzle-kit generate
# Then apply the generated SQL via your database client

# 5. Seed initial data
node scripts/seed.mjs

# 6. Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | MySQL connection string | Yes |
| `JWT_SECRET` | Session cookie signing secret | Yes |
| `VITE_APP_ID` | Manus OAuth application ID | Yes |
| `OAUTH_SERVER_URL` | Manus OAuth backend URL | Yes |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL | Yes |

---

## Deployment Guide

### Production Build

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

### Deployment on Manus Platform

1. Ensure all environment variables are configured in the Manus Secrets panel.
2. Create a checkpoint via the Management UI.
3. Click the **Publish** button in the Management UI header.
4. The application will be deployed to the configured domain.

### First-Time Setup After Deployment

1. Log in with the owner account (Manus OAuth).
2. The owner account is automatically assigned the `admin` role.
3. Navigate to **الإدارة → المستخدمون** to manage other users.
4. Navigate to **المنظمة → الشركة** to complete the company profile.
5. Run `node scripts/seed.mjs` to populate initial reference data if needed.

---

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch
```

**Test Coverage (v0.1):**
- `server/auth.logout.test.ts` — Authentication logout flow
- `server/ebos.api.test.ts` — Business logic validation (32 tests)

---

## Key Files

```
drizzle/schema.ts          → Database tables & types
server/db.ts               → Query helpers
server/routers.ts          → tRPC procedures (all modules)
client/src/App.tsx         → Routes
client/src/components/DashboardLayout.tsx → Main navigation
client/src/pages/          → All page components
scripts/seed.mjs           → Initial data seeding
```

---

## Role-Based Access Control

| Action | admin | manager | user |
|---|---|---|---|
| View all data | ✓ | ✓ | ✓ |
| Create projects / suppliers / PRs | ✓ | ✓ | ✓ |
| Approve / reject purchase requests | ✓ | ✓ | — |
| Delete projects / suppliers | ✓ | ✓ | — |
| Manage company / branches / departments | ✓ | — | — |
| Manage users | ✓ | — | — |
| Delete suppliers / categories | ✓ | — | — |

---

## Known Limitations (v0.1)

The following features are planned for v0.2:

- Architecture Decision detail page (currently list + create only)
- Architecture Review detail page (currently list + create only)
- Email notifications for approval workflows
- File attachments for purchase requests
- Organization chart visualization
- Advanced reporting and export (PDF/Excel)
- Bulk operations on lists
- Native Android and iOS source projects and signed installation packages are not currently included. See `docs/ENGINEERING-AUDIT-2026-08-21.md`.

---

## Architecture Governance

This system is governed by the **NARQA Enterprise Architecture Framework (NEAF)**. All architectural decisions are recorded as ADRs within the system itself, making NARQA EBOS self-documenting from an architecture perspective.

Current ADRs recorded in the system:
- ADR-001: Adopt tRPC as unified API layer
- ADR-002: Adopt MySQL/TiDB as primary database
- ADR-003: Adopt Drizzle ORM for database management
- ADR-004: Adopt React 19 + Tailwind 4 for frontend
- ADR-005: Three-tier role hierarchy (admin/manager/user)

---

*NARQA EBOS Operational Prototype v0.1 — Built under MISSION-001*
