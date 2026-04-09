"""
FINAL FIX: Removes numbered prefixes from all slugs in MongoDB sidebar_tree.
Converts "00-getting-started/intro" → "getting-started/intro"
Run from backend/ directory:
    python scripts/fix_slugs_final.py
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
from app.github_client import write_file

# Use MONGODB_URL as per previous discovery
client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]

def fix_slug(slug: str) -> str:
    """Remove numbered prefix like 00-, 01-, 02- etc from slug."""
    if not slug:
        return slug
    # Remove pattern like "00-", "01-", "10-" at the start of each path segment
    parts = slug.split("/")
    fixed_parts = []
    for part in parts:
        # Remove leading number prefix: "00-getting-started" → "getting-started"
        fixed = re.sub(r'^\d+-', '', part)
        fixed_parts.append(fixed)
    return "/".join(fixed_parts)

def fix_tree(nodes: list) -> list:
    """Recursively fix all slugs in the tree."""
    fixed = []
    for node in nodes:
        fixed_node = {
            "id": node.get("id"),
            "type": node.get("type"),
            "label": node.get("label"),
            "slug": fix_slug(node.get("slug")) if node.get("slug") else None,
            "children": fix_tree(node.get("children", []))
        }
        fixed.append(fixed_node)
    return fixed

def generate_sidebars_ts(tree: list) -> str:
    def node_to_ts(node: dict, indent: int = 2) -> str:
        pad = " " * indent
        if node.get("type") == "page":
            slug = (node.get("slug") or "").strip()
            if not slug:
                return ""
            return f'{pad}"{slug}"'
        else:
            children = node.get("children") or []
            child_strings = [
                s for s in (node_to_ts(c, indent + 2) for c in children)
                if s and s.strip()
            ]
            if not child_strings:
                return ""
            label = (node.get("label") or "").replace('"', '\\"').strip()
            children_str = ",\n".join(child_strings)
            return (
                f'{pad}{{\n'
                f'{pad}  type: "category",\n'
                f'{pad}  label: "{label}",\n'
                f'{pad}  collapsible: true,\n'
                f'{pad}  collapsed: false,\n'
                f'{pad}  items: [\n{children_str}\n{pad}  ]\n'
                f'{pad}}}'
            )

    root_strings = [
        s for s in (node_to_ts(n) for n in tree) if s and s.strip()
    ]
    items_str = ",\n".join(root_strings)
    return (
        "import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';\n\n"
        "const sidebars: SidebarsConfig = {\n"
        "  tutorialSidebar: [\n"
        f"{items_str}\n"
        "  ],\n"
        "};\n\n"
        "export default sidebars;\n"
    )

async def fix_everything():
    # 1. Read current tree from MongoDB
    doc = await db.sidebar_tree.find_one({"_id": "main"})
    if not doc:
        print("ERROR: No sidebar_tree found in MongoDB.")
        return

    old_tree = doc["tree"]
    print(f"Found tree with {len(old_tree)} root nodes.")

    # 2. Fix all slugs
    fixed_tree = fix_tree(old_tree)

    # 3. Show what changed
    print("\nSlug fixes applied:")
    def show_fixes(old_nodes, new_nodes, depth=0):
        for old, new in zip(old_nodes, new_nodes or []):
            if old.get("slug") != new.get("slug"):
                print(f"  {'  ' * depth}{old.get('slug')} → {new.get('slug')}")
            show_fixes(old.get("children", []), new.get("children", []), depth + 1)
    show_fixes(old_tree, fixed_tree)

    # 4. Save fixed tree to MongoDB
    await db.sidebar_tree.update_one(
        {"_id": "main"},
        {"$set": {
            "tree": fixed_tree,
            "updated_at": "2025-03-09T00:00:00Z",
            "updated_by": "fix-slugs-script"
        }}
    )
    print("\nMongoDB updated with fixed slugs.")

    # 5. Generate and write correct sidebars.ts to GitHub
    print("Writing correct sidebars.ts to GitHub...")
    content = generate_sidebars_ts(fixed_tree)
    success = write_file(
        path="docs-site/sidebars.ts",
        content=content,
        message="fix: remove numbered prefixes from sidebar slugs (final fix)"
    )

    if success:
        print("SUCCESS: sidebars.ts written to GitHub with correct slugs.")
        print("Vercel will rebuild automatically.")
        print("\nFirst few lines of generated sidebars.ts:")
        for line in content.split("\n")[:15]:
            print(f"  {line}")
    else:
        print("ERROR: GitHub write failed.")

if __name__ == "__main__":
    asyncio.run(fix_everything())
