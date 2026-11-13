// PreToolUse guard for shell commands. Blocks the few commands that must never run
// from an agent session. Exit code 2 blocks the call and sends stderr back to Claude.
import { readFileSync } from "node:fs";

// Fail closed: a crash inside this guard must block the call, not let it through.
process.on("uncaughtException", (error) => {
  process.stderr.write(`Guard failed, blocking to be safe: ${error.message}\n`);
  process.exit(2);
});

const input = JSON.parse(readFileSync(0, "utf8"));
const command = String(input.tool_input?.command ?? "");

const rules = [
  {
    // Plain force push or a +refspec. --force-with-lease is a different token and is not matched.
    re: /\bgit\s+push\b[^;&|\n]*\s(--force|-f)(?=\s|$)|\bgit\s+push\b[^;&|\n]*\s\+\S/i,
    why: "force push rewrites shared history",
  },
  {
    re: /\b(drop\s+(database|table|schema)|truncate\s+table)\b/i,
    why: "destructive SQL",
  },
  {
    re: /\bdotnet\s+ef\s+database\s+drop\b/i,
    why: "dropping a database",
  },
  {
    // Defense in depth behind the Read/Edit deny rules in settings.json. Those cover cat, head,
    // sed and redirections, but not a script that opens the file itself (node -e, python -c).
    // Matches .env and .env.local as a path segment; .env.example does not match.
    re: /(^|[\s'"=@<>:/\\(])\.env(\.local)?(?=$|[\s'"`\\;|&)<>,])|\.pfx\b/i,
    why: "the command names a secret file (.env, .env.local or .pfx)",
  },
  {
    // Behind the deny rules for curl, wget and the PowerShell web cmdlets. A deny rule does not
    // match the program called by path or inside sh -c; this matches the name anywhere in the text.
    // It cannot see a script that opens a socket itself: only an OS sandbox stops that (ADR-006).
    re: /(^|[^\w.-])(curl|wget|invoke-webrequest|invoke-restmethod|iwr|irm|start-bitstransfer)(\.exe)?(?=$|[^\w-])/i,
    why: "network tools are not allowed in agent sessions (an injected instruction could use them to send data out)",
  },
];

for (const rule of rules) {
  if (rule.re.test(command)) {
    process.stderr.write(
      `Blocked by .claude/hooks/guard.mjs: ${rule.why}. ` +
        "Do not run this command. Tell the user what you wanted to do and let them decide.\n"
    );
    process.exit(2);
  }
}
