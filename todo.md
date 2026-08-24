# NARQA EBOS - Project TODO

## Phase 1: Project Setup (Database, Architecture, Visual Design)
- [x] Design complete database schema (all 7 modules)
- [x] Run drizzle-kit generate and apply SQL migrations
- [x] Design visual system (colors, fonts, CSS variables)
- [x] Setup Google Fonts in index.html
- [x] Customize DashboardLayout for NARQA EBOS
- [x] Create todo.md (this file)

## Phase 2: Authentication & Permissions Module
- [x] Extend users table with role/department/branch fields
- [x] Build user management page (list, edit, activate/deactivate)
- [x] Role-based procedures: adminProcedure, managerOrAdminProcedure
- [x] Auth-aware navigation and route guards
- [x] Activity logging for all mutations

## Phase 3: Organization Module
- [x] Company profile page (create/edit company info)
- [x] Branches management (list, create, edit, delete)
- [x] Departments management (list, create, edit, delete)

## Phase 4: Projects Module
- [x] Projects list page with filters and search
- [x] Create/edit project form
- [x] Project detail page with status tracking
- [x] Team assignment (add/remove members)
- [x] Project status workflow (planning → active → completed → on-hold)

## Phase 5: Suppliers Module
- [x] Supplier categories management
- [x] Suppliers list page with search and filter by category
- [x] Create/edit supplier profile form
- [x] Supplier detail page

## Phase 6: Purchase Requests Module
- [x] Purchase request creation form with line items
- [x] Purchase requests list with status filters
- [x] Approval workflow (submit → under_review → approved/rejected)
- [x] Purchase request detail page with approval history
- [x] Approver actions (approve/reject with comments)

## Phase 7: Governance Module
- [x] Architecture reviews list and creation
- [x] Architecture decisions list and creation (ADR records)
- [x] Traceability matrix (link decisions to reviews)

## Phase 8: Enterprise Control Tower
- [x] KPI stat cards (projects, suppliers, purchase requests, governance)
- [x] Activity timeline (recent actions across all modules)
- [x] System health indicators
- [x] Module-level metrics

## Phase 9: Testing & Delivery
- [x] Write vitest unit tests (33 tests passing)
- [x] Seed data: Company, 3 Branches, 6 Departments, 5 Categories, 4 Suppliers, 4 Projects, 3 Reviews, 5 ADRs
- [x] TypeScript: 0 errors
- [x] Save checkpoint v0.1

## Documentation (Remaining)
- [x] README.md with installation guide
- [x] Deployment Guide
- [x] System Architecture document

## Known Limitations (v0.1 → Fixed in v0.1-final)
- [x] Architecture Decision detail page: implemented as inline panel (click row to expand)
- [x] Architecture Review detail page: implemented as inline panel (click row to expand)
- [x] Documented limitation: no email notifications (non-blocking for prototype)
- [x] Documented limitation: no file attachments (non-blocking for prototype)
- [x] Documented limitation: justification field in PR form is not persisted (no DB column — non-blocking)
- [x] Documented limitation: no pagination on list pages (all records loaded — acceptable at prototype scale)
- [x] Documented limitation: build chunk size warning remains (code splitting recommended for v0.2)

## MISSION-003: Finalization Tasks
- [x] Confirmation dialogs: verified present in all 4 delete operations
- [x] Traceability seed data: 6 links added (ADRs ↔ Reviews ↔ Projects)
- [x] Error handling: NotFound (404) updated to Arabic, ErrorBoundary updated to Arabic
- [x] Build: pnpm build succeeds in 5.88s
- [x] Tests: 33/33 passing
- [x] TypeScript: 0 errors
- [x] E2E scenario: PR-20260709-0602 created → submitted → approved (DB verified)
- [x] Navigation: all 11 sidebar paths verified against App.tsx routes
- [x] ControlTower: all field names verified against db.ts
- [x] Save final checkpoint v0.1-final
- [x] Produce Executive Acceptance Package (PDF) — COMPLETE

## ERD UI Enhancement & Visual Verification
- [x] Review ERD diagram entities (company, branches, departments, users, supplier_categories, suppliers, projects, project_team_members, activity_log, purchase_requests, purchase_request_items, architecture_reviews, architecture_decisions, traceability_matrix)
- [x] Verify UI representations for all relational entities
- [x] Run test suite and capture screenshots
- [x] Verify and capture evidence for remaining ERD-related UIs: /admin/users, /governance/decisions, project detail/team assignment, purchase request detail/items, supplier categories management, and supplier detail
- [x] Update visual verification notes with route-by-route evidence mapping each ERD entity/relation to its actual UI screen or interaction
- [x] Capture direct visual evidence of the supplier category CRUD dialog via the authenticated Suppliers screen
- [x] Expand visual verification notes with explicit evidence source (route capture, code inspection, or live database query) for each ERD entity and relation
- [x] Document the non-persisted PR justification limitation in a project artifact outside todo.md (README or validation notes)

