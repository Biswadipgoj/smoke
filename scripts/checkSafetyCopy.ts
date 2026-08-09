// scripts/checkSafetyCopy.ts
//
// The safety layer exists twice: once for the app (src/services/ai/safety.ts)
// and once for the Deno edge function (supabase/functions/ai-coach/safety.ts),
// because the edge runtime can't import from the app's source tree at deploy
// time.
//
// Two copies of the rule that decides whether a user in a bad moment sees a
// shaming sentence is exactly the kind of duplication that silently drifts. So
// this compares the parts that matter — the rule tables and the fallback text
// — and fails if they've diverged.
//
// Run:  npm run check:safety

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const appSource = readFileSync(join(root, 'src/services/ai/safety.ts'), 'utf8');
const edgeSource = readFileSync(
  join(root, 'supabase/functions/ai-coach/safety.ts'),
  'utf8'
);

/** The executable body, minus comments and blank lines. */
function meaningfulLines(source: string): string[] {
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 &&
        !line.startsWith('//') &&
        !line.startsWith('*') &&
        // Single-line doc comments too: prose is allowed to differ between the
        // two files, only the rules and the fallback text have to match.
        !line.startsWith('/*')
    );
}

const app = meaningfulLines(appSource);
const edge = meaningfulLines(edgeSource);

const missing = app.filter((line) => !edge.includes(line));
const extra = edge.filter((line) => !app.includes(line));

if (missing.length === 0 && extra.length === 0) {
  console.log('PASS  safety layers are in sync');
  process.exit(0);
}

console.log('FAIL  safety layers have diverged\n');
for (const line of missing) console.log(`  only in app:  ${line}`);
for (const line of extra) console.log(`  only in edge: ${line}`);
console.log('\nsrc/services/ai/safety.ts is canonical — copy it across.');
process.exitCode = 1;
