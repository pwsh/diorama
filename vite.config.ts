import { resolve, dirname } from 'node:path';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { defineConfig, type Plugin } from 'vite';

// Deploy-on-build: with DIORAMA_DEPLOY=1 in the env, copy dist/ to the HA
// www share after every (re)build — `npm run deploy` for one-shot,
// `npm run deploy:watch` for a save → rebuild → redeploy loop against the
// live HA instance (the HACS install dir; panel_custom module_url is
// /hacsfiles/diorama/diorama-panel.js).
// NOTE: a HACS update/reinstall of diorama overwrites this dir — redeploy after.
//
// The target is machine-specific and NEVER committed. Resolution order:
//   1. env vars: HA_WWW_DIR (deploy target dir) + optional HA_SMB
//      (share URL for auto-mounting, e.g. smb://<ha-host>/config)
//   2. ./deploy.local.json (gitignored — copy deploy.local.example.json)
// With neither present, deploy is disabled with a hint.
function deployConfig(): { smb: string | null; wwwDir: string | null } {
  if (process.env.HA_WWW_DIR) {
    return { smb: process.env.HA_SMB ?? null, wwwDir: process.env.HA_WWW_DIR };
  }
  try {
    const raw = JSON.parse(readFileSync(resolve(__dirname, 'deploy.local.json'), 'utf8')) as
      { smb?: string; wwwDir?: string };
    return { smb: raw.smb ?? null, wwwDir: raw.wwwDir ?? null };
  } catch {
    return { smb: null, wwwDir: null };
  }
}

// Append a per-build ?v= query to every chunk-to-chunk import specifier and
// to index.html's script src. Filenames stay stable (HA panel registration
// never 404s — see the output config below), but each build's module graph
// is pinned together: a fresh app.js always requests the matching
// three-renderer.js instead of whatever the browser cached under the bare
// URL. Without this, HA's aggressive caching can pair a NEW app.js with a
// STALE three-renderer.js across the dynamic-import boundary — that exact
// mix once NaN'd the humanoid walk cycle (limbs vanished) when the
// TargetWorld interface changed between builds.
function chunkVersionQuery(): Plugin {
  let buildId = '';
  return {
    name: 'chunk-version-query',
    apply: 'build',
    buildStart() { buildId = Date.now().toString(36); },  // fresh per (watch) build
    generateBundle(_opts, bundle) {
      const bust = (code: string, imported: string): string => {
        const base = imported.split('/').pop()!.replace(/\./g, '\\.');
        // Quoted specifier ending in /<basename> (or bare ./<basename>).
        return code.replace(
          new RegExp(`(["'\`])((?:[^"'\`]*/)?${base})\\1`, 'g'),
          `$1$2?v=${buildId}$1`,
        );
      };
      for (const f of Object.values(bundle)) {
        if (f.type !== 'chunk') continue;
        for (const dep of [...f.imports, ...f.dynamicImports]) {
          f.code = bust(f.code, dep);
        }
      }
    },
    // index.html goes through Vite's html pipeline, not generateBundle.
    // Bust its script src + modulepreload hrefs with the same buildId so the
    // preload cache entry matches the import specifier inside main.js.
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          /(["'])((?:[^"']*\/)?[\w.-]+\.js)\1/g,
          `$1$2?v=${buildId}$1`,
        );
      },
    },
  };
}

function haDeploy(): Plugin {
  return {
    name: 'ha-deploy',
    closeBundle() {
      if (!process.env.DIORAMA_DEPLOY) return;
      const { smb, wwwDir: target } = deployConfig();
      if (!target) {
        console.error('[ha-deploy] no deploy target: set HA_WWW_DIR or create ' +
                      'deploy.local.json (see deploy.local.example.json)');
        return;
      }
      if (!existsSync(dirname(target)) && smb) {
        // Share not mounted — try (credentials come from the GNOME keyring).
        try { execSync(`gio mount ${smb}`, { stdio: 'inherit' }); } catch { /* reported below */ }
      }
      if (!existsSync(dirname(target))) {
        console.error(`[ha-deploy] HA share unreachable at ${dirname(target)}` +
                      (smb ? ` — run \`gio mount ${smb}\` or fix deploy.local.json` : ''));
        return;
      }
      // Per-file read/write instead of fs.cpSync: the GVFS SMB FUSE layer
      // rejects cpSync's copy_file_range/chmod path with ENOTSUP.
      const copyDir = (src: string, dst: string): void => {
        mkdirSync(dst, { recursive: true });
        for (const e of readdirSync(src, { withFileTypes: true })) {
          const s = `${src}/${e.name}`, d = `${dst}/${e.name}`;
          if (e.isDirectory()) copyDir(s, d);
          else writeFileSync(d, readFileSync(s));
        }
      };
      copyDir(resolve(__dirname, 'dist'), target);
      console.log(`[ha-deploy] dist → ${target}`);
    },
  };
}

// HA serves the build at /local/diorama/, so all asset URLs must be relative.
// Two entries:
//   - index.html        → iframe mode (panel_iframe + long-lived token)
//   - src/panel.ts      → native panel mode (panel_custom, HA injects hass)
//     emitted as diorama-panel.js at the dist root so the module_url is stable.
// App version (from package.json) compiled into the bundle so the UI can show
// what's actually running — release runbook bumps package.json, so the
// settings drawer stamp tracks it for free.
const pkgVersion: string =
  JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')).version;

export default defineConfig({
  base: './',
  define: { __DIORAMA_VERSION__: JSON.stringify(pkgVersion) },
  plugins: [chunkVersionQuery(), haDeploy()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2020',
    // three-renderer.js (~700 kB min / ~185 kB gzip) is DELIBERATELY one big
    // lazily-loaded chunk (dynamic import in three-view.ts keeps it out of the
    // 2D startup path). Raise the warning threshold just past it so the build
    // stays quiet on the known chunk but still flags real size regressions.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        panel: resolve(__dirname, 'src/panel.ts'),
        // Third entry: the Lovelace custom card → dist/diorama-card.js at the
        // dist root (stable, unhashed — same reason as diorama-panel.js). It
        // shares every chunk (incl. the lazy three-renderer) with the other two
        // entries by module-graph content-addressing, so it never duplicates
        // three.js and stays out of the 2D startup path.
        card: resolve(__dirname, 'src/card.ts'),
      },
      output: {
        // Fully stable filenames (no content hashes). HA + browsers cache
        // module URLs aggressively; with hashed chunks a cached
        // diorama-panel.js imports a chunk filename that no longer exists
        // after redeploy → "Unable to load custom panel". With stable names
        // a stale entry still resolves to the fresh chunk content.
        entryFileNames: chunk =>
          chunk.name === 'panel' ? 'diorama-panel.js' :
          chunk.name === 'card' ? 'diorama-card.js' : 'assets/main.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
