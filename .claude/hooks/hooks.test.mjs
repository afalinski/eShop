// Tests for the guard hooks. Run with: node --test .claude/hooks/hooks.test.mjs
// They check the scripts' logic only. Whether Claude Code actually calls a hook is a separate
// question (see docs/experiments.md, E5): test that through a real session.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const hooksDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(hooksDir, "..", "..");

function run(script, stdin) {
  return spawnSync("node", [path.join(hooksDir, script)], {
    input: stdin,
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
  }).status;
}

const bash = (command) => JSON.stringify({ tool_name: "Bash", tool_input: { command } });
const write = (file_path) =>
  JSON.stringify({ tool_name: "Write", cwd: root, tool_input: { file_path, content: "x" } });
const inRepo = (...parts) => path.join(root, ...parts);

test("guard.mjs lets ordinary commands through", () => {
  for (const command of [
    "git push origin ai-workflow",
    "git push --force-with-lease origin ai-workflow",
    "dotnet test --solution eShop.Web.slnf",
    'git commit -m "tidy the -f option docs"',
    "git log --oneline -5",
  ]) {
    assert.equal(run("guard.mjs", bash(command)), 0, command);
  }
});

test("guard.mjs blocks force pushes, destructive SQL and database drops", () => {
  for (const command of [
    "git push --force origin ai-workflow",
    "git push origin ai-workflow -f",
    "git push origin ai-workflow --force",
    "git push origin +main",
    'psql -c "DROP TABLE orders"',
    'psql -c "drop database catalogdb"',
    "dotnet ef database drop --force",
    "cd src && git push --force",
  ]) {
    assert.equal(run("guard.mjs", bash(command)), 2, command);
  }
});

test("docs-only.mjs allows writes under docs/architecture", () => {
  for (const file of [
    inRepo("docs", "architecture", "services", "x.md"),
    inRepo("docs", "architecture", "overview.md"),
    "docs/architecture/themes/y.md",
  ]) {
    assert.equal(run("docs-only.mjs", write(file)), 0, file);
  }
});

test("docs-only.mjs blocks everything else, including path tricks", () => {
  for (const file of [
    inRepo("src", "Ordering.API", "Apis", "OrdersApi.cs"),
    inRepo("docs", "architecture", "..", "..", "src", "a.cs"),
    inRepo("docs", "architecture-evil", "x.md"),
    inRepo("docs", "adr", "0002-discovery-agent-team.md"),
    "CLAUDE.md",
    "",
  ]) {
    assert.equal(run("docs-only.mjs", write(file)), 2, file || "(empty path)");
  }
});

test("both guards fail closed on input they cannot parse", () => {
  assert.equal(run("guard.mjs", "not json"), 2);
  assert.equal(run("docs-only.mjs", "not json"), 2);
});
