## ADDED Requirements

### Requirement: Single shared Node.js resolution script
The system SHALL define exactly one shell script constant (`NODE_RESOLVE_SCRIPT`) that detects the Node.js binary on a remote host. Both the SSH probe and SSH launch scripts SHALL embed this shared fragment rather than maintaining separate copies.

#### Scenario: Shared script resolves PATH node first
- **WHEN** `command -v node` succeeds on the remote host
- **THEN** the resulting `node_path` variable is set to the PATH-resolved node binary path

#### Scenario: Shared script falls back to version managers
- **WHEN** `command -v node` fails
- **THEN** the script scans version-manager directories in order: nvm, fnm, asdf, mise, volta
- **AND** sets `node_path` to the latest (by semver sort) `node` binary found in the first matching manager directory
- **AND** stops scanning once a match is found

#### Scenario: Shared script reports no node found
- **WHEN** neither PATH node nor any version-manager directory yields a `node` binary
- **THEN** the `node_path` variable remains empty after the script runs

### Requirement: Consistent resolution order across probe and launch
Both the SSH probe script and the SSH launch template SHALL use `NODE_RESOLVE_SCRIPT` as their node-detection fragment, guaranteeing identical resolution order and behavior.

#### Scenario: Probe and launch resolve the same binary
- **WHEN** a remote host has Node 16 via nvm and Node 22 via mise
- **THEN** both the probe script and the launch script resolve the same `node_path` value, with no possibility of the probe detecting a different binary than the launch

### Requirement: No redundant empty-string guard
The Node resolution logic SHALL use `if [ -z "$var" ]` alone to test for empty variables. The redundant `|| [ "$var" = "" ]` guard SHALL NOT appear.

#### Scenario: Empty check uses single condition
- **WHEN** the launch script checks whether the resolved node path is empty
- **THEN** the check is `if [ -z "$NODE_BIN" ]` with no additional `|| [ "$NODE_BIN" = "" ]` clause
