# Undergraduation Admin Dashboard

An internal-facing CRM for the Undergraduation.com advising team. The dashboard centralises every learner's journey so advisors can review intent signals, log outreach, coordinate next steps, and generate AI-assisted context before each conversation.

##  Core capabilities

- **Secure advisor access** – Email/password authentication backed by Firebase Auth with session persistence and optional self-service account creation for new teammates.

- **Student directory & segments** – Search by name/email/country, filter by application stage, and apply quick segments such as "Needs follow-up", "High intent", or "Essay support" to focus the day's outreach list.

- **Workspace for a single student** – Surface journey metrics, tags, progress, communications, notes, reminders, and a dynamic AI summary for the selected learner or deep links like `/dashboard/students/[id]`.

- **Collaboration tooling** – Log calls/emails/SMS/WhatsApp messages, append internal notes, schedule reminders, and trigger mock follow-up automations that also write to the interaction timeline.

- **Realtime data with offline fallback** – Firestore listeners keep the UI live, while an in-memory mock store populated from `src/data/students.ts` powers full interactivity when Firebase credentials are absent.

- **AI insight pipeline(ongoing development)** – The Hugging Face Inference API summarises each student's latest activity with caching, validation, and helpful error messaging for missing keys or rate limits.

##  Tech stack

- [Next.js 15 App Router](https://nextjs.org/) with React 19 and Turbopack dev/build pipelines.
- Tailwind CSS v4 (PostCSS pipeline) for styling primitives.
- TypeScript-first codebase with ESLint for linting.
- Firebase Web & Admin SDKs for auth + data, Hugging Face for AI summarisation(under development).

## 🔧 Development quick start

1. **Copy environment template**
   ```bash
   cp .env.example .env.local
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Run the local dev server**
   ```bash
   npm run dev
   ```
   The dashboard is served at [http://localhost:3000](http://localhost:3000).
4. **Lint the project** (primary CI check)
   ```bash
   npm run lint
   ```
5. **Create a production build (optional)**
   ```bash
   npm run build
   npm run start
   ```

##  Environment configuration

All variables are listed in [`.env.example`](.env.example). Populate them before running against live services.

### Firebase Web SDK (client)

These keys allow the browser to hydrate auth and Firestore data. When they are missing, the app falls back to mock data.

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Firebase Admin SDK (server)

Server routes use the Admin SDK for privileged reads/writes. Wrap newlines in the private key as `\n`.

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### API host overrides

- `NEXT_PUBLIC_API_BASE_URL` – Optional browser override when API routes are deployed separately.
- `API_BASE_URL` – Optional server override for the same scenario.

### Hugging Face summariser(Ongoing development)

- `HUGGINGFACE_API_KEY` – Required to enable AI summaries.
- `HUGGINGFACE_SUMMARY_MODEL` – Optional, defaults to `facebook/bart-large-cnn`.

##  Project layout

```
src/
├─ app/
│  ├─ api/                   # Next.js route handlers (students CRUD, AI summary)
│  ├─ dashboard/             # Dashboard and student detail routes
│  ├─ globals.css            # Tailwind v4 entry point
│  └─ page.tsx               # Auth entry screen
├─ components/
│  ├─ auth/                  # Login/signup panel
│  └─ dashboard/             # Dashboard UI, skeletons, header, styles
├─ data/                     # Mock student dataset & shared types
├─ hooks/                    # Client hooks (auth, dashboard state, summaries)
├─ lib/                      # Firebase setup, helpers, summary normalisers
├─ server/                   # Firestore + AI summariser services
├─ services/                 # Client-side student data layer & mock store
└─ types/                    # Shared API contract types
```

## API routes

| Method       | Endpoint                                  | Purpose                                                                        |
| ------------ | ----------------------------------------- | ------------------------------------------------------------------------------ |
| GET          | `/api/students`                           | Fetch all students with merged timeline, notes, reminders, and communications. |
| POST         | `/api/students/:id/notes`                 | Create a note.                                                                 |
| PATCH/DELETE | `/api/students/:id/notes/:noteId`         | Update or delete a note.                                                       |
| POST         | `/api/students/:id/communications`        | Log a communication and append timeline activity.                              |
| POST         | `/api/students/:id/follow-up`             | Trigger the mock follow-up automation workflow.                                |
| POST         | `/api/students/:id/reminders`             | Schedule a reminder/task.                                                      |
| PATCH        | `/api/students/:id/reminders/:reminderId` | Toggle reminder completion.                                                    |
| POST         | `/api/students/:id/summary`               | Generate or refresh the AI summary via Hugging Face.                           |

Each handler defers to `src/server/students.ts` for Firestore-backed mutations, automatically returning to the client whether the operation used Firestore or the in-memory mock store.【

## Mock data & Firestore schema

- Mock records live in `src/data/students.ts` and are loaded into an in-memory Map on boot. Time-based fields are shifted relative to "now" for realistic recency signals.

- When Firestore is configured, `subscribeToStudents` listens for document changes and subcollection updates to hydrate the UI in realtime.

- Seed Firestore with a `students` collection that mirrors the fields in `Student` (`status`, `lastContacted`, `highIntent`, etc.) and subcollections for `timeline`, `notes`, `communications`, and `reminders`. Missing subcollections are auto-fetched on demand and merged with any arrays stored on the parent document.

##  AI summary workflow

`useStudentSummary` posts a trimmed payload to `/api/students/:id/summary`, which normalises the student data, builds a prompt, and calls the Hugging Face summarisation endpoint. Responses are cached for ten minutes per student signature and surface descriptive errors for misconfiguration or provider limits.

## Authentication & roles

- Client auth is initialised via `src/lib/firebase.ts`, using browser session persistence so advisors remain signed in until they log out.

- The UI exposes sign-in/sign-up flows, error messaging, and sign-out controls. Display names automatically derive initials and friendly labels when Firebase profiles are incomplete.

- Protect access by configuring Firebase Auth providers and tightening Firestore security rules to the collections/subcollections used here.

## Scripts & tooling

| Command         | Description                                  |
| --------------- | -------------------------------------------- |
| `npm run dev`   | Start the Next.js dev server with Turbopack. |
| `npm run build` | Produce an optimised production build.       |
| `npm run start` | Serve the production build.                  |
| `npm run lint`  | Run ESLint across the codebase.              |
