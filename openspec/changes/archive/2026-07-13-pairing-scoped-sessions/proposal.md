# Proposal: Pairing and Scoped Sessions for Daemon Access

## Problem

The daemon API has no auth. While tolerable for loopback-only use, any endpoint reachable over LAN, tailnet, or a forwarded port is unsecured. Auth must land before remote-access features ship.

## Solution

Pairing-based authentication instead of static secrets:
- The daemon prints a one-time pairing code
- The app exchanges it for a session token with a scope (read-only / operate / admin) and expiry
- Tokens are stored encrypted via safeStorage (OS-native encryption)
- Every request to that environment carries the bearer token
- On 401, the environment flips to `blocked` with a "pair again" action instead of retrying forever
- Old daemons without auth keep working, flagged as `unauthenticated` in the UI

## Scope (App-side only)

- Pairing step in add-environment flow
- Code exchange → encrypted token storage
- Bearer token attachment on all daemon requests
- 401 handling → blocked state + re-pair prompt
- Pairing links carry code in URL fragment (not query string)
- Unauthenticated daemons flagged in UI

## Dependencies

- Issue #8 (safeStorage wrapper) — already landed
