// PreToolUse guard for the discovery agents (explorer, architect, critic).
// They may write only under docs/architecture/. Wired in each agent's frontmatter,
// so it runs only while one of those agents is active. Exit code 2 blocks the call.
import { readFileSync } from "node:fs";
import path from "node:path";

// Fail closed: a crash inside this guard must block the call, not let it through.
process.on("uncaughtException", (error) => {
  process.stderr.write(`Guard failed, blocking to be safe: ${error.message}\n`);
  process.exit(2);
});

const input = JSON.parse(readFileSync(0, "utf8"));
const file = String(input.tool_input?.file_path ?? "");
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd;

// file_path arrives absolute, with backslashes on Windows. path.resolve normalises both.
const allowed = path.resolve(root, "docs", "architecture") + path.sep;
const target = path.resolve(root, file);

const fold = (p) => (process.platform === "win32" ? p.toLowerCase() : p);

if (!file || !fold(target).startsWith(fold(allowed))) {
  process.stderr.write(
    `Blocked by .claude/hooks/docs-only.mjs: this agent may write only under docs/architecture/, ` +
      `not to ${file || "(no path)"}.\n`
  );
  process.exit(2);
}
