import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');

const KB = 1024;
const LIMITS = [
  { name: 'entry', pattern: /^index-.*\.js$/, maxBytes: 450 * KB },
  { name: 'dataVendor', pattern: /^dataVendor-.*\.js$/, maxBytes: 270 * KB },
  { name: 'supabaseVendor', pattern: /^supabaseVendor-.*\.js$/, maxBytes: 260 * KB },
  { name: 'pdf_viewer', pattern: /^pdf_viewer-.*\.js$/, maxBytes: 180 * KB },
  { name: 'PDFAnnotator', pattern: /^PDFAnnotator-.*\.js$/, maxBytes: 450 * KB },
  { name: 'threeVendor', pattern: /^threeVendor-.*\.js$/, maxBytes: 850 * KB },
  { name: 'ifcCore', pattern: /^ifcCore-.*\.js$/, maxBytes: 2800 * KB },
];

const FORBIDDEN_PRELOADS = [
  'PDFAnnotator',
  'pdf_viewer',
  'ifcCore',
  'ifcViewer',
  'ifcThree',
  'ifcControls',
  'ifcBvh',
  'threeVendor',
  'imageViewer',
];

function formatKB(bytes) {
  return `${(bytes / KB).toFixed(1)} KiB`;
}

async function ensureBuildArtifacts() {
  await access(DIST_DIR);
  await access(ASSETS_DIR);
  await access(INDEX_HTML);
}

async function getAssetFiles() {
  const entries = await readdir(ASSETS_DIR);
  const jsFiles = entries.filter((file) => file.endsWith('.js'));
  const results = [];

  for (const file of jsFiles) {
    const filePath = path.join(ASSETS_DIR, file);
    const info = await stat(filePath);
    results.push({ file, bytes: info.size });
  }

  return results;
}

async function checkPreloads() {
  const html = await readFile(INDEX_HTML, 'utf8');
  const violations = FORBIDDEN_PRELOADS.filter((token) => html.includes(token));

  if (violations.length > 0) {
    throw new Error(`Forbidden modulepreload entries found in dist/index.html: ${violations.join(', ')}`);
  }
}

function checkLimits(files) {
  const failures = [];

  for (const limit of LIMITS) {
    const matched = files.filter((file) => limit.pattern.test(file.file));

    if (matched.length === 0) {
      failures.push(`Missing expected bundle for ${limit.name} (${limit.pattern})`);
      continue;
    }

    for (const match of matched) {
      if (match.bytes > limit.maxBytes) {
        failures.push(
          `${match.file} is ${formatKB(match.bytes)} but limit is ${formatKB(limit.maxBytes)} (${limit.name})`
        );
      }
    }
  }

  return failures;
}

async function main() {
  await ensureBuildArtifacts();
  await checkPreloads();

  const files = await getAssetFiles();
  const failures = checkLimits(files);

  if (failures.length > 0) {
    console.error('Bundle guard failed:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('Bundle guard passed. Key chunk limits and preload rules are respected.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
