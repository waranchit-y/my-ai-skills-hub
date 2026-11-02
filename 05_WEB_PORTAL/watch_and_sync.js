const fs = require('fs');
const path = require('path');
const { fork } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const BUILD_SCRIPT = path.join(__dirname, 'build_portal.js');

console.log('====================================================');
console.log('👀 AI Skills Central Auto-Sync Watcher Active');
console.log('====================================================');
console.log(`📁 Watching Root: ${ROOT_DIR}`);
console.log('⚡ Any changes to skills, SOPs, or templates will trigger an auto-build!\n');

let debounceTimer = null;
let isBuilding = false;

function triggerBuild(changedFile) {
  if (isBuilding) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    console.log(`\n🔔 Change detected: ${changedFile}`);
    console.log('🔄 Rebuilding Web Portal & packaging skills bundle...');
    isBuilding = true;
    const proc = fork(BUILD_SCRIPT, [], { stdio: 'inherit' });
    proc.on('close', (code) => {
      isBuilding = false;
      console.log(`✨ Auto-sync completed with status: ${code === 0 ? 'SUCCESS' : 'FAILED'}\n`);
    });
  }, 2000); // 2 second debounce
}

// Folders to watch
const watchTargets = [
  '01_SKILLS_LIBRARY',
  '02_WORKFLOWS_SOP',
  '03_PRESETS_TEMPLATES',
  '04_PROJECTS',
  'GEMINI.md',
  '00_ดัชนีรวมสกิลทั้งหมด_CATALOG.md',
  '00_คู่มือการใช้งานคลังกลาง_START_HERE.md'
];

watchTargets.forEach(target => {
  const fullPath = path.join(ROOT_DIR, target);
  if (fs.existsSync(fullPath)) {
    try {
      fs.watch(fullPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        const fn = filename.toLowerCase();
        // Ignore temporary or lock files
        if (fn.endsWith('.tmp') || fn.endsWith('.crdownload') || fn.includes('~') || fn.endsWith('.zip')) return;
        triggerBuild(`${target}/${filename}`);
      });
      console.log(`  ✓ Watching: ${target}`);
    } catch (e) {
      console.warn(`  ⚠️ Could not watch ${target}:`, e.message);
    }
  }
});

console.log('\n✅ Watcher running. Press Ctrl+C to stop.\n');
