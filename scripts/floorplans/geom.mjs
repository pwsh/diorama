// Bundles the REAL src/geometry.ts to a temp ESM module and imports it, so the
// floorplan toolkit + validator share the exact FURNITURE_KINDS defaults,
// WINDOW_DEFAULTS, closedWallLoops, pointInPolygon, doorSpanCenter, etc. that
// the app uses. Regenerated every run (never trust a stale artifact) — the same
// proven harness pattern the test-pages use.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const ESBUILD = join(REPO, 'node_modules', '.bin', 'esbuild');
const SRC = join(REPO, 'src', 'geometry.ts');

let cached = null;

// Bundle src/geometry.ts → temp ESM, dynamic-import it, return the module
// namespace. Cached per process so repeated calls (lib + validate) bundle once.
export async function loadGeom() {
  if (cached) return cached;
  const dir = mkdtempSync(join(tmpdir(), 'diorama-geom-'));
  const out = join(dir, 'geometry.mjs');
  try {
    execFileSync(ESBUILD, [SRC, '--bundle', '--format=esm', '--log-level=error', `--outfile=${out}`], {
      stdio: ['ignore', 'ignore', 'inherit'],
    });
    cached = await import(pathToFileURL(out).href + `?t=${Date.now()}`);
    return cached;
  } finally {
    // Keep the file long enough for the dynamic import above (already resolved),
    // then clean up the temp dir.
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}
