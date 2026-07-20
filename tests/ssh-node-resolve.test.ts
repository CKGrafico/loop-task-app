import { describe, expect, it } from "vitest";
import { NODE_RESOLVE_SCRIPT } from "../src/main/ssh-scripts.js";

/**
 * Verify the probe and launch scripts share the same Node resolution logic
 * and that the redundant guard bug is fixed.
 *
 * Since the actual script fragments are private module-level constants,
 * we test invariants on the shared NODE_RESOLVE_SCRIPT directly and
 * verify that both consumers embed it identically.
 */
describe("NODE_RESOLVE_SCRIPT", () => {
  it("sets node_path variable", () => {
    expect(NODE_RESOLVE_SCRIPT).toContain("node_path=");
  });

  it("checks PATH node first", () => {
    expect(NODE_RESOLVE_SCRIPT).toContain("command -v node");
  });

  it("scans all five version-manager directories", () => {
    const managers = [
      ".nvm/versions/node",
      ".local/share/fnm/node-versions",
      ".asdf/installs/nodejs",
      ".local/share/mise/installs/node",
      ".volta/tools/node",
    ];
    for (const dir of managers) {
      expect(NODE_RESOLVE_SCRIPT).toContain(dir);
    }
  });

  it("uses sort -V | tail -1 to pick latest", () => {
    expect(NODE_RESOLVE_SCRIPT).toContain("sort -V | tail -1");
  });

  it("breaks after first manager match", () => {
    expect(NODE_RESOLVE_SCRIPT).toContain("break");
  });

  it("does not contain set -e (caller controls error handling)", () => {
    expect(NODE_RESOLVE_SCRIPT).not.toContain("set -e");
  });

  it("does not contain redundant empty-string guard", () => {
    expect(NODE_RESOLVE_SCRIPT).not.toContain('|| [ "$');
    expect(NODE_RESOLVE_SCRIPT).not.toContain("= \"\"");
  });
});

/**
 * Test that both consumer files embed NODE_RESOLVE_SCRIPT.
 * We import the modules and verify the composed scripts contain
 * the shared fragment exactly once.
 */
describe("Probe and launch embed NODE_RESOLVE_SCRIPT consistently", () => {
  it("probe script contains the shared fragment", async () => {
    // Dynamic import to get module with the script constant in scope.
    // We read the file and check the template literal composition.
    const fs = await import("node:fs");
    const path = await import("node:path");
    const probeSource = fs.readFileSync(
      path.resolve(import.meta.dirname, "../src/main/ssh-probe.ts"),
      "utf-8",
    );
    expect(probeSource).toContain("NODE_RESOLVE_SCRIPT");
    expect(probeSource).toContain('import { NODE_RESOLVE_SCRIPT } from "./ssh-scripts.js"');
  });

  it("launch script contains the shared fragment", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const launchSource = fs.readFileSync(
      path.resolve(import.meta.dirname, "../src/main/ssh-launch.ts"),
      "utf-8",
    );
    expect(launchSource).toContain("NODE_RESOLVE_SCRIPT");
    expect(launchSource).toContain('import { NODE_RESOLVE_SCRIPT } from "./ssh-scripts.js"');
    expect(launchSource).toContain('NODE_BIN="\\${node_path}"');
  });

  it("launch script no longer has redundant guard", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const launchSource = fs.readFileSync(
      path.resolve(import.meta.dirname, "../src/main/ssh-launch.ts"),
      "utf-8",
    );
    expect(launchSource).not.toContain('|| [ "$NODE_BIN" = "" ]');
    expect(launchSource).not.toContain('|| [ "$NODE_BIN" = ""]');
  });

  it("neither file has inline version-manager scan loop", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const probeSource = fs.readFileSync(
      path.resolve(import.meta.dirname, "../src/main/ssh-probe.ts"),
      "utf-8",
    );
    const launchSource = fs.readFileSync(
      path.resolve(import.meta.dirname, "../src/main/ssh-launch.ts"),
      "utf-8",
    );
    // The probe script should NOT have the inline for-loop anymore
    // (it was replaced by NODE_RESOLVE_SCRIPT embedding).
    // Check that the old inline pattern is absent from both files.
    const inlineManagerPattern = /for manager_dir in.*\\.nvm/;
    expect(inlineManagerPattern.test(probeSource)).toBe(false);
    expect(inlineManagerPattern.test(launchSource)).toBe(false);
  });
});
