# Design: Pairing and Scoped Sessions

## Architecture

### Data Model

**SessionToken** (stored encrypted):
- `accessToken: string` — bearer token from daemon
- `scope: SessionScope` — "read-only" | "operate" | "admin"
- `expiresAt: number | null` — epoch ms or null for no expiry

**EnvironmentAuthState** (persisted on Environment):
- `unauthenticated` — daemon has no auth, works without tokens
- `paired` — has a valid encrypted session token
- `blocked` — token expired/revoked, needs re-pair
- `unknown` — not yet determined

### Storage

- Tokens encrypted via `safeStorage.encryptString()` → base64 stored in `sessionTokens` map keyed by environment ID
- Cleartext never written to disk
- On decrypt failure (e.g. OS credential reset), token is dropped and environment goes `blocked`

### Exchange Flow

1. User enters URL or pairing link in AddEnvironmentModal
2. App probes daemon with GET /api/loops
3. If 401 → show pairing step
4. User enters code from daemon + selects scope
5. POST /api/pair/exchange { code, scope } → { accessToken, scope, expiresAt }
6. Token encrypted and stored; environment marked `paired`

### Request Wiring

- `handleApiRequest` resolves environment ID from base URL
- Looks up session token → attaches `Authorization: Bearer <token>` header
- On 401 response: removes token, sets environment `blocked`, sends status change event
- Connection supervisor probes also carry auth headers — 401 classified as `blocking` (existing)

### URL Fragment Convention

Pairing links like `http://host:8845#code=A3F-K9M` carry the code in the fragment so it never reaches server logs. The AddEnvironmentModal parses pairing URLs extracting baseUrl + code from fragment.

### Re-pair Flow

- Sidebar shows "pair again" badge on `blocked` environments
- Clicking opens AddEnvironmentModal in pairing step, pre-filled with the environment's URL
- After successful re-pair, environment returns to `paired` state
