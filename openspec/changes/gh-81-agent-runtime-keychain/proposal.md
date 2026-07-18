## Why

An Orbion environment currently does not record which on-VM agent should handle chats, and wizard-generated credentials are not modeled as references with an environment-owned lifecycle. Users need to choose OpenCode or Claude Code while adding a machine and rely on OS-backed encryption so credential material never appears in the environment configuration.

## What Changes

- Add an explicit OpenCode or Claude Code runtime choice to the add-environment wizard and persist it on the environment as its default chat agent.
- Add environment credential references for SSH key passphrases and daemon session tokens while storing encrypted credential material in a dedicated OS-backed credential vault.
- Capture an optional SSH key passphrase in the wizard and transfer it only through typed IPC to the main process.
- Move wizard-created daemon session tokens into the credential vault and resolve them only in the main process when making authenticated requests.
- Delete every credential owned by an environment when that environment is removed.
- Keep browser mock mode functional with runtime persistence and no secret persistence.

## Capabilities

### New Capabilities
- `environment-agent-runtime`: Select and persist the default on-VM agent runtime for an environment.
- `environment-credential-vault`: Store environment credentials through OS-backed encryption, expose references rather than values in config, and clean them up with the environment.

### Modified Capabilities

None.

## Impact

The change affects the shared environment and wizard IPC contracts, main-process config and credential persistence, wizard orchestration, preload forwarding, renderer services and mock services, add-environment wizard UI and i18n, plus focused tests. It adds no external dependency and keeps secrets out of the renderer after wizard submission and out of the environment configuration.
