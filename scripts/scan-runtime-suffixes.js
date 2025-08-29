#!/usr/bin/env node
/**
 * Final cross-repo runtime scan (Phase 6 - P6.5)
 * Scans non-doc/script/test directories for legacy hardcoded backend suffix IDs or
 * 24-char lowercase hex segments in pattern -<id>-NONE that are not the active suffix.
 * Exits non-zero on detection.
 */

const { readdirSync, statSync, readFileSync } = require('fs');
const { join } = require('path');

const ROOT = process.cwd();
const CURRENT = process.env.NEXT_PUBLIC_BACKEND_SUFFIX || process.env.TABLE_SUFFIX || '';
const LEGACY = [ 'fvn7t5hbobaxjklhrqzdl4ac34', 'yk6ecaswg5aehjn3ev76xzpbfe' ];
const SCAN_DIRS = [ 'components', 'pages', 'app', 'lib', 'utils', 'services', 'hooks', 'contexts' ];
const IGNORE_FILES = /\.(png|jpg|jpeg|gif|svg|ico|map|lock)$/i;

if (!CURRENT) {
  console.warn('[scan-runtime-suffixes] Skipping (no CURRENT suffix set)');
  process.exit(0);
}

function gather(dir, acc){
  let entries; try { entries = readdirSync(dir); } catch { return; }
  for (const e of entries) {
    const full = join(dir, e);
    let st; try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) gather(full, acc); else if (!IGNORE_FILES.test(e)) acc.push(full);
  }
}

const files = [];
for (const d of SCAN_DIRS) gather(join(ROOT, d), files);
const pattern = /-([a-z0-9]{24})-NONE/g;
const offenders = [];

for (const f of files) {
  let txt; try { txt = readFileSync(f, 'utf8'); } catch { continue; }
  const ids = Array.from(txt.matchAll(pattern)).map(m => m[1]);
  const bad = ids.filter(id => id !== CURRENT && LEGACY.includes(id));
  if (bad.length) offenders.push({ file: f, ids: bad });
}

if (offenders.length) {
  console.error('[scan-runtime-suffixes] Found legacy suffix literals in runtime code:');
  for (const o of offenders) console.error(` - ${o.file}: ${o.ids.join(',')}`);
  process.exit(1);
}
console.log('[scan-runtime-suffixes] OK: no legacy literals found');
