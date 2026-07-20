## Context

Two shell script fragments in `src/main/` perform identical Node.js binary detection but with divergent variable naming, quoting, and a redundant guard. The probe script (`ssh-probe.ts`) uses `node_path` with `${HOME}/` interpolation. The launch script (`ssh-launch.ts`) uses `NODE_BIN` with `"$HOME/"` quoting and contains `if [ -z "$NODE_BIN" ] || [ "$NODE_BIN" = "" ]` where the second condition is redundant. Both scripts scan the same five version-manager directories (nvm, fnm, asdf, mise, volta) in the same order.

## Goals / Non-Goals

**Goals:**
- Single source of truth for Node.js detection logic across probe and launch
- Identical resolution order guaranteed: PATH node first, then version-manager scan in fixed order
- Fix the redundant/broken guard in the launch script
- Consistent quoting style across both scripts
- Test that confirms both scripts produce the same `node_path`/`NODE_BIN` given same filesystem

**Non-Goals:**
- Changing the detection order or adding new version managers
- Modifying the probe output format (`NODE_FOUND|path|version`) or launch output format
- Adding Node.js installation logic (that stays in `MISE_INSTALL_SCRIPT`)
- Refactoring other duplicated constants (loop-task probe, daemon probe, tools probe)

## Decisions

1. **New file `src/main/ssh-scripts.ts`** over embedding in `ssh-probe.ts`
   - Rationale: The script is shared between probe and launch, both in `src/main/`. Neither file "owns" it more than the other. A dedicated module avoids circular-import concerns and makes the shared boundary explicit.
   - Alternative considered: Export from `ssh-probe.ts`. Rejected because launch already imports `sshExec` from probe; adding another import would tighten coupling between modules that should remain independent peers.

2. **`NODE_RESOLVE_SCRIPT` produces a shell variable `node_path`**
   - The shared script sets `node_path` upon completion. Consumers compose their own output on top: probe emits `NODE_FOUND|path|version` or `NODE_NOT_FOUND`; launch emits `NODE_FOUND|path|version` or `INSTALL_NODE_FIRST`.
   - Rationale: Minimal contract. The shared fragment does one thing (find node), consumers add their own semantics.

3. **Variable naming: `node_path` in the shared script**
   - Both consumers already use different names (`node_path` in probe, `NODE_BIN` in launch). The shared script picks one. Choosing `node_path` because it is the existing probe convention and is more descriptive (the result is a path, not a generic "bin").
   - Launch script will assign `NODE_BIN="${node_path}"` after embedding, preserving its downstream variable name.

4. **Quoting style: `${HOME}/...` without double-quotes inside the heredoc/template literal**
   - In a JS template literal, `\"\$HOME\"` and `\${HOME}` produce identical bash runtime behavior. Normalize to `\${HOME}/...` for consistency with the existing probe style.

5. **Guard fix: remove `[ "$NODE_BIN" = "" ]` redundancy**
   - `[ -z "$NODE_BIN" ]` is sufficient. The `|| [ "$NODE_BIN" = "" ]` clause is logically identical to the first test and misleading.

## Risks / Trade-offs

- **Behavior change risk**: The shared script always prefers PATH node first, then falls back to version managers. This matches current probe behavior but subtly changes the launch script, which previously only scanned version managers if PATH node was missing or empty. In practice, the original guard was equivalent (`[ -z ] || [ = "" ]` is always the same as `[ -z ]`), so behavior is unchanged.
- **Shell script composition subtlety**: Embedding `NODE_RESOLVE_SCRIPT` via template interpolation must preserve indentation and `set -e` semantics. The shared script MUST NOT include `set -e` (the caller controls error handling). Test will validate composed output.
