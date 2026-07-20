## MODIFIED Requirements

### Requirement: Enforce the supported Node version
Orbion SHALL require Node.js 20 or newer before installing loop-task on an SSH-reach machine. The Node detection logic in both the probe and launch scripts SHALL use a single shared `NODE_RESOLVE_SCRIPT` to guarantee consistent version resolution.

#### Scenario: Node is older than version 20
- **WHEN** the SSH probe finds Node.js below version 20
- **THEN** the wizard offers the existing Node upgrade path
- **AND** loop-task installation does not start until a reprobe confirms a supported version

#### Scenario: Probe and launch detect the same Node binary
- **WHEN** the probe script detects Node at a specific path and version
- **THEN** the launch script detects the same Node binary when run against the same remote host
- **AND** the detection logic in both scripts originates from the same `NODE_RESOLVE_SCRIPT` constant