## ARQA-NEW Repository & Documentation Audit & Alignment
- [x] Audit ARQA-NEW repository files, README, and design specifications
- [x] Compare current web app features against ARQA-NEW architectural and operational requirements
- [x] Implement missing functional modules, workflows, or backend integrations specified in ARQA-NEW
- [x] Verify end-to-end execution of company → branch → department → project → supplier → purchase request → approval → governance workflow
- [x] Produce alignment audit report detailing the exact status and gap analysis relative to ARQA-NEW specifications

## OCR Document & Receipt Intake Enhancement
- [x] Implement secure file/receipt upload endpoint with mock/client-side OCR fallback and structured field extraction (amount, date, vendor, tax number)
- [x] Build OCR Document & Receipt Review Page with side-by-side preview and human review approval workflow
- [x] Integrate OCR extraction with audit log and draft collection/expense creation
- [x] Verify TypeScript compilation, test suite execution, and production build with OCR features

## OCR Side-by-Side Document Preview Enhancement
- [x] Implement side-by-side layout in OcrIntakePage (document preview panel on the left/top alongside extracted fields and raw text on the right)
- [x] Add interactive document preview rendering (support for receipt card mockup and PDF document placeholder with zoom/inspect capability)
- [x] Verify responsive layout across mobile and desktop breakpoints and document evidence in visual-verification-notes.md

## Real File Drag-and-Drop Upload & OCR Processing
- [x] Implement native HTML5 Drag-and-Drop and file input handlers in OcrIntakePage
- [x] Add file validation (type check for images/PDFs and size limit up to 10MB)
- [x] Generate object URLs / data URLs for uploaded file preview and OCR field extraction on user image files
- [x] Verify test suite execution and production build

## Four Proposals & Mobile Voice App Delivery
- [x] Implement side-by-side OCR preview and human review workflow
- [x] Implement real drag-and-drop file upload with Tesseract.js in-browser OCR extraction
- [x] Implement WhatsApp Business & Webhook simulator interface
- [x] Restore or implement the smart cost chain calculation engine in a maintained native mobile project
- [ ] Restore or implement native mobile voice/text command intake with human confirmation safeguards
- [ ] Add and validate Expo iOS/Android configuration and device permissions after native mobile source is restored

## Database & API Integration for OCR & Voice Commands
- [x] Add financial draft records and verified audit tracking tables in drizzle/schema.ts
- [x] Implement backend tRPC procedures for submitting, reviewing, approving, and persisting OCR & Voice command entries into financial ledger tables
- [x] Wire frontend OcrIntakePage and CommandsPage to live backend mutations with confirmation guard and duplicate prevention
- [x] Verify test suite execution, database integrity, and production build (34/34 tests passing)

## Approved Financial Drafts Export (Excel & PDF)
- [x] Implement backend export endpoints or tRPC procedures for generating Excel (CSV/XLSX) and formatted PDF reports of approved smart intake drafts
- [x] Build Approved Drafts & Export Page with filtering by date/source and one-click Excel/PDF download buttons
- [x] Verify test suite execution, export data integrity, and production build (34/34 tests passing)

## Report Preview Before Export Feature
- [x] Add interactive Report Preview Dialog/Tab in ReportsExportPage displaying summary totals, itemized approved records, and validation metrics prior to Excel/PDF download
- [x] Verify test suite execution, preview data integrity, and production build (34/34 tests passing)

## Date & Month Filtering for Financial Reports & Export
- [x] Add date range and month filter controls in ReportsExportPage and pass filter parameters to backend export CSV/PDF endpoints
- [x] Verify test suite execution, filter data integrity, and production build (34/34 tests passing)

## Corporate Logo & CFO Signature in PDF Report
- [x] Update PDF export endpoint in server/_core/index.ts to render corporate branding header with logo placeholder/SVG and official CFO signature block at bottom
- [x] Verify test suite execution, PDF layout rendering, and production build (34/34 tests passing)

## ERD Diagram Website Implementation & Verification
- [x] Audit ERD entities (company, branches, departments, users, supplier_categories, suppliers, projects, project_team_members, activity_log, purchase_requests, purchase_request_items, architecture_reviews, architecture_decisions, traceability_matrix) against current schema and routes
- [x] Implement ERD entity relationship navigator and interactive entity map page in NARQA EBOS web app (ErdExplorerPage)
- [x] Verify test suite execution, ERD data integrity, and production build (34/34 tests passing)

