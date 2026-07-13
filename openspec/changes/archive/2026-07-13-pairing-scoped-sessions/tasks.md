# Tasks: Pairing and Scoped Sessions

## Implementation

- [x] Add SessionScope, SessionToken, PairingCodeExchangeResponse, EnvironmentAuthState types to shared/ipc.ts
- [x] Add authState field to Environment interface
- [x] Add exchangePairingCode and removeSessionToken to ConfigBridge
- [x] Implement encrypted token storage in config-store.ts (storeSessionToken, getSessionToken, removeSessionToken)
- [x] Implement exchangePairingCode in config-store.ts (POST /api/pair/exchange)
- [x] Add sessionTokens to ConfigSchema defaults
- [x] Wire bearer token into handleApiRequest (Authorization header)
- [x] Wire bearer token into handleStreamSubscribe
- [x] Handle 401 responses: remove token, set authState blocked, no retry
- [x] Add IPC handlers for exchangePairingCode and removeSessionToken
- [x] Update makeProbe to accept environmentId and attach auth headers
- [x] Update EndpointHealthTracker to pass environmentId to probes
- [x] Expose exchangePairingCode and removeSessionToken in preload bridge
- [x] Add pairing step to AddEnvironmentModal (code input, scope selector)
- [x] Parse pairing URLs (code in fragment, not query string)
- [x] Show "no auth" badge in Sidebar for unauthenticated environments
- [x] Show "pair again" action in Sidebar for blocked environments
- [x] Add re-pair flow (re-opens modal in pairing mode)
- [x] Add CSS for scope-selector and repair-btn
- [x] Typecheck passes
