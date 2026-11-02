const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORTAL_DIR = __dirname;
const BUNDLE_ZIP = path.join(PORTAL_DIR, 'agent_skills_bundle.zip');

console.log('====================================================');
console.log('🚀 AI Skills Hub & Central Sync Portal Builder');
console.log('====================================================');
console.log(`📂 Root Directory:   ${ROOT_DIR}`);
console.log(`🌐 Portal Directory: ${PORTAL_DIR}`);

// 1. Helper function to scan directory recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['_media_and_archives', '05_WEB_PORTAL', 'node_modules', '.git', '.cache', 'benchmarks'].includes(file)) {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// 2. Parse Frontmatter and Markdown
function parseMarkdown(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    let name = path.basename(path.dirname(filePath));
    if (name === '.' || name === '01_SKILLS_LIBRARY' || name.startsWith('0')) {
      name = path.basename(filePath, path.extname(filePath));
    }
    
    let description = '';
    let category = 'General';
    let prompt = '';

    // Check YAML frontmatter
    const frontmatterMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (frontmatterMatch) {
      const yaml = frontmatterMatch[1];
      const nameMatch = yaml.match(/^name:\s*(.+)$/m);
      if (nameMatch) name = nameMatch[1].trim().replace(/^['"]|['"]$/g, '');
      const descMatch = yaml.match(/^description:\s*(.+)$/m);
      if (descMatch) description = descMatch[1].trim().replace(/^['"]|['"]$/g, '');
    }

    // If description empty, find first header or paragraph
    if (!description) {
      const lines = raw.replace(/^---\r?\n[\s\S]*?\r?\n---/, '').trim().split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          description = trimmed.slice(0, 220);
          break;
        }
      }
    }

    // Determine category based on relative path
    const rel = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
    if (rel.includes('01_Software_Engineering')) category = 'Software Engineering';
    else if (rel.includes('02_Productivity_and_Design')) category = 'Productivity & Design';
    else if (rel.includes('03_Visual_Architecture')) category = 'Visual Architecture';
    else if (rel.includes('04_Web_Intelligence')) category = 'Web Intelligence';
    else if (rel.includes('05_Document_Generators')) category = 'Document Generators';
    else if (rel.includes('06_Meta_Skills')) category = 'Meta Skills';
    else if (rel.includes('07_Business_Roles')) category = 'Business Roles';
    else if (rel.includes('08_Audio_and_Voice_AI')) category = 'Audio & Voice AI';
    else if (rel.includes('02_WORKFLOWS_SOP/Video_Editing_Workflows') || rel.includes('03_PRESETS_TEMPLATES/video_styles')) category = 'Video Production';
    else if (rel.includes('02_WORKFLOWS_SOP/Financial_Workflows') || rel.includes('03_PRESETS_TEMPLATES/financial_reports')) category = 'Financial & Business';
    else if (rel.includes('02_WORKFLOWS_SOP')) category = 'Workflows & SOP';
    else if (rel.includes('03_PRESETS_TEMPLATES')) category = 'Presets & Templates';
    else if (rel.includes('04_PROJECTS')) category = 'Projects';
    else if (rel.startsWith('GEMINI.md') || rel.startsWith('00_')) category = 'Core Operating System';

    // Formulate a smart prompt invocation
    if (category === 'Software Engineering') {
      prompt = `ช่วยใช้สกิล '${name}' จาก '${rel}' ในการจัดการโค้ดโปรเจกต์นี้ตามขั้นตอนมาตรฐาน`;
    } else if (category === 'Audio & Voice AI') {
      prompt = `ช่วยใช้สกิล OmniVoice Studio ใน '${rel}' เพื่อวิเคราะห์และสังเคราะห์เสียงตามที่ระบุ`;
    } else if (category === 'Video Production') {
      prompt = `ช่วยตัดต่อและวางโครงสร้างวิดีโอตามพรีเซ็ต/SOP '${name}' ใน '${rel}'`;
    } else if (category === 'Visual Architecture') {
      prompt = `ช่วยวาดสถาปัตยกรรมไดอะแกรมของระบบนี้ด้วย Archify จาก '${rel}'`;
    } else if (category === 'Web Intelligence') {
      prompt = `ช่วยค้นหาและรวบรวมข้อมูลเชิงลึกด้วย Agent-Reach จาก '${rel}'`;
    } else if (category === 'Document Generators') {
      prompt = `ช่วยสร้างเอกสารตามมาตรฐาน '${name}' ใน '${rel}'`;
    } else {
      prompt = `ช่วยปฏิบัติงานตามคู่มือ/สกิล '${name}' ใน '${rel}' อย่างเคร่งครัด`;
    }

    const stats = fs.statSync(filePath);

    return {
      id: rel.replace(/[^a-zA-Z0-9_-]/g, '_'),
      name: name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      rawName: name,
      category,
      relativePath: rel,
      description: description || 'คู่มือและขั้นตอนการทำงานมาตรฐานสำหรับ AI Agent',
      prompt,
      content: raw,
      sizeBytes: stats.size,
      updatedAt: stats.mtime.toISOString(),
      updatedDisplay: stats.mtime.toLocaleString('th-TH')
    };
  } catch (err) {
    console.error(`Error parsing ${filePath}:`, err.message);
    return null;
  }
}

// 3. Collect all skills, SOPs, Templates
console.log('🔍 Scanning skills, SOPs, and templates...');

const allFiles = getAllFiles(ROOT_DIR);
const mdFiles = allFiles.filter(f => {
  const rel = path.relative(ROOT_DIR, f).replace(/\\/g, '/');
  if (rel.includes('_media_and_archives') || rel.includes('05_WEB_PORTAL') || rel.includes('test_')) return false;
  return f.endsWith('.md') || f.endsWith('.yaml') || f.endsWith('.json');
});

const items = [];
const processedPaths = new Set();

// First check SKILL.md files
const skillFiles = mdFiles.filter(f => path.basename(f).toLowerCase() === 'skill.md');
for (const f of skillFiles) {
  const item = parseMarkdown(f);
  if (item) {
    items.push(item);
    processedPaths.add(f);
  }
}

// Next check SOPs, Templates, and Root Markdown
const otherImportantFiles = mdFiles.filter(f => {
  if (processedPaths.has(f)) return false;
  const rel = path.relative(ROOT_DIR, f).replace(/\\/g, '/');
  return (
    rel.includes('02_WORKFLOWS_SOP') ||
    rel.includes('03_PRESETS_TEMPLATES') ||
    rel.includes('04_PROJECTS') ||
    rel.includes('cfo_skill.md') ||
    rel.startsWith('00_') ||
    rel === 'GEMINI.md'
  );
});

for (const f of otherImportantFiles) {
  const item = parseMarkdown(f);
  if (item) {
    items.push(item);
    processedPaths.add(f);
  }
}

console.log(`✅ Discovered ${items.length} primary skills, SOPs, and templates!`);

// 4. Create agent_skills_bundle.zip using tar (Lightweight < 10MB)
console.log('📦 Packaging latest skills into agent_skills_bundle.zip (Ultra-Lightweight < 10MB)...');
try {
  if (fs.existsSync(BUNDLE_ZIP)) {
    fs.unlinkSync(BUNDLE_ZIP);
  }
  // Package essential folders using Windows tar, excluding heavy build assets/examples
  const tarCmd = `cd "${ROOT_DIR}" && tar -a -c -f "${BUNDLE_ZIP}" --exclude="_media_and_archives" --exclude="05_WEB_PORTAL" --exclude=".git" --exclude="*.zip" --exclude="archify/docs" --exclude="archify/examples" --exclude="archify/experiments" --exclude="archify/test" --exclude="archify/tools" --exclude="archify/website" --exclude="benchmarks" 01_SKILLS_LIBRARY 02_WORKFLOWS_SOP 03_PRESETS_TEMPLATES 04_PROJECTS GEMINI.md 00_*`;
  execSync(tarCmd, { stdio: 'inherit', shell: 'cmd.exe' });
  console.log('✅ Lightweight bundle zip successfully created!');
} catch (e) {
  console.error('⚠️ Tar error, falling back to PowerShell Compress-Archive:', e.message);
  try {
    const psCmd = `powershell -NoProfile -Command "Get-ChildItem -Path '${ROOT_DIR}' | Where-Object { $_.Name -notin @('_media_and_archives', '05_WEB_PORTAL', '.git') } | Compress-Archive -DestinationPath '${BUNDLE_ZIP}' -Force"`;
    execSync(psCmd, { stdio: 'inherit' });
    console.log('✅ PowerShell Compress-Archive fallback finished!');
  } catch (err2) {
    console.error('❌ Failed to package zip:', err2.message);
  }
}

// 4.1 Auto-Sync to Cloud Drive (Google Drive / OneDrive)
const userProfile = process.env.USERPROFILE || 'C:\\Users\\ASUS';
const gDriveUploadDir = path.join(ROOT_DIR, 'GOOGLE_DRIVE_UPLOAD');

if (!fs.existsSync(gDriveUploadDir)) {
  fs.mkdirSync(gDriveUploadDir, { recursive: true });
}
fs.copyFileSync(BUNDLE_ZIP, path.join(gDriveUploadDir, 'agent_skills_bundle.zip'));
console.log(`📁 Updated dedicated Google Drive folder: ${gDriveUploadDir}`);

// Scan for Google Drive Desktop virtual drives (e.g. G:\, H:\, My Drive)
const possibleDrives = ['D', 'E', 'F', 'G', 'H', 'I', 'J'];
const cloudPaths = [
  path.join(userProfile, 'Google Drive', 'AI_Skills_Hub'),
  path.join(userProfile, 'OneDrive', 'AI_Skills_Hub')
];

for (const letter of possibleDrives) {
  const myDrivePath = `${letter}:\\My Drive`;
  const gDrivePath = `${letter}:\\Google Drive`;
  if (fs.existsSync(myDrivePath)) cloudPaths.push(path.join(myDrivePath, 'AI_Skills_Hub'));
  if (fs.existsSync(gDrivePath)) cloudPaths.push(path.join(gDrivePath, 'AI_Skills_Hub'));
}

for (const cp of cloudPaths) {
  const parentDrive = path.dirname(cp);
  if (fs.existsSync(parentDrive)) {
    try {
      if (!fs.existsSync(cp)) fs.mkdirSync(cp, { recursive: true });
      fs.copyFileSync(BUNDLE_ZIP, path.join(cp, 'agent_skills_bundle.zip'));
      console.log(`☁️ Auto-synced zip bundle to Cloud Drive: ${cp}`);
    } catch (cErr) {
      console.warn(`Could not sync to cloud drive ${cp}:`, cErr.message);
    }
  }
}



let zipSizeMB = '0';
if (fs.existsSync(BUNDLE_ZIP)) {
  zipSizeMB = (fs.statSync(BUNDLE_ZIP).size / (1024 * 1024)).toFixed(2);
}

const buildTime = new Date();
const buildTimeStr = buildTime.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
const buildTimeISO = buildTime.toISOString();

// 5. Generate index.html
console.log('🎨 Generating modern interactive web portal...');

const categories = [...new Set(items.map(i => i.category))].sort();

const htmlContent = `<!DOCTYPE html>
<html lang="th" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⚡ AI Skills Hub & Central Sync Portal</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#eff6ff',
              100: '#dbeafe',
              500: '#3b82f6',
              600: '#2563eb',
              700: '#1d4ed8',
              800: '#1e40af',
              900: '#1e3a8a',
              glow: '#00f2fe'
            },
            darkBg: '#0b0f19',
            cardBg: '#111827',
            cardBorder: '#1f2937'
          }
        }
      }
    }
  </script>
  <!-- Marked.js for rendering markdown modal -->
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap');
    body {
      font-family: 'Noto Sans Thai', sans-serif;
      background-color: #0b0f19;
      color: #e2e8f0;
    }
    .heading-font {
      font-family: 'Chakra Petch', sans-serif;
    }
    .glow-cyan {
      box-shadow: 0 0 25px -5px rgba(6, 182, 212, 0.4);
    }
    .glow-blue {
      box-shadow: 0 0 25px -5px rgba(59, 130, 246, 0.4);
    }
    .glass {
      background: rgba(17, 24, 39, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    pre code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #0b0f19;
    }
    ::-webkit-scrollbar-thumb {
      background: #1f2937;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #374151;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col bg-darkBg text-slate-200">

  <!-- Toast Notification -->
  <div id="toast" class="fixed bottom-6 right-6 z-50 transform translate-y-20 opacity-0 transition-all duration-300 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-cyan-500 text-slate-950 font-semibold shadow-2xl">
    <i class="fa-solid fa-circle-check text-lg"></i>
    <span id="toast-message">คัดลอกพร็อมต์สำเร็จแล้ว!</span>
  </div>

  <!-- Top Navbar -->
  <nav class="sticky top-0 z-40 border-b border-cardBorder glass px-6 py-4">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-cyan-500/30">
          <i class="fa-solid fa-brain"></i>
        </div>
        <div>
          <h1 class="heading-font text-xl font-bold bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
            AI SKILLS HUB & SYNC PORTAL
          </h1>
          <p class="text-xs text-slate-400">คลังสกิลกลาง & ศูนย์กลางซิงค์อัตโนมัติ (Single Source of Truth)</p>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex items-center gap-3">
        <a href="agent_skills_bundle.zip" download="agent_skills_bundle.zip"
           class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5">
          <i class="fa-solid fa-download"></i>
          <span>โหลดคลังสกิล (.ZIP ${zipSizeMB} MB)</span>
        </a>
        <button onclick="switchTab('prompts')"
           class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-cyan-300 font-semibold text-sm transition-all">
          <i class="fa-solid fa-terminal"></i>
          <span>ชุดคำสั่งที่ทำงาน</span>
        </button>
      </div>
    </div>
  </nav>

  <!-- Hero & Status Stats -->
  <header class="max-w-7xl mx-auto w-full px-6 pt-8 pb-4">
    <div class="p-6 md:p-8 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-cyan-950/30 relative overflow-hidden shadow-2xl">
      <!-- Glow element -->
      <div class="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div class="max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-3">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            สถานะคลังกลาง: อัปเดตล่าสุด ${buildTimeStr}
          </div>
          <h2 class="heading-font text-2xl md:text-3xl font-extrabold text-white tracking-wide">
            ศูนย์กลางควบคุมและกระจายสกิล AI ประจำตัว
          </h2>
          <p class="mt-2 text-slate-300 text-sm leading-relaxed">
            ระบบอัปเดตอัตโนมัติทุกครั้งที่มีการเขียนโค้ด ปรับขั้นตอน SOP หรือเพิ่มพรีเซ็ตใหม่ 
            พกติดตัวไปใช้ที่คอมที่ทำงานได้ครบ 100% พร้อมระบบดึงบทเรียน Mini-Retro กลับมาอัปเดตต่อที่บ้านไร้รอยต่อ
          </p>
        </div>

        <!-- Metric Badges -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <div class="text-xs text-slate-400">สกิลทั้งหมด</div>
            <div class="text-2xl font-black text-cyan-400 heading-font">${items.length}</div>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <div class="text-xs text-slate-400">หมวดหมู่</div>
            <div class="text-2xl font-black text-blue-400 heading-font">${categories.length}</div>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <div class="text-xs text-slate-400">ขนาดแพ็กเกจ</div>
            <div class="text-2xl font-black text-emerald-400 heading-font">${zipSizeMB} <span class="text-xs">MB</span></div>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <div class="text-xs text-slate-400">ระบบ AI</div>
            <div class="text-2xl font-black text-amber-400 heading-font">100%</div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="mt-8 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-5">
        <button onclick="switchTab('catalog')" id="tab-btn-catalog" class="tab-btn active px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
          <i class="fa-solid fa-shapes mr-1.5"></i> คลังสกิล & เครื่องมือ (${items.length})
        </button>
        <button onclick="switchTab('prompts')" id="tab-btn-prompts" class="tab-btn px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-slate-800/40 text-slate-400 hover:text-white border border-transparent">
          <i class="fa-solid fa-laptop-code mr-1.5"></i> ชุดคำสั่งคอมที่ทำงาน (Master Prompts)
        </button>
        <button onclick="switchTab('guide')" id="tab-btn-guide" class="tab-btn px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-slate-800/40 text-slate-400 hover:text-white border border-transparent">
          <i class="fa-solid fa-arrows-rotate mr-1.5"></i> วงจร Sync ไป-กลับ (บ้าน ⇄ ที่ทำงาน)
        </button>
        <button onclick="switchTab('cloud')" id="tab-btn-cloud" class="tab-btn px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-slate-800/40 text-slate-400 hover:text-white border border-transparent">
          <i class="fa-solid fa-cloud-arrow-up mr-1.5"></i> เอาขึ้นเว็บออนไลน์ฟรี (Cloud Hosting)
        </button>
      </div>
    </div>
  </header>

  <!-- TAB 1: CATALOG -->
  <section id="tab-catalog" class="max-w-7xl mx-auto w-full px-6 py-6 flex-1">
    <!-- Search & Filter Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div class="relative flex-1 max-w-lg">
        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input type="text" id="searchInput" oninput="filterCards()" placeholder="ค้นหาชื่อสกิล, คำอธิบาย, หมวดหมู่ หรือโฟลเดอร์..."
               class="w-full pl-11 pr-4 py-3 rounded-xl bg-cardBg border border-cardBorder focus:border-cyan-500 focus:outline-none text-sm text-slate-100 placeholder-slate-500 transition-all">
      </div>
      
      <!-- Category Quick Filter -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 text-xs" id="categoryPills">
        <button onclick="selectCategory('ALL')" class="cat-pill active px-3.5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold transition-all whitespace-nowrap">
          ทั้งหมด
        </button>
        ${categories.map(c => `
          <button onclick="selectCategory('${c}')" class="cat-pill px-3.5 py-2 rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60 transition-all whitespace-nowrap">
            ${c}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Skills Grid -->
    <div id="skillsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <!-- Injected via JavaScript -->
    </div>
  </section>

  <!-- TAB 2: WORKPLACE PROMPTS -->
  <section id="tab-prompts" class="max-w-7xl mx-auto w-full px-6 py-6 flex-1 hidden">
    <div class="space-y-8">
      
      <!-- Intro Card -->
      <div class="p-6 rounded-2xl bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border border-blue-500/30">
        <h3 class="heading-font text-xl font-bold text-cyan-300 flex items-center gap-2">
          <i class="fa-solid fa-bolt"></i> ชุดคำสั่ง Master Prompts สำหรับใช้งานที่คอมที่ทำงาน
        </h3>
        <p class="mt-2 text-sm text-slate-300 leading-relaxed">
          นำไฟล์ <code class="px-2 py-0.5 rounded bg-slate-800 text-cyan-400">agent_skills_bundle.zip</code> ที่ดาวน์โหลดจากเว็บนี้ไปแตกไฟล์ไว้ที่คอมที่ทำงาน 
          จากนั้นใช้ 2 พร็อมต์ด้านล่างนี้คุมการทำงาน เพื่อให้ AI ในเครื่องที่ทำงานทำงานด้วยกฎเดียวกับที่บ้าน 100% 
          และสรุปของใหม่กลับมาใส่ Flash Drive ได้อย่างหมดจด
        </p>
      </div>

      <!-- PROMPT 1: ONBOARDING AT WORK -->
      <div class="p-6 md:p-8 rounded-2xl bg-cardBg border border-cardBorder shadow-xl relative overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center">1</span>
            <div>
              <h4 class="heading-font text-lg font-bold text-white">
                พร็อมต์ที่ 1: ติดตั้ง & เชื่อมคลังสกิลบนคอมที่ทำงาน (เช้า / เริ่มงาน)
              </h4>
              <p class="text-xs text-slate-400">ใช้สั่ง AI ในคอมที่ทำงาน (Antigravity / Cursor / Claude Code / ChatGPT) ทันทีหลังแตกไฟล์ zip</p>
            </div>
          </div>
          <button onclick="copyElementText('prompt1-content')" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all">
            <i class="fa-solid fa-copy"></i>
            <span>คัดลอกพร็อมต์ที่ 1</span>
          </button>
        </div>

        <pre id="prompt1-content" class="p-5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs md:text-sm font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">คุณคือ AI Pair Programmer ประจำตัวของฉัน ปฏิบัติหน้าที่ร่วมกับคลังสกิลกลาง (Central Skills Library) อย่างเคร่งครัด 100%

🎯 คำสั่งเริ่มต้นภารกิจ (Onboarding Activation Protocol):
1. คลังสกิลกลางของเราอยู่ที่โฟลเดอร์นี้: ให้คุณสำรวจโครงสร้างไฟล์ทันที โดยเฉพาะ:
   - 'GEMINI.md' (กฎเหล็กวงจร 4 ขั้นตอน: Pre-Check & Route ➔ Disciplined Execution ➔ Evidence Gate ➔ Continuous Learning)
   - '00_ดัชนีรวมสกิลทั้งหมด_CATALOG.md' (สารบัญสกิลทั้งหมด)
   - '00_คู่มือการใช้งานคลังกลาง_START_HERE.md'

2. กฎการทำงานที่คุณต้องปฏิบัติตามทุกครั้งที่ฉันสั่งงาน:
   - [Phase 1: ป้องกันข้อผิดพลาดล่วงหน้า]: ตรวจสอบ Catalog เสมอ และแจ้งแผนงานสั้นๆ (เป้าหมาย / สกิลที่เลือกใช้ / จุดเสี่ยง) ก่อนเริ่มลงมือ
   - [Phase 2: วินัยการทำงาน]: ห้ามลัดขั้นตอน หากเป็นงานใหญ่ให้วางแผนหรือแบ่งงานอย่างมีระบบ
   - [Phase 3: ตรวจสอบจริงก่อนส่งงาน]: ห้ามบอกว่าเสร็จถ้ายังไม่ได้รันเทสต์หรือตรวจผลลัพธ์จริงบนเครื่อง ต้องแสดง Output Log ยืนยัน 0 errors
   - [Phase 4: เรียนรู้และอัปเกรด]: หากฉันติชม หรือมีบทเรียนสำคัญ ให้ทำ Mini-Retro และบันทึกลงในไฟล์ SOP หรือกฎทันที

3. โปรดตอบกลับสั้นๆ เพื่อยืนยันว่าคุณ:
   - อ่านและเข้าใจกฎใน 'GEMINI.md' แล้ว
   - สรุปรายชื่อสกิลหลักที่คุณตรวจพบในคลังกลางนี้
   - พร้อมรับคำสั่งภารกิจแรกทันที!</pre>
      </div>

      <!-- PROMPT 2: OFFBOARDING AT WORK -->
      <div class="p-6 md:p-8 rounded-2xl bg-cardBg border border-cardBorder shadow-xl relative overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center justify-center">2</span>
            <div>
              <h4 class="heading-font text-lg font-bold text-white">
                พร็อมต์ที่ 2: รวบรวมสกิลใหม่ & บทเรียน Mini-Retro ก่อนเลิกงาน (เย็น / เลิกงาน)
              </h4>
              <p class="text-xs text-slate-400">ใช้สั่ง AI ที่ทำงานก่อนปิดเครื่อง เพื่อรวบรวมไฟล์ที่สร้างใหม่/แก้ไขลงแฟลชไดรฟ์กลับบ้าน</p>
            </div>
          </div>
          <button onclick="copyElementText('prompt2-content')" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all">
            <i class="fa-solid fa-copy"></i>
            <span>คัดลอกพร็อมต์ที่ 2</span>
          </button>
        </div>

        <pre id="prompt2-content" class="p-5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs md:text-sm font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">วันนี้หมดเวลาทำงานแล้ว ก่อนฉันจะปิดเครื่องและกลับบ้าน ให้คุณทำหน้าที่ปิดกะและเตรียมไฟล์อัปเดตกลับบ้าน (Daily Offboarding & Delta Sync Protocol) ดังนี้:

1. [Mini-Retro สรุปงานประจำวัน]:
   - วิเคราะห์ว่าในวันนี้ เราได้สร้างสกิลใหม่, เขียนโค้ดส่วนไหน, มีข้อผิดพลาดอะไรที่พบและแก้ไขได้, หรือมีขั้นตอน SOP / Preset แบบไหนที่พัฒนาขึ้นมาบ้าง
   - เขียนสรุปเป็นไฟล์ 'DAILY_RETRO_LOG.md'

2. [ตรวจจับและรวบรวมไฟล์ที่มีการเปลี่ยนแปลง (Delta Export)]:
   - ค้นหาไฟล์ทั้งหมดที่มีการสร้างใหม่หรือแก้ไขในวันนี้ (ใน '01_SKILLS_LIBRARY', '02_WORKFLOWS_SOP', '03_PRESETS_TEMPLATES', '04_PROJECTS', หรือ 'GEMINI.md')
   - คัดลอกเฉพาะไฟล์ที่มีการเปลี่ยนแปลงเหล่านี้ ไปรวบรวมไว้ในโฟลเดอร์ชื่อ 'USB_SYNC_DELTA' โดยรักษาโครงสร้างโฟลเดอร์ย่อยเดิมไว้ทุกประการ

3. [อัปเดตสารบัญ]:
   - หากมีการเพิ่มสกิลใหม่ ให้เขียนอัปเดตลงใน '00_ดัชนีรวมสกิลทั้งหมด_CATALOG.md' ในโฟลเดอร์ 'USB_SYNC_DELTA' ด้วย

4. [สรุปรายงานการนำกลับ]:
   - แสดงตารางรายการไฟล์ทั้งหมดที่พร้อมให้ฉัน Copy ใส่ Flash Drive กลับบ้าน เพื่อเอาไป Merge รวมกับคลังกลางที่บ้าน</pre>
      </div>

      <!-- PROMPT 3: MERGING AT HOME -->
      <div class="p-6 md:p-8 rounded-2xl bg-cardBg border border-cardBorder shadow-xl relative overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 font-bold flex items-center justify-center">3</span>
            <div>
              <h4 class="heading-font text-lg font-bold text-white">
                พร็อมต์ที่ 3: ผสานไฟล์จากแฟลชไดรฟ์เข้าคลังกลางที่บ้าน (เมื่อถึงบ้าน)
              </h4>
              <p class="text-xs text-slate-400">ใช้สั่ง AI ที่บ้าน (หรือดับเบิ้ลคลิก merge_from_usb.bat) เพื่อดึงของใหม่เข้าคลังกลางและอัปเดตเว็บทันที</p>
            </div>
          </div>
          <button onclick="copyElementText('prompt3-content')" class="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all">
            <i class="fa-solid fa-copy"></i>
            <span>คัดลอกพร็อมต์ที่ 3</span>
          </button>
        </div>

        <pre id="prompt3-content" class="p-5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs md:text-sm font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">ฉันนำไฟล์ที่พัฒนาเพิ่มเติมจากคอมที่ทำงานกลับมาในโฟลเดอร์ USB แล้ว (อยู่ในโฟลเดอร์ 'USB_SYNC_DELTA')

โปรดดำเนินการดังนี้:
1. ทำการผสาน (Merge) ไฟล์ทั้งหมดจาก 'USB_SYNC_DELTA' เข้าสู่คลังกลาง 'C:\Users\ASUS\Desktop\Agent Folder' โดยรักษาโครงสร้างโฟลเดอร์ให้ถูกต้อง
2. ตรวจสอบความถูกต้องและรายงานว่ามีสกิล, SOP หรือพรีเซ็ตใดบ้างที่ได้รับการอัปเดตหรือเพิ่มเข้ามาใหม่
3. รันสคริปต์อัปเดตเว็บพอร์ทัล ('node 05_WEB_PORTAL/build_portal.js') เพื่อให้อัปเดตหน้าเว็บและสร้างไฟล์ 'agent_skills_bundle.zip' ใหม่ล่าสุดอัตโนมัติ!</pre>
      </div>

    </div>
  </section>

  <!-- TAB 3: SYNC GUIDE -->
  <section id="tab-guide" class="max-w-7xl mx-auto w-full px-6 py-6 flex-1 hidden">
    <div class="max-w-4xl mx-auto space-y-8">
      
      <div class="text-center space-y-2">
        <h3 class="heading-font text-2xl font-bold text-white">
          🔄 วงจรการทำงานและซิงค์ข้อมูล (Closed-Loop Synchronization Lifecycle)
        </h3>
        <p class="text-sm text-slate-400">
          ขั้นตอนง่ายๆ 4 สเต็ปที่จะทำให้คุณมี AI ที่ฉลาดที่สุด ทำงานต่อเนื่องได้ทั้งที่บ้านและที่ทำงาน
        </p>
      </div>

      <!-- Steps Timeline -->
      <div class="space-y-6">
        
        <div class="p-6 rounded-2xl bg-cardBg border border-cardBorder flex gap-5 items-start">
          <div class="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-bold text-xl flex items-center justify-center shrink-0">
            A
          </div>
          <div class="space-y-2">
            <h4 class="heading-font text-base font-bold text-white">ก่อนออกจากบ้าน หรือเปิดเว็บที่ทำงาน</h4>
            <p class="text-sm text-slate-300 leading-relaxed">
              เว็บนี้จะคอยอัปเดตและสร้างไฟล์ <span class="text-cyan-400 font-semibold">agent_skills_bundle.zip</span> ให้อัตโนมัติทุกครั้งที่คุณทำงานที่บ้าน 
              คุณสามารถกดปุ่ม <span class="text-emerald-400 font-semibold">"โหลดคลังสกิล (.ZIP)"</span> จากเว็บ หรือก๊อปปี้ใส่ USB Flash Drive ติดตัวไปได้เลย
            </p>
          </div>
        </div>

        <div class="p-6 rounded-2xl bg-cardBg border border-cardBorder flex gap-5 items-start">
          <div class="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 font-bold text-xl flex items-center justify-center shrink-0">
            B
          </div>
          <div class="space-y-2">
            <h4 class="heading-font text-base font-bold text-white">เมื่อถึงคอมที่ทำงาน (เช้า)</h4>
            <p class="text-sm text-slate-300 leading-relaxed">
              แตกไฟล์ zip ไว้ที่คอมที่ทำงาน เช่น <code class="px-2 py-0.5 rounded bg-slate-800 text-cyan-400">C:\Users\...\Desktop\Agent Folder</code> 
              แล้วเปิด Cursor, Antigravity หรือ Claude จากนั้นเปิดแท็บ <span class="text-cyan-400 font-semibold">"ชุดคำสั่งคอมที่ทำงาน"</span> 
              แล้วกดคัดลอก <span class="text-emerald-400 font-semibold">"พร็อมต์ที่ 1 (Onboarding)"</span> วางลงใน AI เพื่อปลุกระบบทันที!
            </p>
          </div>
        </div>

        <div class="p-6 rounded-2xl bg-cardBg border border-cardBorder flex gap-5 items-start">
          <div class="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xl flex items-center justify-center shrink-0">
            C
          </div>
          <div class="space-y-2">
            <h4 class="heading-font text-base font-bold text-white">ก่อนเลิกงานที่ทำงาน (เย็น)</h4>
            <p class="text-sm text-slate-300 leading-relaxed">
              ก่อนปิดเครื่องคอมที่ทำงาน ให้เปิดแท็บ <span class="text-cyan-400 font-semibold">"ชุดคำสั่งคอมที่ทำงาน"</span> 
              แล้วกดคัดลอก <span class="text-amber-400 font-semibold">"พร็อมต์ที่ 2 (Offboarding)"</span> แปะให้ AI รัน AI จะตรวจหาสกิลใหม่ สรุป Mini-Retro 
              และรวมไฟล์ที่อัปเดตลงโฟลเดอร์ <code class="px-2 py-0.5 rounded bg-slate-800 text-amber-400">USB_SYNC_DELTA</code> เซฟลงแฟลชไดรฟ์กลับบ้าน
            </p>
          </div>
        </div>

        <div class="p-6 rounded-2xl bg-cardBg border border-cardBorder flex gap-5 items-start">
          <div class="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 font-bold text-xl flex items-center justify-center shrink-0">
            D
          </div>
          <div class="space-y-2">
            <h4 class="heading-font text-base font-bold text-white">เมื่อกลับมาถึงบ้าน</h4>
            <p class="text-sm text-slate-300 leading-relaxed">
              เสียบ Flash Drive เข้าคอมที่บ้าน แล้วกดดับเบิ้ลคลิกไฟล์ <code class="px-2 py-0.5 rounded bg-slate-800 text-purple-400">merge_from_usb.bat</code> ใน Agent Folder 
              หรือสั่ง AI ด้วย <span class="text-purple-400 font-semibold">"พร็อมต์ที่ 3"</span> ระบบจะดึงของใหม่เข้าคลังกลาง และอัปเดตหน้าเว็บนี้ใหม่อัตโนมัติทันที 100%!
            </p>
          </div>
        </div>

      </div>

    </div>
  </section>

  <!-- TAB 4: CLOUD HOSTING GUIDE -->
  <section id="tab-cloud" class="max-w-7xl mx-auto w-full px-6 py-6 flex-1 hidden">
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="p-6 md:p-8 rounded-2xl bg-cardBg border border-cardBorder space-y-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-lg">
            <i class="fa-solid fa-cloud"></i>
          </div>
          <div>
            <h3 class="heading-font text-lg font-bold text-white">วิธีนำเว็บนี้ขึ้นระบบออนไลน์ฟรี (เปิดดูได้จากคอมที่ทำงานหรือมือถือทุกที่)</h3>
            <p class="text-xs text-slate-400">เลือกทำตามวิธีใดวิธีหนึ่งด้านล่างนี้ได้ตามสะดวก</p>
          </div>
        </div>

        <div class="space-y-4 pt-2">
          <!-- Option 1 -->
          <div class="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
            <h4 class="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <i class="fa-brands fa-github text-base"></i> วิธีที่ 1: ใช้ GitHub Pages (แนะนำ ฟรี 100% ตลอดชีพ)
            </h4>
            <ol class="mt-3 text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>สร้าง Repository ใหม่บน GitHub เช่น ชื่อ <code class="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">my-ai-skills</code></li>
              <li>นำไฟล์ในโฟลเดอร์ <code class="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">05_WEB_PORTAL</code> (รวมถึง <code class="text-amber-300">index.html</code> และ <code class="text-amber-300">agent_skills_bundle.zip</code>) อัปโหลดขึ้น GitHub</li>
              <li>ไปที่เมนู <strong>Settings ➔ Pages ➔ Source เลือก 'Deploy from a branch' (main)</strong> แล้วกด Save</li>
              <li>คุณจะได้ URL ส่วนตัว เช่น <code class="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">https://username.github.io/my-ai-skills/</code> เอาไว้เปิดจากคอมที่ทำงานและกดดาวน์โหลดได้ตลอดเวลา!</li>
            </ol>
          </div>

          <!-- Option 2 -->
          <div class="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
            <h4 class="text-sm font-bold text-blue-300 flex items-center gap-2">
              <i class="fa-solid fa-network-wired text-base"></i> วิธีที่ 2: รัน Local Server บนเครือข่าย Wi-Fi ที่บ้าน
            </h4>
            <p class="mt-2 text-xs text-slate-300 leading-relaxed">
              เพียงดับเบิ้ลคลิกไฟล์ <code class="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">start_portal.bat</code> ใน Agent Folder 
              ระบบจะเปิด Server ให้อัตโนมัติที่พอร์ต <code class="text-cyan-400">http://localhost:5050</code> และแสดง IP ประจำเครื่องที่บ้าน 
              ให้คุณเปิดดูผ่านอุปกรณ์ในบ้านหรืออุปกรณ์ที่เชื่อม VPN ได้ทันที
            </p>
          </div>

          <!-- Option 3 -->
          <div class="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
            <h4 class="text-sm font-bold text-purple-300 flex items-center gap-2">
              <i class="fa-solid fa-hard-drive text-base"></i> วิธีที่ 3: เปิดดูตรงๆ ด้วยเบราว์เซอร์ (Offline 100%)
            </h4>
            <p class="mt-2 text-xs text-slate-300 leading-relaxed">
              ไฟล์ <code class="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">index.html</code> ถูกออกแบบให้ฝังฐานข้อมูลสกิลในตัวทั้งหมด 
              คุณสามารถดับเบิ้ลคลิกเปิดไฟล์ <code class="text-purple-300">index.html</code> บนเครื่องไหนก็ได้โดยไม่ต้องต่ออินเทอร์เน็ต และสามารถค้นหาและคัดลอกพร็อมต์ได้ตามปกติ
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Skill Detail Modal -->
  <div id="detailModal" class="fixed inset-0 z-50 hidden bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
    <div class="w-full max-w-4xl max-h-[90vh] bg-cardBg border border-cardBorder rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-cardBorder flex items-center justify-between bg-slate-900/80">
        <div class="flex items-center gap-3">
          <span id="modal-category" class="px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-semibold">Category</span>
          <h3 id="modal-title" class="heading-font text-lg font-bold text-white truncate max-w-md">Skill Name</h3>
        </div>
        <button onclick="closeModal()" class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto flex-1 space-y-5">
        <div>
          <div class="text-xs text-slate-400 font-semibold mb-1">ตำแหน่งไฟล์ในคลังกลาง (Relative Path):</div>
          <code id="modal-path" class="text-xs text-cyan-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 block select-all">path/to/skill</code>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-semibold text-slate-400">คำสั่งเรียกใช้สกิล (Ready-to-use Prompt):</span>
            <button onclick="copyModalPrompt()" class="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
              <i class="fa-solid fa-copy"></i> คัดลอกพร็อมต์
            </button>
          </div>
          <div id="modal-prompt" class="p-3 rounded-xl bg-slate-950 border border-cyan-900/40 text-cyan-200 text-xs font-mono select-all">
            prompt goes here
          </div>
        </div>

        <div class="border-t border-slate-800 pt-4">
          <div class="text-xs font-semibold text-slate-400 mb-3">เนื้อหาคู่มือ / ขั้นตอนการทำงาน (Documentation):</div>
          <div id="modal-markdown" class="prose prose-invert prose-sm max-w-none bg-slate-950/60 p-5 rounded-xl border border-slate-800 overflow-x-auto text-slate-300">
            <!-- Rendered by marked.js -->
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3.5 border-t border-cardBorder bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
        <span id="modal-updated">อัปเดตล่าสุด: -</span>
        <button onclick="closeModal()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all">
          ปิดหน้าต่าง
        </button>
      </div>

    </div>
  </div>

  <!-- Footer -->
  <footer class="mt-auto border-t border-cardBorder py-6 text-center text-xs text-slate-500">
    <div class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div>AI Skills Hub & Central Sync Portal • Single Source of Truth Ecosystem</div>
      <div class="flex items-center gap-2">
        <span>อัปเดตอัตโนมัติ:</span>
        <span class="text-cyan-400 font-mono">${buildTimeStr}</span>
      </div>
    </div>
  </footer>

  <!-- EMBEDDED DATA -->
  <script>
    const SKILLS_DATA = ${JSON.stringify(items)};
    let currentCategory = 'ALL';
    let activeModalItem = null;

    // Toast helper
    function showToast(msg = 'คัดลอกสำเร็จแล้ว!') {
      const toast = document.getElementById('toast');
      document.getElementById('toast-message').innerText = msg;
      toast.classList.remove('translate-y-20', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
      setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
      }, 2500);
    }

    // Copy to clipboard
    function copyText(text, successMsg = 'คัดลอกพร็อมต์สำเร็จแล้ว!') {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg);
      }).catch(err => {
        console.error('Copy failed:', err);
      });
    }

    function copyElementText(id) {
      const el = document.getElementById(id);
      if (el) copyText(el.innerText);
    }

    // Switch Tabs
    function switchTab(tabId) {
      const tabs = ['catalog', 'prompts', 'guide', 'cloud'];
      tabs.forEach(t => {
        const section = document.getElementById('tab-' + t);
        const btn = document.getElementById('tab-btn-' + t);
        if (t === tabId) {
          section.classList.remove('hidden');
          btn.classList.add('active', 'bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
          btn.classList.remove('bg-slate-800/40', 'text-slate-400', 'border-transparent');
        } else {
          section.classList.add('hidden');
          btn.classList.remove('active', 'bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
          btn.classList.add('bg-slate-800/40', 'text-slate-400', 'border-transparent');
        }
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Category Selector
    function selectCategory(cat) {
      currentCategory = cat;
      document.querySelectorAll('.cat-pill').forEach(btn => {
        if ((cat === 'ALL' && btn.innerText.trim() === 'ทั้งหมด') || btn.innerText.trim() === cat) {
          btn.classList.add('active', 'bg-cyan-500', 'text-slate-950', 'font-bold');
          btn.classList.remove('bg-slate-800/80', 'text-slate-300');
        } else {
          btn.classList.remove('active', 'bg-cyan-500', 'text-slate-950', 'font-bold');
          btn.classList.add('bg-slate-800/80', 'text-slate-300');
        }
      });
      filterCards();
    }

    // Render Cards
    function renderCards(list) {
      const grid = document.getElementById('skillsGrid');
      if (list.length === 0) {
        grid.innerHTML = '<div class="col-span-full py-16 text-center text-slate-500"><i class="fa-solid fa-magnifying-glass text-3xl mb-3 block"></i>ไม่พบสกิลที่ตรงกับคำค้นหา</div>';
        return;
      }

      grid.innerHTML = list.map(item => {
        let badgeColor = 'bg-cyan-950/80 text-cyan-400 border-cyan-800';
        if (item.category === 'Software Engineering') badgeColor = 'bg-blue-950/80 text-blue-400 border-blue-800';
        else if (item.category === 'Audio & Voice AI') badgeColor = 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
        else if (item.category === 'Video Production') badgeColor = 'bg-rose-950/80 text-rose-400 border-rose-800';
        else if (item.category === 'Visual Architecture') badgeColor = 'bg-purple-950/80 text-purple-400 border-purple-800';
        else if (item.category === 'Core Operating System') badgeColor = 'bg-amber-950/80 text-amber-400 border-amber-800';

        return \`
          <div class="p-5 rounded-2xl bg-cardBg border border-cardBorder hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-lg hover:shadow-cyan-500/10">
            <div>
              <div class="flex items-center justify-between gap-2 mb-3">
                <span class="px-2.5 py-0.5 rounded-md border text-[11px] font-semibold \${badgeColor}">
                  \${item.category}
                </span>
                <span class="text-[11px] text-slate-500 truncate max-w-[140px]" title="\${item.relativePath}">
                  \${item.relativePath.split('/').slice(-1)[0]}
                </span>
              </div>

              <h4 class="heading-font text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                \${item.name}
              </h4>

              <p class="mt-2 text-xs text-slate-400 line-clamp-3 leading-relaxed">
                \${item.description}
              </p>
            </div>

            <div class="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <button onclick="copySkillPrompt('\${item.id}')" 
                      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold transition-all">
                <i class="fa-solid fa-copy"></i>
                <span>ก๊อปพร็อมต์</span>
              </button>

              <button onclick="openDetailModal('\${item.id}')" 
                      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all">
                <span>อ่านคู่มือ</span>
                <i class="fa-solid fa-arrow-right text-[10px]"></i>
              </button>
            </div>
          </div>
        \`;
      }).join('');
    }

    // Filter Cards Logic
    function filterCards() {
      const q = document.getElementById('searchInput').value.trim().toLowerCase();
      const filtered = SKILLS_DATA.filter(item => {
        const matchCat = (currentCategory === 'ALL' || item.category === currentCategory);
        if (!matchCat) return false;
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.relativePath.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      });
      renderCards(filtered);
    }

    // Copy Prompt by ID
    function copySkillPrompt(id) {
      const item = SKILLS_DATA.find(i => i.id === id);
      if (item) copyText(item.prompt, 'คัดลอกพร็อมต์สำหรับ ' + item.name + ' สำเร็จแล้ว!');
    }

    // Modal Details
    function openDetailModal(id) {
      const item = SKILLS_DATA.find(i => i.id === id);
      if (!item) return;
      activeModalItem = item;
      document.getElementById('modal-title').innerText = item.name;
      document.getElementById('modal-category').innerText = item.category;
      document.getElementById('modal-path').innerText = item.relativePath;
      document.getElementById('modal-prompt').innerText = item.prompt;
      document.getElementById('modal-updated').innerText = 'อัปเดตล่าสุด: ' + item.updatedDisplay;
      document.getElementById('modal-markdown').innerHTML = marked.parse(item.content);
      
      const modal = document.getElementById('detailModal');
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      const modal = document.getElementById('detailModal');
      modal.classList.add('hidden');
      document.body.style.overflow = '';
      activeModalItem = null;
    }

    function copyModalPrompt() {
      if (activeModalItem) {
        copyText(activeModalItem.prompt, 'คัดลอกพร็อมต์สำเร็จ!');
      }
    }

    // Close modal on click backdrop or Esc
    document.getElementById('detailModal').addEventListener('click', (e) => {
      if (e.target.id === 'detailModal') closeModal();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // Initial render
    renderCards(SKILLS_DATA);
  </script>
</body>
</html>
`;

const indexPath = path.join(PORTAL_DIR, 'index.html');
fs.writeFileSync(indexPath, htmlContent, 'utf8');
console.log(`✅ Web Portal index.html successfully generated at: ${indexPath}`);

console.log('====================================================');
console.log('🎉 BUILD COMPLETE!');
console.log(`📊 Total Items Indexed:  ${items.length}`);
console.log(`📦 Bundle Zip Size:      ${zipSizeMB} MB`);
console.log(`🌐 Open Portal File:     ${indexPath}`);
console.log('====================================================');
