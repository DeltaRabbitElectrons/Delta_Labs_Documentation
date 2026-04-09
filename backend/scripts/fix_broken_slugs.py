import asyncio
import os
import sys
import json
import logging

# Setup paths for local imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import connect_db, get_db
from app.github_client import write_file, _trigger_vercel_rebuild, list_all_docs
from app.routes.sidebar import generate_sidebars_ts

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fix_broken_slugs")

async def run_fix():
    print("Starting slug fix script...")
    await connect_db()
    db = get_db()

    # 1. Read all available document ids from GitHub
    print("Scanning GitHub for available document IDs...")
    available_slugs = list_all_docs()
    if not available_slugs:
        print("Error: Could not retrieve document list from GitHub.")
        return

    print(f"Found {len(available_slugs)} documents in GitHub.")

    # 2. Read sidebar_tree from MongoDB
    doc = await db.sidebar_tree.find_one({"_id": "main"})
    if not doc:
        print("Error: No sidebar tree found in database.")
        return
    
    tree = doc.get("tree", [])
    fix_log = []

    def find_best_slug(target: str) -> str | None:
        if target in available_slugs:
            return target
        
        # Try to find a match by filename if path is wrong (e.g. "introduction" -> "getting-started/introduction")
        target_name = target.split("/")[-1]
        for s in available_slugs:
            if s.split("/")[-1] == target_name:
                return s
        return None

    # 3. Recursive walker to fix slugs
    def walk(nodes):
        for node in nodes:
            if node.get("type") == "page":
                old_slug = node.get("slug")
                if not old_slug:
                    continue
                
                better_slug = find_best_slug(old_slug)
                if better_slug and better_slug != old_slug:
                    node["slug"] = better_slug
                    fix_log.append(f"FIXED: '{old_slug}' -> '{better_slug}' (Label: {node.get('label')})")
                elif not better_slug:
                    fix_log.append(f"WARNING: Slug '{old_slug}' not found in GitHub and no match found.")
            
            if node.get("children"):
                walk(node["children"])

    walk(tree)

    if not fix_log:
        print("No broken slugs found. Sidebar is already perfectly synced.")
    else:
        print("\nFix Report:")
        for log in fix_log:
            print(f" - {log}")
        
        # 4. Save fixed tree to MongoDB
        await db.sidebar_tree.update_one(
            {"_id": "main"},
            {"$set": {"tree": tree}}
        )
        print("\nFixed tree saved to MongoDB.")

        # 5. Regenerate sidebars.ts from the fixed tree
        new_sidebars_ts = generate_sidebars_ts(tree, available_slugs)

        # 6. Commit the new sidebars.ts to GitHub
        print("Committing fixes to GitHub...")
        write_file(
            path="docs-site/sidebars.ts",
            content=new_sidebars_ts,
            message="chore: automatic sidebar slug repair"
        )
        
        write_file(
            path="docs-site/sidebar-state.json",
            content=json.dumps(tree, indent=2),
            message="chore: automatic sidebar data repair"
        )

        # 7. Trigger Vercel rebuild
        print("Triggering Vercel rebuild...")
        _trigger_vercel_rebuild()
        print("SUCCESS: Full repair complete.")

if __name__ == "__main__":
    asyncio.run(run_fix())
