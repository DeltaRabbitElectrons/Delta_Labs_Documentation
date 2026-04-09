
import asyncio
import os
import re
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
if os.path.exists('backend/.env'):
    load_dotenv('backend/.env')
elif os.path.exists('.env'):
    load_dotenv('.env')
else:
    load_dotenv() # fallback to system env

MONGO_URI = os.getenv('MONGO_URI')
DATABASE_NAME = os.getenv('DATABASE_NAME') or 'delta_labs_docs'
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GITHUB_REPO = os.getenv('GITHUB_REPO')

if not MONGO_URI:
    print("ERROR: MONGO_URI not found in environment")
    exit(1)

client = AsyncIOMotorClient(MONGO_URI)
db = client[DATABASE_NAME]

def derive_title(slug: str) -> str:
    if not slug:
        return ""
    return slug.split("/")[-1].replace("-", " ").title()

async def fetch_github_content(slug: str):
    # Minimal github fetch without extra dependencies
    import requests
    url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/docs-site/docs/{slug}.md"
    headers = {"Authorization": f"token {GITHUB_TOKEN}"}
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            import base64
            content = base64.b64decode(resp.json()["content"]).decode("utf-8")
            # Strip frontmatter
            if content.startswith("---"):
                parts = content.split("---", 2)
                if len(parts) >= 3:
                    return parts[2].strip()
            return content.strip()
    except Exception as e:
        print(f"  Warning: Could not fetch {slug} from GitHub: {e}")
    return ""

async def fix_pages():
    print("--- Fixing pages collection ---")
    pages = await db.pages.find({}).to_list(1000)
    seen_slugs = {}
    
    for p in pages:
        page_id = p["_id"]
        slug = p.get("slug")
        
        # 1. Remove documents with null or empty slug
        if not slug or not slug.strip():
            print(f"  Removing page with missing slug: {page_id}")
            await db.pages.delete_one({"_id": page_id})
            continue
            
        slug = slug.strip()
        
        # 2. De-duplication: keep the one with most recent content (or just updatedAt)
        if slug in seen_slugs:
            old_p = seen_slugs[slug]
            # If current is newer, delete old, else delete current
            if p.get("updatedAt", "") > old_p.get("updatedAt", ""):
                print(f"  Removing duplicate slug (older): {slug} ({old_p['_id']})")
                await db.pages.delete_one({"_id": old_p["_id"]})
                seen_slugs[slug] = p
            else:
                print(f"  Removing duplicate slug (duplicate): {slug} ({page_id})")
                await db.pages.delete_one({"_id": page_id})
                continue
        else:
            seen_slugs[slug] = p
            
        # 3. Ensure fields and types
        title = p.get("title") or derive_title(slug)
        sidebar_label = p.get("sidebar_label") or title
        content = p.get("content", "")
        
        if not content:
            print(f"  Content empty for {slug}, fetching from GitHub...")
            content = await fetch_github_content(slug)
            
        change_log = p.get("change_log")
        if not isinstance(change_log, list):
            change_log = []
            
        # Fix change_log entries
        fixed_log = []
        for entry in change_log:
            if isinstance(entry, dict):
                fixed_log.append({
                    "admin_name": str(entry.get("admin_name", "Admin")),
                    "edited_at": entry.get("edited_at") or datetime.now(timezone.utc).isoformat(),
                    "message": str(entry.get("message", "Updated content"))
                })
        
        isDraft = p.get("isDraft")
        if not isinstance(isDraft, bool):
            isDraft = False
            
        updates = {
            "slug": slug,
            "title": title,
            "sidebar_label": sidebar_label,
            "content": content,
            "change_log": fixed_log,
            "isDraft": isDraft
        }
        
        await db.pages.update_one({"_id": page_id}, {"$set": updates})

async def fix_sidebar_tree():
    print("--- Fixing sidebar_tree collection ---")
    docs = await db.sidebar_tree.find({}).to_list(100)
    if len(docs) > 1:
        print(f"  Found {len(docs)} documents in sidebar_tree, merging into one...")
        # Keep the most recent one
        docs.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        main_doc = docs[0]
        for d in docs[1:]:
            await db.sidebar_tree.delete_one({"_id": d["_id"]})
    elif len(docs) == 0:
        print("  Creating missing sidebar_tree document...")
        await db.sidebar_tree.insert_one({"_id": "main", "tree": []})
        return

    doc = await db.sidebar_tree.find_one({"_id": "main"})
    tree = doc.get("tree", [])

    def clean_nodes(nodes):
        result = []
        for node in nodes:
            label = node.get("label")
            slug = node.get("slug")
            ntype = node.get("type")
            
            if not label or (ntype == "page" and not slug):
                print(f"  Removing invalid node: {label} (slug={slug})")
                continue
                
            if slug:
                # Strip numbered prefixes
                slug = "/".join(re.sub(r'^\d+-', '', part) for part in slug.split("/"))
                node["slug"] = slug
                
            if ntype == "category":
                children = clean_nodes(node.get("children" , []))
                if not children:
                    print(f"  Removing empty category: {label}")
                    continue
                node["children"] = children
                
            result.append(node)
        return result

    cleaned_tree = clean_nodes(tree)
    await db.sidebar_tree.update_one({"_id": "main"}, {"$set": {"tree": cleaned_tree}})

async def fix_admins():
    print("--- Fixing admins/users collection ---")
    # Check both 'admins' and 'users' just in case
    collections = await db.list_collection_names()
    target = 'users' if 'users' in collections else 'admins'
    if target not in collections:
        print(f"  Warning: Neither 'users' nor 'admins' collection found.")
        return

    admins = await db[target].find({}).to_list(100)
    for a in admins:
        name = a.get("name", "Unknown")
        initials = "".join([n[0].upper() for n in name.split() if n])
        
        updates = {
            "role": "admin",
            "avatar_initials": a.get("avatar_initials") or initials
        }
        await db[target].update_one({"_id": a["_id"]}, {"$set": updates})
        print(f"  Updated admin: {a.get('email')} ({initials})")

async def main():
    await fix_pages()
    await fix_sidebar_tree()
    await fix_admins()
    print("\n--- Database fix complete ---")

if __name__ == "__main__":
    asyncio.run(main())
