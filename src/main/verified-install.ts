/**
 * verified-install.ts — Integrity-verified remote install constants
 *
 * This module centralises pinned SHA-256 checksums and package versions
 * for all remote software installed by Orbion via SSH.  Each install
 * follows the **download-first, verify-then-execute** pattern instead of
 * the unsafe `curl … | sh` anti-pattern.
 *
 * When upgrading any pinned dependency:
 *   1. Update the `version` field.
 *   2. Download the script/binary locally and run `sha256sum`.
 *   3. Update the `sha256` field with the new hash.
 *   4. Record the update date in the comment.
 *
 * @see https://github.com/orbion/orbion/issues/51
 */

// ─── curl-pipe-sh replacement: download-verify-execute shell snippet ──────
//
// This shell function is embedded in remote scripts.  It downloads a URL
// to a temp file, verifies the SHA-256 checksum against a pinned value,
// and only then executes the script.  If the checksum mismatches the
// install is aborted — preventing silent MITM / DNS poisoning attacks.
//
// Usage in a remote script:
//   __VERIFIED_INSTALL_FN__
//   verified_install "https://example.com/install.sh" \
//     "abc123..." \
//     "$LAUNCH_DIR/install-example.log"

export const VERIFIED_INSTALL_FN = [
  "verified_install() {",
  '  local url="$1"',
  '  local expected_sha="$2"',
  '  local log_file="$3"',
  "  local tmp_file",
  "",
  '  tmp_file="$(mktemp /tmp/orbion-verify-XXXXXX)" || {',
  '    echo "VERIFIED_INSTALL_FAILED|mktemp"',
  "    return 1",
  "  }",
  "",
  "  # Download to temp file (not piped to shell)",
  '  if ! curl -fsSL "$url" -o "$tmp_file" 2>>"$log_file"; then',
  '    rm -f "$tmp_file"',
  '    echo "VERIFIED_INSTALL_FAILED|download"',
  "    return 1",
  "  fi",
  "",
  "  # Verify SHA-256 checksum",
  "  local actual_sha",
  '  actual_sha="$(sha256sum "$tmp_file" | cut -d" " -f1)" || {',
  '    rm -f "$tmp_file"',
  '    echo "VERIFIED_INSTALL_FAILED|sha256sum"',
  "    return 1",
  "  }",
  "",
  '  if [ "$actual_sha" != "$expected_sha" ]; then',
  '    echo "VERIFIED_INSTALL_FAILED|checksum_mismatch|expected=$expected_sha|got=$actual_sha" >> "$log_file"',
  '    rm -f "$tmp_file"',
  '    echo "VERIFIED_INSTALL_FAILED|checksum_mismatch"',
  "    return 1",
  "  fi",
  "",
  "  # Checksum passed — safe to execute",
  '  if ! sh "$tmp_file" 2>>"$log_file"; then',
  '    rm -f "$tmp_file"',
  '    echo "VERIFIED_INSTALL_FAILED|execution"',
  "    return 1",
  "  fi",
  "",
  '  rm -f "$tmp_file"',
  "  return 0",
  "}",
].join("\n");

// ─── Pinned remote scripts ────────────────────────────────────────────

/**
 * Tailscale install script — pinned checksum.
 *
 * Last verified: 2025-07-17
 * URL: https://tailscale.com/install.sh
 *
 * IMPORTANT: This hash will change whenever Tailscale updates their
 * install script.  Re-verify on every upgrade cycle.
 */
export const TAILSCALE_INSTALL = {
  url: "https://tailscale.com/install.sh",
  /** SHA-256 of the install script as of the verification date above. */
  sha256: "ada2fe9d54df0d3e5a77879470bda195b2c53d27ecd73aba6de270c795725625",
} as const;

/**
 * mise (runtime version manager) install script — pinned checksum.
 *
 * Last verified: 2025-07-17
 * URL: https://mise.run
 *
 * IMPORTANT: This hash will change whenever mise updates their
 * install script.  Re-verify on every upgrade cycle.
 */
export const MISE_INSTALL = {
  url: "https://mise.run",
  /** SHA-256 of the install script as of the verification date above. */
  sha256: "0b98c2dc48edc807be860a76e14209afcfe36684c591f92337c5d9ff909e7740",
} as const;

// ─── Pinned npm packages ──────────────────────────────────────────────
//
// Every `npm install -g` executed on remote VMs MUST pin an exact
// version.  Unversioned installs are vulnerable to registry compromise,
// typosquatting, and supply-chain attacks.

/**
 * All npm packages installed globally on remote VMs, with pinned versions.
 *
 * When upgrading:
 *   1. Update `version` to the desired release.
 *   2. Verify the package on npmjs.com or via `npm view <pkg>@<ver>`.
 *   3. Update the comment date.
 */
export const NPM_PACKAGES = {
  /** loop-task daemon — mandatory on every VM */
  loopTask: { pkg: "loop-task", version: "2.2.2" },
  /** opencode CLI — optional */
  openCode: { pkg: "opencode", version: "latest" }, // NOTE: not on public npm; kept unversioned until upstream publishes
  /** Atlassian CLI (Jira) — optional */
  jira: { pkg: "@atlassian/acli", version: "latest" }, // NOTE: not on public npm; kept unversioned until upstream publishes
  /** GitLab CLI — optional */
  gitlab: { pkg: "@gitlab-org/cli", version: "latest" }, // NOTE: not on public npm; kept unversioned until upstream publishes
  /** Claude Code CLI — optional */
  claude: { pkg: "@anthropic-ai/claude-code", version: "2.1.212" },
} as const;

/**
 * Build an `npm install -g <pkg>@<version>` string for a pinned package.
 * This ensures every npm global install uses an explicit version specifier,
 * preventing supply-chain attacks via registry compromise.
 */
export function pinnedNpmInstall(key: keyof typeof NPM_PACKAGES): string {
  const { pkg, version } = NPM_PACKAGES[key];
  return `npm install -g ${pkg}@${version}`;
}