## Comprehensive Four Proposals & ARQA-NEW AI Integration & Mobile Delivery
- [x] Audit ARQA-NEW core documentation, cost engine, voice intent engine, and multi-modal intake specifications
- [ ] Restore native mobile source and verify cross-platform parity for cost calculation, Arabic commands, WhatsApp, and OCR
- [ ] Build and validate a signed Expo/native mobile release after source and signing configuration are available
- [x] Verify test suite execution, database schema alignment, and production build (34/34 tests passing) with 0 TypeScript errors

## Corporate Settings & Voice-Controlled Configuration Management
- [x] Implement settings page for corporate identity (logo, organization name, theme color, PDF signature)
- [x] Extend Arabic intent parser and voice command engine to support setting configuration updates (e.g. "غيّر اسم الشركة", "فعّل الوضع الداكن", "حدّث شعار المؤسسة") with confirmation guards and audit logging
- [x] Verify test suite execution, settings persistence, and production build (34/34 tests passing)

## Foreign Key Relations Management in ERD Explorer
- [x] Implement backend database helper and tRPC mutation for adding and altering Foreign Key constraints between tables
- [x] Build relationship management tab/modal in ERD Explorer to create and inspect cross-table foreign key links
- [x] Verify test suite execution, TypeScript check, and production build (34/34 tests passing, 0 TypeScript errors)

## Comprehensive Engineering Audit & Installable Mobile Release
- [x] Audit repository structure, documentation, database schema, migrations, backend procedures, frontend routes, and integrations against actual implementation
- [x] Run static quality checks, production build, tests, route rendering, and runtime-log inspection; record known limitations
- [x] Audit the Expo mobile project and native build prerequisites; confirm no mobile source, Android SDK, build tools, or signing configuration are present
- [x] Deliver an evidence-based engineering audit report with explicit, actionable mobile-release blockers
- [ ] Execute and document authenticated critical flows for organization, procurement, governance, OCR approval, and reports; record success or blockers
- [ ] Restore or create the maintained Expo/React Native mobile source, implement feature parity, provision native signing, and build/test a genuine Android artifact on a physical device

## ARQA-NEW GitHub Repository Synchronization
- [x] Inspect the selected ARQA-NEW repository and compare its structure with the audited NARQA EBOS project
- [x] Prepare a safe, documented change set excluding secrets, local logs, build artifacts, and invalid mobile deliverables
- [x] Push the audited source and mobile delivery changes to ARQA-NEW; completed on `main` through commits `34d7579`, `c8733d4`, and `d69abc4` after the earlier 403 blocker was resolved
- [x] Verify the remote commit and report the delivered revision; verified `d69abc4f7a5d40b9970d7cdb07f8908907ff7ea9` on `main`

## Mobile App Build — Expo Android, iOS & Tablet
- [x] Create maintained Expo mobile source under apps/mobile with TypeScript and shared NARQA branding
- [ ] Connect mobile app to live NARQA EBOS backend with authenticated API flow and environment configuration
- [x] Implement responsive tablet/phone navigation and core operational dashboard flows
- [ ] Implement native OCR upload/review and Arabic voice command/TTS interaction with confirmation safeguards
- [x] Add Android/iOS permissions, app metadata, deep-link/auth configuration, and build profiles
- [x] Run mobile TypeScript/build checks and document device installation and remaining native build prerequisites
- [x] Update repository documentation and checkpoint with verified mobile delivery status
- [x] Wire the native mobile app to actual NARQA EBOS operational module launchers and document phone/tablet journeys
- [ ] Implement and verify native OAuth/deep-link session bootstrap for Android and iOS

## Internal Android APK Delivery
- [x] Verify Android SDK, Gradle, Java, and Expo native build prerequisites
- [x] Build an internal APK artifact from apps/mobile without store publishing via GitHub Actions run 32789975004
- [x] Validate APK artifact metadata and installation readiness: com.narqa.ebos v0.1.0, arm64-v8a, v2 debug signature, SHA-256 recorded
- [x] Document internal APK installation steps and any device security prompts, conditional on a successfully produced APK artifact

## GitHub Actions Internal APK Build
- [x] Add a manually triggered GitHub Actions workflow that runs Expo prebuild and produces an Android APK artifact
- [x] Run the GitHub Actions workflow on ARQA-NEW main and inspect its build log
- [x] Verify the uploaded APK artifact metadata and provide its download path
