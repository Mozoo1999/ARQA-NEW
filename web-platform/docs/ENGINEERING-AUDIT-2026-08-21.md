# NARQA EBOS — Engineering Audit

**Audit date:** 21 August 2026  
**Scope:** Repository completeness, web runtime, backend and schema alignment, documentation, test/build verification, and native mobile release readiness.

## Evidence-based result

The web application source is present and its static quality gates pass. However, the repository is **not currently complete as a native mobile deliverable**. There is no Expo/React Native project, no `app.json`, no `eas.json`, no Android/iOS source, and no Android SDK, Gradle, EAS CLI, or signing configuration in the build environment. Therefore, no genuine APK or IPA can be produced or supplied from the current repository.

> A production APK/IPA must only be delivered after its native source, build configuration, signing credentials, and successful artifact verification are present. A web/PWA link is not an APK or IPA.

## Verified evidence

| Area | Evidence | Result |
|---|---|---|
| TypeScript | `pnpm check` completed successfully | Pass |
| Automated tests | `pnpm test -- --run`: 3 test files, 34 tests passed | Pass |
| Production build | `pnpm build` completed successfully | Pass |
| Web pages | 24 page components are present under `client/src/pages` | Present |
| Backend | tRPC router, Drizzle schema, database helpers, OAuth wiring, and three test suites are present | Present |
| Live database | 17 business tables plus `__drizzle_migrations` returned by `SHOW TABLES` | Connected |
| Mobile source | No `apps/mobile`, Expo configuration, native Android/iOS project, or mobile package manifest found | Blocked |
| Native build toolchain | Android SDK, Gradle, adb, sdkmanager, and EAS CLI were not found | Blocked |

## Key findings

| Severity | Finding | Required correction |
|---|---|---|
| Blocking | No native mobile project exists in the repository. | Add a maintained Expo/React Native project or native Android/iOS projects, then implement and test API/auth/OCR/voice parity. |
| Blocking | No native build and signing environment exists. | Provision Android SDK/Gradle and an Android signing key, or use an authenticated EAS Build account. For iOS, provide Apple Developer signing and TestFlight/App Store distribution configuration. |
| High | The live database contains `journal_entries` and `journal_entry_items`, while current `drizzle/schema.ts` does not define them. | Reconcile the Drizzle schema with the live database, generate an audited migration, and add integration tests. |
| High | The current Drizzle schema defines logical ID fields but does not declare database foreign-key references. | Define/reconcile FK constraints via audited migrations and validate existing data before enforcement. |
| Medium | README previously stated 12 database tables, while the current schema defines 15 logical tables and the live database contains additional journal tables. | Keep README and ERD synchronized with the schema and migration history. |
| Medium | Runtime screenshots showed OCR rendering correctly, while several authenticated/query-driven routes displayed loading shells in the unauthenticated preview. | Execute documented, authenticated end-to-end flows and capture evidence for every critical route. |
| Medium | The original installation steps referenced `.env.example`, which is not present. | The README now lists required variable names and requires a secure environment manager; add a governed local configuration template before third-party handover. |

## Mobile release gate

| Platform | Current status | Release condition |
|---|---|---|
| Android APK/AAB | Not buildable from current repository | Add mobile source, Android SDK or EAS Build, release signing, and install test on a physical device. |
| iOS IPA | Not buildable from current repository | Add mobile source, Apple Developer credentials, provisioning profile, and TestFlight/device test. |
| Responsive Web | Buildable and deployed | Validate authenticated mobile-browser flows separately; this is not a native installation artifact. |

## Recommended remediation sequence

1. Restore or create the real mobile application source in the repository and connect it to the typed backend APIs.
2. Reconcile the Drizzle schema, migration history, and live database before any further live schema mutation.
3. Execute authenticated browser tests for company, branch, department, project, supplier, purchase request, governance, OCR approval, and report export flows.
4. Build and inspect a signed Android artifact, then provide the actual artifact URL only after installation succeeds on a physical Android device.
