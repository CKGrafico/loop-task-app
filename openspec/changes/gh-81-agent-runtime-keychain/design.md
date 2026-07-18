## Context

The add-environment wizard already spans renderer, preload, main-process orchestration, remote installation, and `electron-store`. Session tokens and OpenCode passwords are encrypted with Electron `safeStorage`, but encrypted values currently live beside environment configuration and environments do not own explicit credential references. The app has no general chat runtime adapter yet, so the persisted environment field must be the canonical default that chat surfaces can consume without inventing runtime behavior.

## Goals / Non-Goals

**Goals:**

- Make the wizard require an OpenCode or Claude Code runtime and persist that runtime on the environment.
- Keep all credential encryption and decryption in the Electron main process.
- Store only opaque credential references on environment records.
- Put encrypted credential payloads in a dedicated credential store backed by `safeStorage`.
- Remove environment-owned credentials when the environment is removed.
- Preserve browser mock behavior and migrate existing encrypted session tokens without exposing plaintext.

**Non-Goals:**

- Implement a new chat protocol, model picker, or Claude server adapter.
- Add password-based SSH automation or expose passphrases to child-process arguments.
- Add config synchronization or move existing non-wizard OpenCode endpoint settings.
- Install both agent runtimes when the user selected only one.

## Decisions

### Persist a discriminated runtime on each environment

Add `AgentRuntime = "opencode" | "claude"` and an `agentRuntime` field to `Environment`. New wizard-created environments always set it. Legacy environments default to OpenCode when sanitized for the renderer so existing behavior remains stable. The runtime is also carried through the wizard start contract, allowing remote service selection to make the chosen runtime mandatory while leaving unrelated tools optional.

Alternative considered: infer the runtime from installed tools. This is ambiguous when both tools exist and cannot express a user default.

### Use environment-owned opaque credential references

Add a `credentialRefs` object to the internal and shared environment model. References are random opaque IDs and reveal neither credential values nor key names. A dedicated `electron-store` named for credentials holds `{ encryptedValue }` records. `safeStorage` encrypts before write and decrypts only for main-process consumers.

Alternative considered: keep ciphertext in the main config store. Although encrypted, that makes environment config carry credential material rather than references and conflicts with later config-sync requirements.

### Route wizard credentials in one typed start payload

Replace the positional wizard start parameters with a typed `VmWizardStartOptions` object containing target, name, reach method, direct URL, selected runtime, and optional SSH key passphrase. The renderer retains the passphrase only as component state, preload forwards it directly, and main never emits it in progress events or results.

Alternative considered: add a separate credential IPC channel. A single wizard command reduces lifetime and avoids a second partially completed state.

### Store credentials only after the environment has an owner

The wizard creates the environment, stores generated session tokens and an optional passphrase under that environment, then returns success. If OS encryption is unavailable, credential persistence fails without a plaintext fallback and the newly created environment is removed to avoid a successful but non-compliant result.

### Clean up by ownership

Environment removal enumerates its credential references, deletes those vault entries, removes legacy session-token entries, then removes the environment record. This keeps deletion deterministic and avoids scanning or guessing credential names.

### Migrate legacy session tokens lazily

When a legacy token exists without a reference, the main process decrypts it, writes it to the credential vault, attaches the reference, and deletes the legacy record. If migration cannot encrypt, the legacy encrypted token remains usable and is never downgraded to plaintext.

## Risks / Trade-offs

- [Risk] `safeStorage` can be unavailable on Linux without a secret service. -> Reject new credential writes and show a localized wizard error; never fall back to plaintext.
- [Risk] A crash between environment creation and credential attachment could leave an environment without credentials. -> Roll back the environment when credential storage fails; serialized config mutations reduce the window.
- [Risk] Captured SSH passphrases are not currently consumed because SSH runs in batch mode. -> Store the credential for future authorized SSH integration, but do not place it in process arguments or environment variables.
- [Risk] Existing chat code does not yet dispatch to a general runtime adapter. -> Define the environment field as the canonical default and avoid fabricating an unsupported Claude transport.
