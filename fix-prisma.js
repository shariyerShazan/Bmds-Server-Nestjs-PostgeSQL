/**
 * Prisma 7 generates TypeScript source files that, when compiled to CJS by tsc, produce
 * two incompatibilities with Node.js 22.12+ CJS mode:
 *
 * 1. `import.meta.url` remains in compiled output — Node.js 22.12+ auto-detects files
 *    containing `import.meta` as ESM, causing "exports is not defined in ES module scope".
 *    Fix: replace with `globalThis['__dirname'] = __dirname` (already available in CJS).
 *
 * 2. `require("./some-file.ts")` — Prisma source uses explicit .ts extensions which tsc
 *    preserves in the output, but .ts files don't exist in dist/.
 *    Fix: replace .ts extensions with .js in all require() calls.
 */

const fs = require('fs');
const path = require('path');

const prismaDistDir = path.join(__dirname, 'dist', 'generated', 'prisma');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Fix 1: Replace import.meta.url with CJS __dirname (already available in CJS context)
  content = content.replace(
    /globalThis\[['"]__dirname['"]\]\s*=\s*[^\n]+import\.meta\.url[^\n]*\n?/g,
    "globalThis['__dirname'] = __dirname;\n"
  );

  // Fix 2: Replace .ts extensions with .js in require() calls
  content = content.replace(/require\("(\.[^"]+)\.ts"\)/g, 'require("$1.js")');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('  Fixed:', path.relative(__dirname, filePath));
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) {
    console.warn('Directory not found, skipping:', dir);
    return;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) fixFile(full);
  }
}

console.log('Patching Prisma generated CJS output...');
walk(prismaDistDir);
console.log('Done.');
