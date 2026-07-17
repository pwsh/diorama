#!/usr/bin/env node
// Publish docs-site/ to GitHub Pages as a single-commit orphan `gh-pages` branch.
//
//   node scripts/docs-gallery/publish.mjs [--dry-run]
//
// Mechanics: docs-site/ is gitignored in the main repo (media never enters main),
// so this builds the branch in a throwaway temp git repo — copy docs-site/ in, one
// orphan commit, add ONLY the `github` remote, and `git push --force github
// gh-pages`. Re-runnable: each run force-overwrites the remote branch with a fresh
// single commit (no history bloat from 163 MB of GIFs). The push targets the
// `github` remote exclusively — never `origin`.
//
//   --dry-run   build the commit locally and print exactly what would push; do NOT
//               push and do NOT touch the remote.
//
// Pages URL after a real publish: https://<owner>.github.io/diorama/

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const OUT = path.join(REPO, 'docs-site');
const PKG = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'));
const REMOTE = 'github';
const BRANCH = 'gh-pages';
const DRY = process.argv.includes('--dry-run');

const log = (...a) => console.log('[docs-publish]', ...a);

function git(args, opts = {}) {
  const r = spawnSync('git', args, { encoding: 'utf8', ...opts });
  if (r.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${(r.stderr || r.stdout || '').trim()}`);
  }
  return (r.stdout || '').trim();
}
function isoDate(d = new Date()) { return d.toISOString().slice(0, 10); }
function ownerFromUrl(url) {
  // https://github.com/<owner>/<repo>(.git)  or  git@github.com:<owner>/<repo>.git
  const m = url.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/i);
  return m ? { owner: m[1], repo: m[2] } : null;
}
function dirSize(dir) {
  let bytes = 0, files = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { const s = dirSize(p); bytes += s.bytes; files += s.files; }
    else { bytes += fs.statSync(p).size; files++; }
  }
  return { bytes, files };
}

function main() {
  // 1. Require a generated site.
  if (!fs.existsSync(path.join(OUT, 'index.html'))) {
    console.error('[docs-publish] docs-site/index.html not found — nothing to publish.\n' +
      '  Generate the site first:  npm run docs:gallery   (or: node scripts/docs-gallery/generate.mjs --pages-only)');
    process.exit(2);
  }

  // 2. Resolve the github remote URL (this remote ONLY — never origin).
  let remoteUrl;
  try { remoteUrl = git(['-C', REPO, 'remote', 'get-url', REMOTE]); }
  catch {
    console.error(`[docs-publish] no '${REMOTE}' remote configured. Add it:\n` +
      `  git remote add ${REMOTE} https://github.com/<owner>/diorama.git`);
    process.exit(2);
  }
  const info = ownerFromUrl(remoteUrl);
  const pagesUrl = info ? `https://${info.owner}.github.io/${info.repo}/` : '(unknown — non-github remote URL)';

  // 3. Ensure .nojekyll so GitHub Pages serves assets/_-prefixed paths verbatim.
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

  const date = isoDate();
  const message = `docs-site ${PKG.version} ${date}`;
  const { bytes, files } = dirSize(OUT);
  const mb = (bytes / 1024 / 1024).toFixed(1);

  // 4. Build the branch in a throwaway temp git repo.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dg-publish-'));
  let sha = '(not committed)';
  try {
    // Copy docs-site/ into the temp repo (local disk → cpSync is safe here).
    for (const e of fs.readdirSync(OUT, { withFileTypes: true })) {
      fs.cpSync(path.join(OUT, e.name), path.join(tmp, e.name), { recursive: true });
    }
    git(['-C', tmp, 'init', '-q']);
    git(['-C', tmp, 'checkout', '-q', '-b', BRANCH]);
    git(['-C', tmp, 'add', '-A']);
    const ident = ['-c', 'user.name=diorama-docs', '-c', 'user.email=docs@diorama.local'];
    git(['-C', tmp, ...ident, 'commit', '-q', '-m', message]);
    sha = git(['-C', tmp, 'rev-parse', 'HEAD']);
    git(['-C', tmp, 'remote', 'add', REMOTE, remoteUrl]);

    const pushArgs = ['-C', tmp, 'push', '--force', REMOTE, `${BRANCH}:${BRANCH}`];
    console.log('\n──────── docs-publish plan ────────');
    console.log(`remote:     ${REMOTE}  ${remoteUrl}`);
    console.log(`branch:     ${BRANCH} (orphan, single commit, --force)`);
    console.log(`commit:     ${sha}`);
    console.log(`message:    ${message}`);
    console.log(`payload:    ${files} files, ${mb} MB`);
    console.log(`pages URL:  ${pagesUrl}`);
    console.log(`push cmd:   git ${pushArgs.join(' ').replace('-C ' + tmp + ' ', '')}`);

    if (DRY) {
      log('--dry-run: commit built locally; NOT pushing. Nothing was sent to any remote.');
    } else {
      log(`pushing ${BRANCH} to ${REMOTE} (force)…`);
      git(pushArgs, { stdio: 'inherit' });
      log('done. GitHub Pages will serve the update shortly at:', pagesUrl);
    }
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

main();
