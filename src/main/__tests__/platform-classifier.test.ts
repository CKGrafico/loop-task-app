import { describe, it, expect } from "vitest";
import { classifyPlatform, parseGitRemoteOutput } from "../platform-classifier";

describe("classifyPlatform", () => {
  it("returns 'github' for HTTPS GitHub URL", () => {
    expect(classifyPlatform(["https://github.com/org/repo.git"])).toBe("github");
  });

  it("returns 'github' for SSH GitHub URL", () => {
    expect(classifyPlatform(["git@github.com:org/repo.git"])).toBe("github");
  });

  it("returns 'unknown' for GitHub Enterprise URL on a custom domain (not github.com)", () => {
    // GitHub Enterprise on custom domains like github.mycompany.com are
    // indistinguishable from any other git host — we only classify github.com.
    expect(classifyPlatform(["https://github.mycompany.com/org/repo.git"])).toBe("unknown");
  });

  it("returns 'ado' for Azure DevOps HTTPS URL", () => {
    expect(classifyPlatform(["https://dev.azure.com/org/project/_git/repo"])).toBe("ado");
  });

  it("returns 'ado' for Azure DevOps SSH URL", () => {
    expect(classifyPlatform(["git@ssh.dev.azure.com:v3/org/project/repo"])).toBe("ado");
  });

  it("returns 'unknown' for unrecognized remote URLs", () => {
    expect(classifyPlatform(["https://gitlab.com/org/repo.git"])).toBe("unknown");
  });

  it("returns 'unknown' for empty array", () => {
    expect(classifyPlatform([])).toBe("unknown");
  });

  it("returns 'github' when GitHub appears alongside unknown remotes", () => {
    expect(classifyPlatform(["https://gitlab.com/org/repo.git", "https://github.com/org/repo.git"])).toBe("github");
  });

  it("returns 'ado' when Azure DevOps appears with unknown remotes (no GitHub)", () => {
    expect(classifyPlatform(["https://gitlab.com/org/repo.git", "https://dev.azure.com/org/proj/_git/repo"])).toBe("ado");
  });

  it("prefers github over ado when both are present (first match wins)", () => {
    expect(classifyPlatform(["https://github.com/org/repo.git", "https://dev.azure.com/org/proj/_git/repo"])).toBe("github");
  });

  it("is case-insensitive", () => {
    expect(classifyPlatform(["HTTPS://GITHUB.COM/org/repo.git"])).toBe("github");
    expect(classifyPlatform(["https://DEV.AZURE.COM/org/proj/_git/repo"])).toBe("ado");
  });
});

describe("parseGitRemoteOutput", () => {
  it("parses typical git remote -v output", () => {
    const output = [
      "origin\thttps://github.com/org/repo.git (fetch)",
      "origin\thttps://github.com/org/repo.git (push)",
    ].join("\n");

    const urls = parseGitRemoteOutput(output);
    expect(urls).toEqual(["https://github.com/org/repo.git"]);
  });

  it("deduplicates fetch and push URLs", () => {
    const output = [
      "origin\thttps://github.com/org/repo.git (fetch)",
      "origin\thttps://github.com/org/repo.git (push)",
    ].join("\n");

    const urls = parseGitRemoteOutput(output);
    expect(urls).toHaveLength(1);
  });

  it("returns separate URLs when fetch and push differ", () => {
    const output = [
      "origin\thttps://github.com/org/repo.git (fetch)",
      "origin\tgit@github.com:org/repo.git (push)",
    ].join("\n");

    const urls = parseGitRemoteOutput(output);
    expect(urls).toHaveLength(2);
    expect(urls).toContain("https://github.com/org/repo.git");
    expect(urls).toContain("git@github.com:org/repo.git");
  });

  it("parses multiple remotes", () => {
    const output = [
      "origin\thttps://github.com/org/repo.git (fetch)",
      "origin\thttps://github.com/org/repo.git (push)",
      "upstream\thttps://github.com/upstream/repo.git (fetch)",
      "upstream\thttps://github.com/upstream/repo.git (push)",
    ].join("\n");

    const urls = parseGitRemoteOutput(output);
    expect(urls).toEqual([
      "https://github.com/org/repo.git",
      "https://github.com/upstream/repo.git",
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(parseGitRemoteOutput("")).toEqual([]);
    expect(parseGitRemoteOutput("\n\n")).toEqual([]);
  });

  it("skips malformed lines without a tab separator", () => {
    const output = "not-a-valid-line\norigin\thttps://github.com/org/repo.git (fetch)";
    const urls = parseGitRemoteOutput(output);
    expect(urls).toEqual(["https://github.com/org/repo.git"]);
  });

  it("parses Azure DevOps SSH URLs", () => {
    const output = "origin\tgit@ssh.dev.azure.com:v3/org/project/repo (fetch)";
    const urls = parseGitRemoteOutput(output);
    expect(urls).toEqual(["git@ssh.dev.azure.com:v3/org/project/repo"]);
  });
});
