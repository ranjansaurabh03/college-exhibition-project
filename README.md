# AI Co-Founder: From Idea to MVP

**Your technical partner for building products.** Not a single-purpose tool you prompt, but a co-founder that asks the
right question at every stage of the 0-to-1 journey, pushes back on vague ideas, cuts scope, and then generates real
starter code for what is left.

- **Live app:** https://ai-cofounder-indol.vercel.app
- **Project report:** https://ai-cofounder-indol.vercel.app/#/report (architecture, how the co-founder decides,
  measured performance, tests, SWOT, limitations)

No sign-up needed. Type an idea and Google Gemini drafts the first canvas in a few seconds; a rule engine in the
browser checks every answer. Projects are saved in your browser.

## The four stages

| Stage | The co-founder asks | You walk away with |
| --- | --- | --- |
| **1. Ideation** | Who exactly is the user? What is the pain, how often, how bad? How is it solved today? Does it need to exist? | AI-drafted canvas, guided interview, idea scorecard, a linted one-liner: “[Product] helps [user] do [outcome] by [approach]” |
| **2. Validation** | Would strangers sign up? Is that polite interest or genuine intent? Will anyone pay? | Landing page (downloadable HTML), outreach kit, survey, signal report, reply classifier |
| **3. Scoping** | Does this feature change whether someone pays? Is it in the one core flow? Can v1 ship in 3 weeks? | Keep / later / cut board, timeline vs target, smallest shippable unit, MVP boundary |
| **4. Building** | What is the one core object? Which routes and pages are needed? | Architecture map and a generated MERN starter (Express + Mongoose + JWT + React) as a .zip |

On every stage, **Draft with AI** asks Gemini to fill the empty fields (never overwriting yours, with an Undo), and the
**Ask AI** panel answers questions with the current canvas as context.

## Demo script (3 minutes)

1. Open the live app, type an idea into the box (or click a chip such as **Laundry queue**) and press Enter. Gemini
   drafts the Ideation canvas and names the product; the scorecard and one-liner update as it lands.
2. In the co-founder panel, click **What is the weakest part of my idea?** The answer streams in and refers to your
   own canvas.
3. **Validation:** click **Draft with AI** for the landing-page copy, then **Open** the generated page. In
   **Signals**, show the benchmarks and the reply classifier separating polite interest from genuine intent.
4. **Scoping:** draft the features, answer the pay test and watch the timeline check against the 3-week target.
5. **Building:** draft the data model; the generated code updates live. **Download .zip** gives a runnable MERN
   project.
6. Press **Ctrl K** (⌘K on a Mac) for the command palette, then finish on the **Project report**: live status,
   measured bundle sizes, test results and the corrected SWOT.

For a finished example, **Load demo project** on the Workspace page opens *CanteenQ* with all four stages filled in.

## Architecture

```
┌──────────────────────────────┐ same  ┌───────────────────────────────┐      ┌──────────────────┐
│ React SPA (Vercel CDN)       │ origin│ Express 5 API                 │ ───▶ │ Google Gemini    │
│ • Vite 8, React 19, TS       │ /api  │ (Vercel serverless function)  │      │ 3.5 Flash Lite   │
│ • Tailwind 4, React Router 8 │ ────▶ │ • /api/ai/chat  (SSE stream)  │      │ + Flash fallback │
│ • Zustand (localStorage)     │       │ • /api/ai/draft (JSON schema) │      └──────────────────┘
│ • Rule engine (pure funcs)   │       │ • /api/auth, /api/projects    │ ───▶ MongoDB Atlas
│ • Command palette, toasts    │       │ • rate limit + daily budget   │      (optional: cloud sync)
└──────────────────────────────┘       └───────────────────────────────┘
```

One Vercel project serves both halves: the client as static files and `api/index.js` (the Express app from `/server`)
as a serverless function on the same domain. The Gemini key exists only on the server. If the AI is unavailable or the
daily budget is spent, every stage keeps working with the rule engine. Cloud sync switches on when `MONGODB_URI` is set.

### Who decides what

- **Gemini writes.** `server/src/ai/` holds the system prompt, the per-stage JSON schemas and the streaming client
  (`@google/genai`, Interactions API). Drafts are clipped and checked on the server (`drafts.js`), and the browser fills
  only empty fields (`client/src/lib/drafts.ts`).
