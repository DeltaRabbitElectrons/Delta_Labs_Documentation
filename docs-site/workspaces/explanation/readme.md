---
title: Ws:Explanation:Readme
sidebar_label: Ws:Explanation:Readme
id: readme
---

\# src/app/ — Next.js App Router  
  
\*\*Location:\*\* \`deltalabs-frontend/src/app/\`  
\*\*Type:\*\* Next.js App Router directory  
  
\---  
  
\## What It Does  
  
This is the \*\*routing layer\*\* of the application. Every folder inside \`src/app/\`  
maps directly to a URL. Every \`page.tsx\` file is a page users can visit.  
Every \`layout.tsx\` file wraps its children with shared UI (headers, sidebars, etc.).  
  
\## Why It Exists  
  
Next.js App Router uses the filesystem as the router. Instead of manually registering  
routes in a config file, you just create folders and files, and Next.js builds the  
routes automatically.  
  
\## Folder Structure  
  
\`\`\`  
src/app/  
├── layout.tsx ← Root HTML shell (wraps the ENTIRE application)  
├── globals.css ← Imports the design token CSS file  
├── favicon.ico ← Browser tab icon  
├── (app)/ ← Route group: authenticated pages  
│ ├── layout.tsx ← Layout for all authenticated pages (AppShell with sidebar/nav)  
│ ├── dashboard/ ← /dashboard page  
│ ├── enrolled-courses/← /enrolled-courses page  
│ └── features/ ← /features/\* pages (School management workspace)  
│ └── school/ ← /features/school/\* sub-pages  
└── (public)/ ← Route group: public/unauthenticated pages  
├── layout.tsx ← Layout for all public pages (simple header, no sidebar)  
├── page.tsx ← The landing page (root URL "/")  
├── login/ ← /login page  
├── signup/ ← /signup page  
├── explore/ ← /explore page  
├── ai/ ← /ai page  
├── audio/ ← /audio page  
├── simulation/ ← /simulation page  
├── privacy/ ← /privacy policy page  
└── terms/ ← /terms of service page  
\`\`\`  
  
\## Route Groups \`(app)\` and \`(public)\`  
  
Folders in parentheses like \`(app)\` and \`(public)\` are \*\*Route Groups\*\*.  
The parentheses tell Next.js: "group these routes together but do NOT add this  
folder name to the URL." So \`(app)/dashboard/page.tsx\` resolves to \`/dashboard\`,  
not \`/app/dashboard\`.  
  
The benefit: authenticated pages share one layout (with the full sidebar/nav),  
while public pages share a completely different layout (minimal header only).  
  
\## The \`api/\` Sub-folder  
  
\`src/app/api/\` contains \*\*Next.js API Routes\*\* — small serverless functions that run  
on the server. The only one currently present is \`api/health/route.ts\`, which is a  
simple health-check endpoint (\`GET /api/health\` returns \`{ status: "ok" }\`).  
These are used by deployment platforms to check the app is alive.
