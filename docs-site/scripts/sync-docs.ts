import fs from 'fs';
import path from 'path';

/**
 * 🌠 Delta Labs: Workspace Sync Script
 * This script bridges the gap between our dynamic MongoDB content 
 * and Docusaurus's static-site requirements.
 * 
 * Runs as a pre-build step: `npm run prebuild:sync`
 * 
 * Bug #3 Fix: Added backend warmup, retry logic, and graceful failure
 * so a sleeping Render backend or network blip doesn't crash the entire build.
 */

const API_URL = process.env.API_URL || 'https://delta-labs-backend.onrender.com';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic + backend warm-up
 */
async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`  ↳ Attempt ${attempt}/${retries}: GET ${url}`);
      const response = await fetch(url, {
        signal: AbortSignal.timeout(60000),  // 60s timeout (Render cold start can be slow)
      });
      if (response.ok) return response;
      console.warn(`  ⚠️ Attempt ${attempt} failed: ${response.status} ${response.statusText}`);
    } catch (err: any) {
      console.warn(`  ⚠️ Attempt ${attempt} failed: ${err.message || err}`);
    }
    if (attempt < retries) {
      console.log(`  ⏳ Waiting ${RETRY_DELAY_MS / 1000}s before retry...`);
      await sleep(RETRY_DELAY_MS);
    }
  }
  throw new Error(`All ${retries} fetch attempts failed for ${url}`);
}

async function sync() {
  console.log('🔄 Starting Workspace Sync...');
  console.log(`   API: ${API_URL}`);
  
  try {
    // 1. Wake up the backend (Render free tier sleeps after 15m of inactivity)
    console.log('\n🏓 Pinging backend to wake it up...');
    try {
      await fetchWithRetry(`${API_URL}/`, 2);
      console.log('   ✅ Backend is awake');
    } catch {
      console.warn('   ⚠️ Backend warm-up ping failed, continuing anyway...');
    }

    // 2. Fetch workspace export data
    console.log('\n📡 Fetching workspace data...');
    const response = await fetchWithRetry(`${API_URL}/workspaces/export-all`);
    const data: Record<string, any> = await response.json();

    const workspaceSlugs = Object.keys(data).filter(s => s !== 'docs');
    console.log(`   Found ${workspaceSlugs.length} custom workspace(s): ${workspaceSlugs.join(', ') || '(none)'}`);

    const dynamicDocsDir = path.join(process.cwd(), 'workspaces');

    // Clean up existing dynamic documents folder (this will be rebuilt from MongoDB)
    if (fs.existsSync(dynamicDocsDir)) {
      fs.rmSync(dynamicDocsDir, { recursive: true, force: true });
    }
    fs.mkdirSync(dynamicDocsDir, { recursive: true });

    // 3. Iterate through each workspace from the backend
    for (const [slug, workspace] of Object.entries(data)) {
      // Skip the root 'docs' workspace as it's directly synced to GitHub in realtime
      if (slug === 'docs') continue; 

      console.log(`\n📂 Syncing workspace: ${workspace.name} (${slug})`);
      
      const wsDir = path.join(dynamicDocsDir, slug);
      if (!fs.existsSync(wsDir)) {
        fs.mkdirSync(wsDir, { recursive: true });
      }

      // 3a. Process Pages (Save as .md files)
      const pages = workspace.pages || [];
      console.log(`   📄 ${pages.length} page(s) to sync`);

      for (const page of pages) {
        if (!page.slug) {
          console.warn(`   ⚠️ Skipping page with empty slug (title: "${page.title}")`);
          continue;
        }

        // Clean the slug — remove any residual ws: prefixes
        let cleanSlug = page.slug;
        const wsPrefix = `ws:${slug}:`;
        while (cleanSlug.startsWith(wsPrefix)) {
          cleanSlug = cleanSlug.slice(wsPrefix.length);
        }
        // Also sanitize colons for filesystem safety
        const safeSlug = cleanSlug.replace(/:/g, '-');

        // Ensure subdirectories exist if slug contains slashes
        const filePath = path.join(wsDir, `${safeSlug}.md`);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const frontmatter = [
          '---',
          `id: ${safeSlug}`,
          `title: "${(page.title || safeSlug).replace(/"/g, '\\"')}"`,
          `sidebar_label: "${(page.sidebar_label || page.title || safeSlug).replace(/"/g, '\\"')}"`,
          `sidebar_position: ${page.sidebar_position || 1}`,
          '---',
          '',
          page.content || ''
        ].join('\n');

        fs.writeFileSync(filePath, frontmatter);
        console.log(`   ✅ ${safeSlug}.md`);
      }

      // 3b. Process Sidebar (Generate sidebars-[slug].json)
      const sidebarTree = workspace.sidebar_tree || [];
      const sidebarPath = path.join(process.cwd(), `sidebars-${slug}.json`);
      const sidebarConfig = {
        // We use the slug as the sidebar name for isolation
        [`sidebar_${slug}`]: transformSidebar(sidebarTree)
      };
      
      fs.writeFileSync(sidebarPath, JSON.stringify(sidebarConfig, null, 2));
      console.log(`   📑 Sidebar saved: sidebars-${slug}.json`);
    }

    console.log('\n✨ Sync completed successfully!');
  } catch (error) {
    console.error('\n⚠️ Sync failed:', error);
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  Sync failed — building with existing Git workspace     ║');
    console.log('║  data. Custom workspaces may be stale or missing.       ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
    // DON'T process.exit(1) — let Docusaurus build with whatever exists in Git.
    // The main "docs" workspace is always synced directly to GitHub in realtime,
    // so it will always be up-to-date. Only custom workspaces may be stale.
  }
}

/**
 * Transforms the MongoDB sidebar tree into a Docusaurus-compatible structure.
 * Cleans slugs to remove any workspace prefixes that may have leaked through.
 */
function transformSidebar(nodes: any[]): any[] {
  if (!Array.isArray(nodes)) return [];
  
  return nodes.map(node => {
    if (node.type === 'page') {
      const slug = (node.slug || '').replace(/:/g, '-');
      if (!slug) return null;
      return {
        type: 'doc',
        id: slug,
        label: node.label || slug
      };
    } else if (node.type === 'category') {
      const items = transformSidebar(node.children || []);
      if (items.length === 0) return null;  // Skip empty categories
      return {
        type: 'category',
        label: node.label || 'Untitled',
        collapsible: true,
        collapsed: false,
        items
      };
    }
    return null;
  }).filter(Boolean);
}

// Run it!
sync();
