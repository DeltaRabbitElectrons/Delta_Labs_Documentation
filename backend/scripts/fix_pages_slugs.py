"""
Fixes numbered-prefix slugs in the MongoDB pages collection.
Converts '00-getting-started/introduction' → 'getting-started/introduction'
Also fixes the sidebar_tree slugs via fix_slugs_final.py logic.

Run from backend/ directory:
    python scripts/fix_pages_slugs.py
"""
import asyncio
import sys
import os
import re
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import motor.motor_asyncio
from app.config import settings

client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]


def clean_slug(slug: str) -> str:
    """Remove numbered prefixes from each path segment.
    '00-getting-started/01-introduction' → 'getting-started/introduction'
    """
    if not slug:
        return slug
    parts = slug.split("/")
    return "/".join(re.sub(r'^\d+-', '', part) for part in parts)


async def fix_pages():
    pages = await db.pages.find({}, {"slug": 1, "content": 1}).to_list(10000)
    print(f"Found {len(pages)} pages in MongoDB\n")

    fixed = 0
    skipped = 0
    conflicts = 0

    for page in pages:
        old_slug = page.get("slug", "")
        new_slug = clean_slug(old_slug)

        if old_slug == new_slug:
            skipped += 1
            continue

        # Check if a page with the clean slug already exists
        existing = await db.pages.find_one({"slug": new_slug})
        if existing:
            print(f"  CONFLICT: '{old_slug}' → '{new_slug}' already exists — merging content")
            # Keep whichever has real content
            old_content = page.get("content", "")
            new_content = existing.get("content", "")
            if old_content and not new_content:
                await db.pages.update_one(
                    {"slug": new_slug},
                    {"$set": {"content": old_content}}
                )
                print(f"    Merged content from prefixed into clean slug")
            # Delete the prefixed duplicate
            await db.pages.delete_one({"_id": page["_id"]})
            conflicts += 1
            continue

        # Rename: update the slug field
        await db.pages.update_one(
            {"_id": page["_id"]},
            {"$set": {"slug": new_slug}}
        )
        print(f"  FIXED: '{old_slug}' → '{new_slug}'")
        fixed += 1

    print(f"\n{'='*50}")
    print(f"Pages slug fix complete!")
    print(f"  Fixed:     {fixed}")
    print(f"  Conflicts (merged+deleted): {conflicts}")
    print(f"  Already clean: {skipped}")
    print(f"\nPortal should now find pages correctly.")


async def fix_sidebar_tree():
    """Also fix sidebar_tree slugs in MongoDB."""
    doc = await db.sidebar_tree.find_one({"_id": "main"})
    if not doc:
        print("\nNo sidebar_tree found — skipping sidebar fix.")
        return

    def fix_tree(nodes):
        return [
            {
                **node,
                "slug": clean_slug(node["slug"]) if node.get("slug") else None,
                "children": fix_tree(node.get("children", []))
            }
            for node in nodes
        ]

    old_tree = doc["tree"]
    fixed_tree = fix_tree(old_tree)

    await db.sidebar_tree.update_one(
        {"_id": "main"},
        {"$set": {"tree": fixed_tree}}
    )
    print("\nSidebar tree slugs also cleaned in MongoDB.")


async def main():
    print("=== Step 1: Fix pages collection slugs ===\n")
    await fix_pages()

    print("\n=== Step 2: Fix sidebar_tree slugs ===")
    await fix_sidebar_tree()


asyncio.run(main())