- **Rules judge.** `client/src/lib/engine/` is a transparent rule engine, so every score and warning is explainable
  and tested:
  - `ideation.ts`: vague-user detection, the idea scorecard, one-liner lint, the guided interview
  - `validation.ts`: landing copy and HTML, outreach kit, survey, signal benchmarks, reply classifier
  - `scoping.ts`: the pay test (keep / later / cut), timeline with a 25% buffer, scope pushbacks
  - `codegen.ts`: generates the MERN starter from the scoped MVP and data model

## Project structure

```
api/index.js               Vercel entry: exports the Express app
vercel.json                install, test, build and routing for Vercel
client/                    React app
  src/lib/engine/          co-founder rules + unit tests
  src/pages/               Landing, Dashboard, Workspace (+ stages/), Report
  vite.config.ts           build, plus build-stats.json for the report
server/                    Express + MongoDB + Gemini
  src/routes/              auth, projects, ai
  src/ai/                  system prompt, draft schemas, Gemini streaming client
  test/                    API tests (in-memory MongoDB) + real-SDK request test
tools/verify-starter/      boots the generated starter against MongoDB in CI
.github/workflows/         deploy.yml (GitHub Pages mirror), ci.yml (API + generated code)
render.yaml                alternative: the API alone on Render
```

## Run it locally

Requirements: Node.js 22.22+ (24 recommended) and a free Gemini API key from https://aistudio.google.com/apikey.

```bash
# API → http://localhost:8080
cd server
cp .env.example .env      # set GEMINI_API_KEY; MONGODB_URI and JWT_SECRET are optional
npm install
npm run dev

# API tests (they start their own in-memory MongoDB and a fake Gemini, no setup needed)
npm test
```

```bash
# Web app → http://localhost:5173, talking to the local API
cd client
npm install
VITE_API_URL=http://localhost:8080 npm run dev   # leave VITE_API_URL unset for the rule engine only

# Engine unit tests
npm test
```

## Deployment

- **Vercel (main site):** `vercel.json` installs both packages, runs the client tests, builds the client with
  `VITE_API_URL=same-origin` and deploys `api/index.js` as a function. Environment variables: `GEMINI_API_KEY`
  (secret), `JWT_SECRET`, `CLIENT_ORIGIN`, and optionally `MONGODB_URI`, `GEMINI_MODEL`, `AI_DAILY_LIMIT`.
  Deploy with `npx vercel deploy --prod`.
- **GitHub Pages (mirror):** every push to `main` runs the tests and publishes the client
  (`.github/workflows/deploy.yml`). With the repository variable `VITE_API_URL` set to the Vercel URL, the mirror
  uses the same API.

The AI uses `gemini-3.5-flash-lite` by default (about a second to the first token) and falls back to
`gemini-3.5-flash` if the first model is busy. A per-IP rate limit and a daily cap (`AI_DAILY_LIMIT`, counted in
MongoDB when it is connected) keep a public deployment inside the free tier.

## Testing

| Suite | What it covers | Where |
| --- | --- | --- |
| Client unit tests (Vitest) | scoring, vagueness, lint, signals, classifier, pay test, timeline, code generation, merging AI drafts | `client/src/lib/**/*.test.ts` |
| API tests (Vitest + Supertest) | auth, owner-only project CRUD, sync conflicts, validation, SSE chat, drafts, fallback model, daily cap, the real SDK request | `server/test/` |
| Generated starter | the generated CanteenQ API passes 24 end-to-end checks against MongoDB; its React app builds | `tools/verify-starter/`, CI |

## Limitations

- Gemini’s drafts are hypotheses to check, not research; the rule checks and real interviews still have to confirm them.
- The AI runs on a free-tier key with a daily budget; when it runs out, AI features pause and the rule engine keeps working.
- Signal benchmarks are rules of thumb for early tests (the Sean Ellis 40% threshold is the established one).
- The reply classifier is keyword-based and English-only.
- Without `MONGODB_URI`, projects live in the browser; use Export/Import to move them.

## Credits

Built by Saurabh Ranjan for the College Project Exhibition 2026. References: Sean Ellis’ product–market fit survey;
Rob Fitzpatrick, *The Mom Test*.
