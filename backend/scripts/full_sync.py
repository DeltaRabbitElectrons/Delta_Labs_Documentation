
import asyncio
import os
import re
import json
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import requests
import base64

# Load environment variables
if os.path.exists('backend/.env'):
    load_dotenv('backend/.env')
elif os.path.exists('.env'):
    load_dotenv('.env')
else:
    load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')
DATABASE_NAME = os.getenv('DATABASE_NAME') or 'delta_labs_docs'
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GITHUB_REPO = os.getenv('GITHUB_REPO')
VERCEL_DEPLOY_HOOK_URL = os.getenv('VERCEL_DEPLOY_HOOK_URL')

if not MONGO_URI:
    print("ERROR: MONGO_URI not found in environment")
    exit(1)

client = AsyncIOMotorClient(MONGO_URI)
db = client[DATABASE_NAME]

GH_API = f"https://api.github.com/repos/{GITHUB_REPO}"
GH_HEADERS = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}

def derive_title(slug: str) -> str:
    if not slug:
        return ""
    return slug.split("/")[-1].replace("-", " ").title()

def strip_frontmatter(content: str) -> str:
    lines = content.split("\n")
    if lines and lines[0].strip() == "---":
        try:
            end = next(i for i, line in enumerate(lines[1:], 1) if line.strip() == "---")
            return "\n".join(lines[end+1:]).strip()
        except StopIteration:
            pass
    return content.strip()

async def get_github_docs_recursive():
    """Optimized: uses one request for tree + one per file (if needed)."""
    docs = {}
    
    # 1. Get the current master/main commit SHA
    ref_resp = requests.get(f"{GH_API}/git/ref/heads/main", headers=GH_HEADERS)
    if ref_resp.status_code != 200:
        ref_resp = requests.get(f"{GH_API}/git/ref/heads/master", headers=GH_HEADERS)
    
    if ref_resp.status_code != 200:
        print(f"Error fetching branch ref: {ref_resp.status_code}")
        return docs
        
    tree_sha = ref_resp.json()["object"]["sha"]
    
    # 2. Get recursive tree
    tree_url = f"{GH_API}/git/trees/{tree_sha}?recursive=1"
    tree_resp = requests.get(tree_url, headers=GH_HEADERS)
    if tree_resp.status_code != 200:
        print(f"Error fetching tree: {tree_resp.status_code}")
        return docs
    
    for item in tree_resp.json().get("tree", []):
        path = item["path"]
        if path.startswith("docs-site/docs/") and path.endswith(".md"):
            slug = path[len("docs-site/docs/"): -3].lstrip("/")
            # Use raw content endpoint to avoid more API requests if possible, but for now GitHub API is fine
            file_resp = requests.get(f"{GH_API}/contents/{path}", headers=GH_HEADERS)
            if file_resp.status_code == 200:
                raw = base64.b64decode(file_resp.json()["content"]).decode("utf-8")
                docs[slug] = raw
    return docs

async def write_github_file(path, content, message):
    url = f"{GH_API}/contents/{path}"
    # Get SHA if exists
    resp = requests.get(url, headers=GH_HEADERS)
    sha = resp.json().get("sha") if resp.status_code == 200 else None
    
    payload = {
        "message": message,
        "content": base64.b64encode(content.encode("utf-8")).decode("utf-8")
    }
    if sha: payload["sha"] = sha
    
    put_resp = requests.put(url, headers=GH_HEADERS, json=payload)
    return put_resp.status_code in (200, 201)

async def delete_github_file(path, message):
    url = f"{GH_API}/contents/{path}"
    resp = requests.get(url, headers=GH_HEADERS)
    if resp.status_code != 200: return False
    sha = resp.json().get("sha")
    
    payload = {"message": message, "sha": sha}
    del_resp = requests.delete(url, headers=GH_HEADERS, json=payload)
    return del_resp.status_code == 200

