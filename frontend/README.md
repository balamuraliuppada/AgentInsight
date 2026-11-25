# AgentInsight

AI-Powered Digital Forensic Intelligence. AgentInsight is a B.Tech CSE frontend demonstration for post-extraction UFDR analysis.

## Start locally

Use Node.js 20 or newer.

```sh
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Open the Vite URL printed in the terminal. The first visit opens an Administrator demo session. Use the profile menu to log out and test the login or choose a different role from /login.

| Role | Email | Demo password |
| --- | --- | --- |
| Administrator | admin@agentinsight.demo | Demo2025! |
| Investigator | investigator@agentinsight.demo | Demo2025! |
| Reviewer | reviewer@agentinsight.demo | Demo2025! |

Frontend authentication and access checks demonstrate interface behavior. Real authentication, role enforcement, case authorization, and password recovery require backend implementation. The shared demo password is public fixture data. Mock workspace edits live in memory and reset on reload. The session and UI preferences use browser storage.

## Checks

```sh
npm test
npm run lint
npm run build
```

## Structure

- `src/components` contains the application shell, shared controls, and Plotly wrapper.
- `src/pages` contains the route-level investigation, evidence, reporting, and administration views.
- `src/context` manages session, case selection, preferences, and workspace data.
- `src/services` contains Axios configuration and API adapters.
- `src/mocks` contains deterministic synthetic records.
- `src/styles` contains the theme, responsive layout, and print styles.
- `test` tests coverage, references, role login, search, retrieval, graph, and timeline behavior.

## Demonstration behavior

- Five independent cases provide 510 artefacts, ten devices, twenty named participants, fifteen findings, and fifty seed audit events.
- Uploads check filename extension and size and may compute a genuine SHA-256 digest using Web Crypto in a secure browser context. Parsing, normalization, embeddings, and indexing are simulated and import zero artefacts. UFDR support is planned.
- AI retrieval uses deterministic rules and scoped references. Semantic and hybrid search simulate ranking using literal terms. Audit entries are mutable. Reports are synthetic and use the browser print dialog for PDF saving.
- Map tiles come from OpenStreetMap. Recorded points continue to render when tiles fail. The optional line connects points in timestamp order.

## Backend integration

Set `VITE_API_BASE_URL` and switch `VITE_USE_MOCK_API` to `false` after implementing the FastAPI contract. The current adapters suggest endpoints for list and write operations, authentication, search, investigation, entities, relationships, and timeline. Confirm pagination, resource schemas, validation, and error formats before connecting a live deployment.

The backend must own authentication, permissions, tenant and case scoping, upload jobs, one-way audit storage, original evidence custody, indexing, and evidence-linked model output. Configure credentials, model keys, PostgreSQL, pgvector, and LangChain on the backend.
