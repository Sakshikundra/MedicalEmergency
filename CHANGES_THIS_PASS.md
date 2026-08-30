# Fixes & Additions — This Pass

A follow-up pass over the audited codebase. Everything below was implemented
and verified by actually running the backend (mock DB mode) and hitting the
endpoints with curl, plus a real `npx next build` for the frontend.

## New: Hospital OTP consent UI (was backend-only before)
- `frontend/pages/hospital/request-access.js` — staff enter the patient's
  Pulse ID + their own details, request access, then enter the OTP the
  patient shares with them. Shows the mock OTP inline when `SMS_PROVIDER=mock`.
- `frontend/pages/hospital/patient/[pulseId].js` — full record view once
  consent is granted (`?consentId=...`), plus a doctor upload form for new
  treatment records.
- `frontend/pages/emergency/[pulseId].js` — added a "Hospital Staff: Request
  Full Access" button linking into the flow above.

## New: SOS + emergency card wired into the UI (backend already had these)
- `frontend/pages/emergency/[pulseId].js` — added a "Send SOS Alert" button
  (uses browser geolocation if available, falls back to no location) and a
  "Download Emergency Card" button (hits the existing PDF endpoint).

## Fixed: Gemini model names were dead (confirmed via `model_test_log.txt`
all returning 404)
- `backend/services/llmService.js` — `gemini-1.5-flash` / `gemini-pro` →
  `gemini-2.5-flash` / `gemini-2.0-flash`. Real AI analysis will actually run
  now instead of always silently falling back to mock data.

## Fixed: mock DB query builder bugs (`backend/utils/mockDb.js`)
These only bite in mock-DB / demo mode (i.e. whenever MongoDB isn't
connected, which is the default in this zip):
- `.sort()` and `.limit()` on `find()` were no-ops — now actually sort
  (Mongoose-style `{field: 1|-1}` or `"-field"`) and slice.
- `.findOne().sort()` didn't exist at all — crashed the emergency SOS route
  (`TypeError: ...findOne(...).sort is not a function`). Now implemented.
- Consent documents didn't get `isOtpValid()` / `isAccessValid()` methods in
  mock mode, so OTP expiry and access-duration checks were silently skipped.
  Now added, mirroring `backend/models/Consent.js`.
- `verificationAttempts` was `undefined + 1 = NaN` on first wrong OTP, so
  "attempts remaining" always showed 3 no matter how many wrong tries.
  Fixed in both the mock doc defaults and `backend/routes/hospital.js`.

## Fixed: errors from public (non-login) API calls were swallowed
- `frontend/lib/api.js` — `hospitalAPI` and `emergencyAPI` use raw axios
  (no auth token needed), which meant the actual backend error message
  (e.g. "Invalid OTP") never reached the UI, only a generic Axios error.
  Added `unwrapPublicError()` so `err.message` / `err.attemptsRemaining`
  work the same way they do for the authenticated `api` instance.

## Fixed: SOS message showed "Location: [object Object]"
- `backend/services/smsService.js` — now formats `{lat, lng}` into a Google
  Maps link instead of string-interpolating the raw object.

## Fixed: `npm run seed` crashed (missing file)
- Added `backend/utils/seedData.js` — connects to a real MongoDB (not the
  mock DB, which already ships demo users) and creates one demo patient with
  a sample record.

## Not done in this pass (still open)
- `LICENSE` and `walkthrough.md`, referenced by README/SETUP but missing
  from the zip.
- Real SMS (Twilio), blockchain audit log, multi-language — all still just
  "Future Enhancements" in the README, unchanged.
- No automated test suite (only ad-hoc scripts: `test-db.js`,
  `test-register.js`, `check_models.js`).

---

## 🆕 RAG (Retrieval-Augmented Generation) — added this pass

The AI pipeline before this only analyzed one uploaded document at a time,
in isolation. This adds cross-record context on top of it.

### New: `backend/services/ragService.js`
- Chunks each analyzed record into semantic pieces (diagnoses, medications,
  allergies, summary, raw text), embeds each chunk, and stores the
  embeddings directly on the `MedicalRecord` doc (`ragChunks` field) —
  no separate vector DB needed, works identically in mock-DB and real
  MongoDB mode.
- Uses `gemini-embedding-001` for real embeddings (checked current model
  docs — `text-embedding-004` was deprecated Jan 14, 2026, same mistake
  as the earlier `gemini-pro` bug, avoided this time) with a deterministic
  hashed-vector mock fallback when no API key is configured, so the whole
  pipeline is testable without a real key.
- `retrieveRelevantChunks(userId, question)` — cosine-similarity top-k
  search, **always scoped to a single userId**. This is the patient-
  isolation enforcement point.
- `answerFromRecords(userId, question)` — retrieves + asks Gemini to
  answer strictly from the retrieved context, explicitly instructed to
  say "not found" rather than guess (a hallucinated medical answer is
  worse than an honest non-answer).
- `checkCrossRecordInteractions()` — when a new record has medications,
  retrieves the patient's *other* records' medication chunks and asks
  Gemini to check for interactions across the full history, not just
  within the single new document. Results get appended to
  `aiAnalysis.drugInteractions` with a `[cross-record]` tag.

### New endpoints
- `POST /api/records/ask` — patient asks a question across their own
  records (authenticated, scoped to `req.user._id`).
- `POST /api/hospital/ask` — doctor asks a question during an active
  OTP-consent session (same `consentId` validation as
  `GET /api/hospital/patient/:pulseId`).

### New frontend
- `components/AskRecordsBox.jsx` — reusable Q&A widget, wired into both
  `/records` (patient) and `/hospital/patient/[pulseId]` (doctor).

### Verified live (mock DB mode)
- Uploaded 2 records with overlapping/related medications → confirmed
  `ragChunks` populated (5 chunks on first record) ✅
- `POST /api/records/ask` — asked "what medications is this patient on"
  → retrieval correctly surfaced the medication chunks from both records ✅
- `POST /api/hospital/ask` — same question, through a valid OTP-consent
  session → same correct retrieval; **blocked with 403 when tested with
  an invalid consentId** ✅
- **Patient isolation test**: registered a second, unrelated patient with
  a distinctly-named record, then asked patient 1 a broad question —
  confirmed patient 2's data never appeared in patient 1's retrieved
  sources ✅
- `npx next build` — all 13 routes compile including the new UI ✅

### Bug found + fixed while building this
`.env.example`'s actual placeholder value is `GEMINI_API_KEY=your_gemini_api_key_here`,
but `llmService.js`'s (and now `ragService.js`'s) placeholder-detection
only checked for the substrings `your_gemini_key` / `your_api_key` —
neither matches `your_gemini_api_key_here`. Result: with the untouched
`.env.example` copied straight to `.env`, the code always attempted a
real Gemini API call with a garbage key instead of skipping straight to
mock mode — functionally masked by the existing try/catch fallback, but
wasteful and, in `ragService.js`, produced a confusing "couldn't
generate an answer" message instead of the clean demo-mode one. Fixed
the placeholder check in both files.

### Not done (flagging honestly)
- Retrieval is O(records × chunks) cosine similarity computed in JS —
  fine at this app's scale (a handful of records per patient), but if
  this ever needs to scale to hundreds of records per patient, swap in
  a real vector index (MongoDB Atlas Vector Search is a natural fit
  since the app already uses MongoDB) and keep everything else the same.
- No caching of embeddings across re-runs of the same question.
- Encryption-at-rest (`encryptionService.js`), `express-validator` input
  validation, and the access-logs UI page — flagged as gaps last pass,
  still not implemented this pass; RAG took priority per your ask.
