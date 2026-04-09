"""
Removes empty categories from MongoDB sidebar_tree.
Run from backend/ directory:
    python scripts/remove_empty_categories.py
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import motor.motor_asyncio
from app.config import settings
from app.github_client import write_file

client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]

def clean_tree(nodes: list) -> list:
    cleaned = []
    for node in nodes:
        if node.get("type") == "category":
            # Recursively clean children first
            clean_children = clean_tree(node.get("children", []))
            if clean_children:  # only keep category if it has children
                cleaned.append({**node, "children": clean_children})
            else:
                print(f"  Removing empty category: '{node.get('label')}'")
        else:
            cleaned.append(node)
    return cleaned

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

async def remove_empty():
    doc = await db.sidebar_tree.find_one({"_id": "main"})
    if not doc:
        print("ERROR: No sidebar_tree found")
        return

    original_tree = doc["tree"]
    cleaned_tree = clean_tree(original_tree)

    if len(cleaned_tree) == len(original_tree):
        print("No empty categories found in root level.")
    
    # Save cleaned tree to MongoDB
    await db.sidebar_tree.update_one(
        {"_id": "main"},
        {"$set": {"tree": cleaned_tree}}
    )
    print(f"\nMongoDB updated.")

    # Write clean sidebars.ts to GitHub
    content = generate_sidebars_ts(cleaned_tree)
    success = write_file(
        path="docs-site/sidebars.ts",
        content=content,
        message="chore: remove empty categories from sidebar"
    )
    if success:
        print("GitHub sidebars.ts updated. Vercel will rebuild.")
    else:
        print("ERROR: GitHub write failed.")

asyncio.run(remove_empty())
