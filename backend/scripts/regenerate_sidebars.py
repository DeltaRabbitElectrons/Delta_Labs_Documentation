"""
Nuclear fix: regenerate sidebars.ts completely from MongoDB.
Overwrites whatever is currently broken on GitHub.
Run from backend/ directory:
    python scripts/regenerate_sidebars.py
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

# Fixed attribute name to settings.MONGODB_URL
client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]

def generate_sidebars_ts(tree: list) -> str:
    def node_to_ts(node: dict, indent: int = 2) -> str:
        pad = " " * indent

        if node["type"] == "page":
            slug = node.get("slug", "").strip()
            if not slug:
                return ""
            return f'{pad}"{slug}"'

        else:  # category
            children = node.get("children", [])
            child_strings = [
                s for s in (node_to_ts(c, indent + 2) for c in children)
                if s.strip()
            ]
            if not child_strings:
                return ""  # skip empty categories

            children_str = ",\n".join(child_strings)
            label = node.get("label", "").replace('"', '\\"').strip()

            return (
                f'{pad}{{\n'
                f'{pad}  type: "category",\n'
                f'{pad}  label: "{label}",\n'
                f'{pad}  collapsible: true,\n'
                f'{pad}  collapsed: false,\n'
                f'{pad}  items: [\n{children_str}\n{pad}  ]\n'
                f'{pad}}}'
            )

    root_items = [
        s for s in (node_to_ts(n) for n in tree)
        if s.strip()
    ]
    items_str = ",\n".join(root_items)

    return (
        "import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';\n\n"
        "const sidebars: SidebarsConfig = {\n"
        "  tutorialSidebar: [\n"
        f"{items_str}\n"
        "  ],\n"
        "};\n\n"
        "export default sidebars;\n"
    )

async def regenerate():
    doc = await db.sidebar_tree.find_one({"_id": "main"})
    if not doc:
        print("ERROR: No sidebar_tree in MongoDB.")
        return

    tree = doc["tree"]
    content = generate_sidebars_ts(tree)

    print("Generated sidebars.ts preview (first 30 lines):")
    for i, line in enumerate(content.split("\n")[:30], 1):
        print(f"{i}: {line}")

    success = write_file(
        path="docs-site/sidebars.ts",
        content=content,
        message="fix: regenerate sidebars.ts from MongoDB (repair syntax error)"
    )

    if success:
        print("\nSUCCESS: Fresh sidebars.ts written to GitHub.")
        print("Vercel will rebuild automatically.")
    else:
        print("\nERROR: GitHub write failed.")

if __name__ == "__main__":
    asyncio.run(regenerate())
