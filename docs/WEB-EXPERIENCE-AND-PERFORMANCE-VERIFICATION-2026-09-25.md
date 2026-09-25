# Web Experience and Performance Verification — 2026-09-25

**Author:** Manus AI

**Scope:** Public NARQA website entry, protected-web bootstrap, and production bundle behavior.

## Conclusion

The web entry was rebuilt as a **responsive operational introduction** rather than an image-led promotional page. It explains the real path from source capture to authorized execution without inventing live business metrics. The protected platform remains separate: it is loaded only after the user selects the workspace, and it now shows a visible loading state rather than a blank page while its code is retrieved.

The production build now explicitly uses `NODE_ENV=production`. This prevents development-only Manus runtime and JSX source-location instrumentation from being embedded in the production HTML. The build uses a route-level lazy-loading strategy and explicit vendor chunks. Vite supports production entry generation and code-splitting configuration through its production build system.[1]

## Implemented Experience Changes

The public entry presents a short Arabic operational statement, two clear entry actions, and a four-step model: source capture, draft formation, evidence review, and constrained execution. The supporting content describes voice intake, document analysis, operational records, and governance. It deliberately labels the page as an explanation of platform behavior, not as live operational telemetry.

The desktop layout combines an action-led narrative with a compact operational-flow panel. The tablet layout changes the hero into a vertical reading sequence. The phone layout keeps the primary workspace action, secondary route explanation, and useful operating statements within a touch-friendly, single-column flow. The public page was checked in the live preview at **1440×900**, **768×1024**, and **390×844**.

The authenticated `/app` route was checked after the bootstrap split. In an unsigned browser session it renders the existing secure-access screen. The browser console showed no runtime error after the Vite middleware configuration was corrected.

## Performance Changes and Evidence

The former hero relied on two generated image assets with local originals of approximately **4.31 MB** and **4.40 MB**. The redesigned public entry does not reference either image. The first useful interface is therefore not delayed by decorative hero media.

The public entry no longer imports the protected tRPC provider, dashboard layout, administrative routes, OCR modules, spreadsheet modules, or workspace data queries at page bootstrap. The public browser inspection found no protected `/api/trpc` request before the workspace was entered. The only observed API request was the existing analytics endpoint.

The production HTML is **1,281 bytes** and contains no injected Manus runtime script. The public entry JavaScript is **18,848 bytes** before transfer compression. The shared React runtime is **281,509 bytes** before compression and **89.23 KB** gzip-compressed. The global CSS output is **140.88 KB** before compression and **23.02 KB** gzip-compressed. The protected platform bootstrap is emitted separately and is loaded only for non-root routes.

| Verification item | Result | Evidence |
|---|---|---|
| Root TypeScript | Passed | `pnpm check` completed successfully. |
| Unit and API tests | Passed | 22 test files and 112 tests passed. |
| Production build | Passed | `pnpm build` completed successfully with explicit production mode. |
| Mobile TypeScript | Passed | `apps/mobile` completed `tsc --noEmit`. |
| Development route recovery | Passed | `/src/main.tsx` and `/src/platform.tsx` returned JavaScript after restoring object-form Vite configuration. |
| Public protected-API isolation | Passed | Browser resource inspection found no `/api/trpc` request on the root entry. |
| Device runtime validation | Not performed | Physical Android, iPhone, and iPad testing remain separate required validation. |

## Important Boundaries

This verification proves the current source, build, browser preview, and automated test behavior. It does **not** prove live OAuth round-trip behavior on a phone, real microphone interaction, native PDF rendering, external WhatsApp Business connectivity, or iOS signing and installation. Those outcomes require the separately documented physical-device and provider-account checks.

## References

[1]: https://vite.dev/guide/build "Vite Building for Production Guide"