async def full_sync():
    print("=== STARTING FULL SYNC ===")
    
    # Step 1: Read GitHub and Upsert into MongoDB
    print("\n--- Step 1: Syncing GitHub -> MongoDB ---")
    gh_docs = await get_github_docs_recursive()
    for slug, raw_content in gh_docs.items():
        clean_content = strip_frontmatter(raw_content)
        await db.pages.update_one(
            {"slug": slug},
            {"$set": {
                "content": clean_content,
                "title": derive_title(slug),
                "updatedAt": datetime.now(timezone.utc)
            }},
            upsert=True
        )
    print(f"  Synced {len(gh_docs)} pages from GitHub to MongoDB.")

    # Step 2: Fix MongoDB sidebar_tree
    print("\n--- Step 2: Fixing MongoDB sidebar_tree ---")
    sidebar_doc = await db.sidebar_tree.find_one({"_id": "main"})
    tree = sidebar_doc.get("tree", []) if sidebar_doc else []
    
    def clean_tree(nodes):
        result = []
        for node in nodes:
            ntype = node.get("type")
            slug = node.get("slug")
            
            if ntype == "page":
                if not slug or slug not in gh_docs:
                    print(f"  Removing missing/invalid page from sidebar: {slug}")
                    continue
                # Strip prefixes
                node["slug"] = "/".join(re.sub(r'^\d+-', '', part) for part in slug.split("/"))
                result.append(node)
            elif ntype == "category":
                node["children"] = clean_tree(node.get("children", []))
                if node["children"]:
                    result.append(node)
                else:
                    print(f"  Removing empty category: {node.get('label')}")
        return result

    fixed_tree = clean_tree(tree)
    await db.sidebar_tree.update_one({"_id": "main"}, {"$set": {"tree": fixed_tree}}, upsert=True)
    
    # Step 3: Fix GitHub docs (MongoDB -> GitHub for missing ones + delete junk)
    print("\n--- Step 3: Syncing MongoDB -> GitHub ---")
    mongo_pages = await db.pages.find({}).to_list(1000)
    junk_patterns = [r'^new-?page', r'^untitled', r'^[a-z]$']
    
    for page in mongo_pages:
        slug = page.get("slug")
        if not slug: continue
        
        # Delete junk
        if any(re.match(p, slug, re.IGNORECASE) for p in junk_patterns):
            print(f"  Deleting junk page: {slug}")
            await db.pages.delete_one({"_id": page["_id"]})
            await delete_github_file(f"docs-site/docs/{slug}.md", f"cleanup: delete junk file {slug}")
            continue
            
        if slug not in gh_docs:
            print(f"  Creating missing GitHub file for: {slug}")
            title = (page.get("title") or "").strip() or derive_title(slug)
            fm = f"---\ntitle: {title}\nsidebar_label: {title}\n---\n\n"
            content = fm + page.get("content", f"# {title}\nStart writing here.")
            await write_github_file(f"docs-site/docs/{slug}.md", content, f"sync: create missing file {slug}")

    # Step 4: Regenerate sidebars.ts
    print("\n--- Step 4: Regenerating sidebars.ts ---")
    from app.routes.sidebar import generate_sidebars_ts
    ts_content = generate_sidebars_ts(fixed_tree)
    await write_github_file("docs-site/sidebars.ts", ts_content, "chore: master sync sidebars.ts")
    await write_github_file("docs-site/sidebar-state.json", json.dumps(fixed_tree, indent=2), "chore: master sync sidebar-state.json")

    # Step 5: Trigger Vercel rebuild
    print("\n--- Step 5: Triggering Vercel Rebuild ---")
    job_id = "N/A"
    if VERCEL_DEPLOY_HOOK_URL:
        v_resp = requests.post(VERCEL_DEPLOY_HOOK_URL)
        if v_resp.status_code in (200, 201, 202):
            job_id = v_resp.json().get("job", {}).get("id", "Triggered")
            print(f"  Vercel rebuild triggered. Job ID: {job_id}")
        else:
            print(f"  Vercel trigger failed: {v_resp.status_code}")
    else:
        print("  Skipping Vercel trigger (URL missing).")

    # Step 6: Print Report
    print("\n=== SYNC COMPLETE ===")
    print(f"Total pages in MongoDB: {len(mongo_pages)}")
    print(f"Total .md files in GitHub: {len(gh_docs)}")
    print(f"Sidebar nodes: {len(fixed_tree)}")
    print(f"Vercel Job ID: {job_id}")
    print("Sync complete — portal, GitHub and live site are in sync")

if __name__ == "__main__":
    asyncio.run(full_sync())
