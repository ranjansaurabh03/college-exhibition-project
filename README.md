# AI Co-Founder: From Idea to MVP

**Your technical partner for building products.** Not a single-purpose tool you prompt, but a co-founder that asks the
right question at every stage of the 0-to-1 journey, pushes back on vague ideas, cuts scope, and then generates real
starter code for what is left.

- **Live app:** https://ranjansaurabh03.github.io/college-exhibition-project/
- **Project report:** https://ranjansaurabh03.github.io/college-exhibition-project/#/report (architecture, how the
  co-founder decides, measured performance, tests, SWOT, limitations)

No sign-up and no API key needed. Projects are saved in your browser.

## The four stages

| Stage | The co-founder asks | You walk away with |
| --- | --- | --- |
| **1. Ideation** | Who exactly is the user? What is the pain, how often, how bad? How is it solved today? Does it need to exist? | Guided interview, idea scorecard, a linted one-liner: “[Product] helps [user] do [outcome] by [approach]” |
| **2. Validation** | Would strangers sign up? Is that polite interest or genuine intent? Will anyone pay? | Landing page (downloadable HTML), outreach kit, survey, signal report, reply classifier |
| **3. Scoping** | Does this feature change whether someone pays? Is it in the one core flow? Can v1 ship in 3 weeks? | Keep / later / cut board, timeline vs target, smallest shippable unit, MVP boundary |
| **4. Building** | What is the one core object? Which routes and pages are needed? | Architecture map and a generated MERN starter (Express + Mongoose + JWT + React) as a .zip |

## Demo script (3 minutes)

1. Open the live app and click **Try the demo project**. It loads *CanteenQ*, a campus canteen pre-ordering idea, with all
   four stages filled in.
2. **Ideation:** show the scorecard (92/100) and the one-liner. Then go to **All ideas**, create a new idea, click
   **Interview me** and answer “students” to *Who exactly is the user?*. The co-founder pushes back: “Students is an
   audience, not a user.” Give a sharper answer and watch the canvas fill in.
3. **Validation:** the landing page is generated from the one-liner (try **Open**). In **Signals**, show the
   benchmarks and the reply classifier separating polite interest from genuine intent.
4. **Scoping:** click **Add the usual wish-list**, answer the pay test for a few features and watch most of them get
   cut. Point at the timeline check against the 3-week target.
5. **Building:** change a field in the data model and the generated code updates live. Click **Download .zip**: it is a
   runnable MERN project.
6. Finish on the **Project report**: measured bundle sizes, test results from CI, and the corrected SWOT.

## Architecture

```
┌──────────────────────────────┐      ┌───────────────────────────┐      ┌──────────────┐
│ React SPA (GitHub Pages)     │ REST │ Node.js + Express 5 API   │      │ MongoDB      │
│ • Vite 8, React 19, TS       │ (not │ • JWT auth, bcrypt        │      │ • users      │
│ • Tailwind 4, React Router 8 │ yet) │ • /api/projects CRUD      │ ───▶ │ • projects   │
│ • Zustand (localStorage)     │      │ • /api/ai/chat → Claude   │      │   (flexible  │
│ • Rule-based co-founder      │      │   (SSE stream, rate-      │      │   sub-docs)  │
│   engine (pure functions)    │      │   limited, daily cap)     │      │              │
└──────────────────────────────┘      └───────────────────────────┘      └──────────────┘
        live today                          in /server, tested                Atlas when hosted
```

The deployed site runs the co-founder engine entirely in the browser, so the demo always works. The back end in
`/server` (accounts, cloud projects, Claude-powered chat) is built and tested, but **the live site does not call it
yet**: hosting the API (see below) and then wiring the client to it are two separate next steps.

### The co-founder engine

On the live site the co-founder is a transparent rule engine in `client/src/lib/engine/`, not a language model. Every
judgement traces to a rule, so it is explainable, testable and never makes things up:

- `ideation.ts`: vague-user detection, the idea scorecard, one-liner lint, the guided interview
- `validation.ts`: landing copy and HTML, outreach kit, survey, signal benchmarks, reply classifier
- `scoping.ts`: the pay test (keep / later / cut), timeline with a 25% buffer, scope pushbacks
- `codegen.ts`: generates the MERN starter from the scoped MVP and data model

## Project structure

```
client/                    React app (deployed to GitHub Pages)
  src/lib/engine/          co-founder rules + unit tests
  src/pages/               Landing, Dashboard, Workspace (+ stages/), Report
  vite.config.ts           build, plus build-stats.json for the report
server/                    Express + MongoDB + Claude API
  src/routes/              auth, projects, ai
  src/ai/                  system prompt and Claude streaming client
  test/                    API tests (in-memory MongoDB) + real-SDK request test
tools/verify-starter/      boots the generated starter against MongoDB in CI
.github/workflows/         deploy.yml (test → build → Pages), ci.yml (API + generated code)
render.yaml                one-click back-end deploy on Render
```

## Run it locally

Requirements: Node.js 22.22+ (24 recommended).

```bash
# Web app → http://localhost:5173
cd client
npm install
npm run dev

# Tests (engine unit tests)
npm test
```

```bash
# API → http://localhost:8080 (needs MongoDB: local, or a free Atlas cluster)
cd server
cp .env.example .env      # set MONGODB_URI and JWT_SECRET; ANTHROPIC_API_KEY is optional
npm install
npm run dev

# API tests (start their own in-memory MongoDB, no setup needed)
npm test
```

## Deployment

- **Web app:** every push to `main` runs the tests, builds the client and publishes it to GitHub Pages
  (`.github/workflows/deploy.yml`).
- **API (optional):**
  1. Create a free MongoDB Atlas cluster and copy its connection string.
  2. On Render: **New → Blueprint**, pick this repository (`render.yaml` is detected) and fill in `MONGODB_URI` and,
     optionally, `ANTHROPIC_API_KEY`.
  3. Check `https://<your-service>.onrender.com/api/health` returns `{ "ok": true, "db": true }`.
  4. Hosting alone doesn’t change the live site: the client still needs to be connected to the API (login, cloud
     projects and the chat panel) before it uses it.

The Claude chat uses `claude-opus-5` by default (`CLAUDE_MODEL` to change), streams replies over server-sent events, and
is protected by a per-IP rate limit and a daily cap (`AI_DAILY_LIMIT`) so a public deployment can’t drain the API credit.

## Testing

| Suite | What it covers | Where |
| --- | --- | --- |
| Engine unit tests (Vitest) | scoring, vagueness, lint, signals, classifier, pay test, timeline, code generation | `client/src/lib/engine/*.test.ts` |
| API tests (Vitest + Supertest) | auth, owner-only project CRUD, validation, SSE chat, refusals, daily cap, real SDK request | `server/test/` |
| Generated starter | the generated CanteenQ API passes 24 end-to-end checks against MongoDB; its React app builds | `tools/verify-starter/`, CI |

## Limitations

- The live co-founder is rule-based: explainable and offline, but not an open-ended conversation partner.
- Signal benchmarks are rules of thumb for early tests (the Sean Ellis 40% threshold is the established one).
- The reply classifier is keyword-based and English-only.
- On the static site, projects live in the browser; use Export/Import to move them.

## Credits

Built by Saurabh Ranjan for the College Project Exhibition 2026. References: Sean Ellis’ product–market fit survey;
Rob Fitzpatrick, *The Mom Test*.
