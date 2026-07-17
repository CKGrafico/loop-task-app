## ADDED Requirements

### Requirement: Detect platform from git remotes
The system SHALL classify a project's hosting platform by inspecting its git remote URLs. The classification MUST produce one of three values: `"github"`, `"ado"`, or `"unknown"`.

#### Scenario: GitHub remote detected
- **WHEN** `git remote -v` output contains a URL matching `github.com` (either `https://github.com/...` or `git@github.com:...`)
- **THEN** the platform SHALL be classified as `"github"`

#### Scenario: Azure DevOps remote detected
- **WHEN** `git remote -v` output contains a URL matching `dev.azure.com` or `ssh.dev.azure.com`
- **THEN** the platform SHALL be classified as `"ado"`

#### Scenario: Unknown remote
- **WHEN** `git remote -v` output contains URLs that match neither GitHub nor Azure DevOps patterns
- **THEN** the platform SHALL be reported as `"unknown"`

#### Scenario: No remotes or git not available
- **WHEN** the project directory has no git remotes, or `git` cannot be executed, or the directory does not exist
- **THEN** the platform SHALL be reported as `"unknown"`

### Requirement: Cache platform per project and instance
The system SHALL cache the detected platform in memory, keyed by environment ID and project ID. Subsequent queries for the same (environment, project) pair SHALL return the cached value without re-running git.

#### Scenario: First detection caches the result
- **WHEN** detection is triggered for a given (environmentId, projectId) pair for the first time
- **THEN** the result SHALL be cached and returned

#### Scenario: Subsequent query returns cached value
- **WHEN** a cached platform exists for the (environmentId, projectId) pair
- **THEN** the system SHALL return the cached value without executing `git remote -v` again

#### Scenario: Force re-detection
- **WHEN** detection is triggered with a `force: true` parameter for a pair that already has a cached result
- **THEN** the system SHALL re-run `git remote -v`, re-classify, update the cache, and return the new result

### Requirement: Expose platform to renderer
The system SHALL expose the cached platform to the renderer via the IPC bridge so that chat features can query it.

#### Scenario: Query cached platform from renderer
- **WHEN** the renderer calls `infra:getPlatform` with (environmentId, projectId)
- **THEN** the system SHALL return the cached `PlatformType` value or `"unknown"` if no detection has been run

### Requirement: Create-issue uses detected platform
The `create-issue` infra action SHALL prefer the cached platform when choosing which CLI to use, falling back to the current CLI-check heuristic only when no platform is cached.

#### Scenario: Cached platform is GitHub
- **WHEN** `create-issue` is called and a cached platform of `"github"` exists for the relevant project
- **THEN** the system SHALL use the `gh` CLI regardless of whether `az` is also installed

#### Scenario: Cached platform is Azure DevOps
- **WHEN** `create-issue` is called and a cached platform of `"ado"` exists for the relevant project
- **THEN** the system SHALL use the `az` CLI regardless of whether `gh` is also installed

#### Scenario: No cached platform
- **WHEN** `create-issue` is called and no platform is cached for the relevant project
- **THEN** the system SHALL fall back to the existing `checkPlatformCli()` heuristic

#### Scenario: Cached platform is unknown
- **WHEN** `create-issue` is called and the cached platform is `"unknown"`
- **THEN** the system SHALL fall back to the existing `checkPlatformCli()` heuristic, since the platform could not be determined from remotes
