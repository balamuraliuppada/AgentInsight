# AgentInsight frontend progress

## Implemented

- Vite setup, Bootstrap design system, responsive shell, theme and case switching, and demo authentication routes.
- Deterministic fixture data and Axios service adapters with mock counterparts.
- Dashboard, case list and detail views, staged uploads, read-only evidence inspection, search, and cited AI investigation.
- Entity analysis, Cytoscape relationships, Plotly timeline, Leaflet locations, and evidence reference navigation.
- Finding review, report drafts and printable previews, simulated accounts, audit history, and settings.
- Automated tests for mock login, fixture integrity, case-specific search and citations, and analytics inputs.

## Decisions and pending integration

- The initial demo session opens the dashboard. Logout returns to the sign-in form. Workspace changes are in memory.
- Ingestion stages and the AI engine run as simulations. Browser Web Crypto calculates file hashes when available. Uploading files does not create evidence records.
- FastAPI integration, production authentication, server-side permissions, UFDR parsing, semantic retrieval, and durable storage are future work.

## Verification

- ESLint and the automated service tests passed.
- Production bundling passed. Vite reports the size of the lazy Plotly chunk.
- Desktop and mobile browser QA remain unverified because the managed preview relay timed out.
