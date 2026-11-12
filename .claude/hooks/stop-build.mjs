// Stop hook: before Claude ends its turn, build the solution if C# or project files changed.
// A failed build exits with code 2, which sends the compiler errors back and keeps Claude working.
// A build that already passed for the same file contents is skipped, so idle turns stay free.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const input = JSON.parse(readFileSync(0, "utf8"));
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd;
const codeFile = /\.(cs|razor|csproj|props|targets|slnx?|slnf)$/i;

const status = spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
if (status.status !== 0) process.exit(0); // not a git checkout: nothing to compare

const changed = status.stdout
  .split("\n")
  .map((line) => line.slice(3).split(" -> ").pop().trim())
  .filter((file) => file && codeFile.test(file))
  .sort();
if (changed.length === 0) process.exit(0);

const hash = createHash("sha1");
for (const file of changed) {
  const full = path.join(root, file);
  hash.update(file + "\0" + (existsSync(full) ? readFileSync(full) : "deleted"));
}
const fingerprint = hash.digest("hex");

const cache = path.join(tmpdir(), `claude-stop-build-${createHash("sha1").update(root).digest("hex")}.txt`);
if (existsSync(cache) && readFileSync(cache, "utf8") === fingerprint) process.exit(0);

const build = spawnSync(
  "dotnet",
  ["build", "eShop.Web.slnf", "-nologo", "-v", "q", "-consoleloggerparameters:ErrorsOnly"],
  { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 280_000 }
);

if (build.status === 0) {
  writeFileSync(cache, fingerprint);
  process.exit(0);
}

const report = `${build.stdout}\n${build.stderr}`
  .split("\n")
  .filter((line) => line.trim())
  .slice(0, 40)
  .join("\n");
process.stderr.write(`The build fails. Fix these errors before finishing:\n${report}\n`);
process.exit(2);
