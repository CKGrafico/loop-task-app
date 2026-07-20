/**
 * Shared shell script constants for SSH operations.
 *
 * These fragments are embedded into the probe and launch scripts
 * that Orbion executes on remote hosts over SSH.
 */

/**
 * Node.js binary resolution fragment.
 *
 * Sets `node_path` to the absolute path of the discovered `node` binary,
 * or leaves it empty when no node is found. Resolution order:
 *
 *   1. PATH-resolved `node` (via `command -v`)
 *   2. Version-manager directories (nvm, fnm, asdf, mise, volta),
 *      scanned in order, picking the latest semver match per directory
 *
 * Consumers compose their own output on top (probe: NODE_FOUND/NODE_NOT_FOUND,
 * launch: NODE_FOUND/INSTALL_NODE_FIRST).
 *
 * IMPORTANT: This fragment intentionally omits `set -e` so the caller
 * controls error-handling semantics.
 */
export const NODE_RESOLVE_SCRIPT = `
# Try PATH node first
node_path=""
if command -v node >/dev/null 2>&1; then
  node_path="$(command -v node)"
fi

# Check version managers
for manager_dir in \\
  "\${HOME}/.nvm/versions/node" \\
  "\${HOME}/.local/share/fnm/node-versions" \\
  "\${HOME}/.asdf/installs/nodejs" \\
  "\${HOME}/.local/share/mise/installs/node" \\
  "\${HOME}/.volta/tools/node"; do
  if [ -d "\${manager_dir}" ]; then
    latest="\$(find "\${manager_dir}" -maxdepth 4 -name 'node' -path '*/bin/node' 2>/dev/null | sort -V | tail -1)"
    if [ -n "\${latest}" ]; then
      node_path="\${latest}"
      break
    fi
  fi
done`;
