import asyncio
import os
import sys
import json
import logging
from datetime import datetime, timezone

# Setup paths for local imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import connect_db, get_db
from app.github_client import write_file, _trigger_vercel_rebuild, list_all_docs, get_repo
from app.routes.sidebar import generate_sidebars_ts

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nuclear_fix_slugs")

async def run_nuclear_fix():
    print("Starting NUCLEAR slug fix script...")
    await connect_db()
    db = get_db()

    # Step 1 — Get ALL valid document ids from GitHub
    print("Step 1: Scanning GitHub for valid document IDs...")
    valid_slugs = list_all_docs()
    if not valid_slugs:
        print("ERROR: Could not retrieve document list from GitHub.")
        return
    print(f"Found {len(valid_slugs)} valid documents in GitHub.")
    valid_slugs_set = set(valid_slugs)

    # Step 2 — Read sidebar_tree from MongoDB
    print("Step 2: Reading sidebar tree from MongoDB...")
    doc = await db.sidebar_tree.find_one({"_id": "main"})
    if not doc:
        print("ERROR: No sidebar tree found in database.")
        return
    
    tree = doc.get("tree", [])
    fix_count = 0
    remove_count = 0
    report = []

    def find_closest_match(bad_slug, label):
        # 1. Check if any valid slug ends with bad_slug (ignoring typo suffix like 'a')
        # Actually, let's just check if the last part of a valid slug matches the last part of bad_slug
        bad_name = bad_slug.split("/")[-1]
        # Common typos: introductiona -> introduction
        if bad_name.endswith('a') or bad_name.endswith('s'):
            stem = bad_name[:-1]
            for s in valid_slugs:
                if s.split("/")[-1] == stem:
                    return s
        
        for s in valid_slugs:
            if s.split("/")[-1] == bad_name:
                return s

        # 2. Check if label matches any valid slug
        if label:
            normalized_label = label.lower().replace(" ", "-").replace("/", "-")
            for s in valid_slugs:
                if s.split("/")[-1] == normalized_label:
                    return s
        
        return None

    # Step 3 — Walk every single node in the tree recursively
    print("Step 3: Walking and cleaning the tree...")
    def walk(nodes):
        nonlocal fix_count, remove_count
        cleaned_nodes = []
        for node in nodes:
            if node.get("type") == "page":
                old_slug = node.get("slug")
                label = node.get("label")
                
                if old_slug in valid_slugs_set:
                    cleaned_nodes.append(node)
                    continue
                
                # Slug is invalid, try to fix it
                match = find_closest_match(old_slug, label)
                if match:
                    node["slug"] = match
                    report.append(f"FIXED: '{old_slug}' -> '{match}' (Label: {label})")
                    fix_count += 1
                    cleaned_nodes.append(node)
                else:
                    report.append(f"REMOVED: Invalid slug '{old_slug}' (Label: {label}) - No match found.")
                    remove_count += 1
            elif node.get("type") == "category":
                children = node.get("children", [])
                node["children"] = walk(children)
                # Keep category if it has children
                if node["children"]:
                    cleaned_nodes.append(node)
                else:
                    report.append(f"REMOVED: Empty category '{node.get('label')}'")
                    remove_count += 1
            else:
                cleaned_nodes.append(node)
        return cleaned_nodes

    cleaned_tree = walk(tree)

    # Step 4 — Save the cleaned tree back to MongoDB
    print(f"Step 4: Saving cleaned tree to MongoDB...")
    await db.sidebar_tree.update_one(
        {"_id": "main"},
        {"$set": {"tree": cleaned_tree, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    # Step 5 — Regenerate sidebars.ts from the clean tree
    print("Step 5: Regenerating sidebars.ts...")
    sidebars_content = generate_sidebars_ts(cleaned_tree, valid_slugs=valid_slugs)
    
    if not sidebars_content:
        print("ERROR: sidebars.ts generation failed validation.")
        return

    # Step 6 — Commit sidebars.ts to GitHub
    print("Step 6: Committing to GitHub...")
    success = write_file(
        path="docs-site/sidebars.ts",
        content=sidebars_content,
        message="chore: nuclear sidebar slug repair and cleanup"
    )
    
    # Also update sidebar-state.json
    write_file(
        path="docs-site/sidebar-state.json",
        content=json.dumps(cleaned_tree, indent=2),
        message="chore: sync sidebar metadata"
    )

    # Step 7 — Trigger Vercel rebuild
    job_id = "FAILED"
    if success:
        print("Step 7: Triggering Vercel rebuild...")
        if _trigger_vercel_rebuild():
            job_id = "TRIGGERED"

    # Step 8 — Print full report
    print("\n" + "="*40)
    print("NUCLEAR FIX REPORT")
    print("="*40)
    for line in report:
        print(line)
    print("-" * 20)
    print(f"Fixed {fix_count} slugs")
    print(f"Removed {remove_count} invalid nodes")
    print(f"sidebars.ts committed successfully: {success}")
    print(f"Vercel rebuild triggered: {job_id}")
    print("="*40)

if __name__ == "__main__":
    asyncio.run(run_nuclear_fix())
