# Spec: Pairing and Session Token Management

## Capability: pairing

### Types

```typescript
type SessionScope = "read-only" | "operate" | "admin"

interface SessionToken {
  accessToken: string
  scope: SessionScope
  expiresAt: number | null
}

type EnvironmentAuthState = "unauthenticated" | "paired" | "blocked" | "unknown"

interface PairingCodeExchangeResponse {
  ok: boolean
  token?: SessionToken
  error?: string
}
```

### IPC Channels

- `config:exchangePairingCode(baseUrl, code, scope?) → PairingCodeExchangeResponse`
- `config:removeSessionToken(environmentId) → void`

### Storage

- `sessionTokens: Record<environmentId, EncryptedSessionToken>` in electron-store
- Encrypted via safeStorage; never plaintext on disk
- On token expiry (checked at read time): auto-remove and set `authState = "blocked"`

### Exchange

- POST `{baseUrl}/api/pair/exchange` with `{ code, scope }`
- On success: encrypt and store token, set `authState = "paired"`
- On failure: return error to UI

### Request Wiring

- All daemon HTTP requests (REST + SSE) attach `Authorization: Bearer <token>` if token exists
- 401 responses: remove token, set `authState = "blocked"`, no retry loop
- Probes (connection supervisor) also carry auth headers

### UI

- AddEnvironmentModal: pairing step with code + scope selector
- Sidebar: "no auth" badge on unauthenticated, "pair again" action on blocked
- Re-pair flow re-opens modal in pairing mode
