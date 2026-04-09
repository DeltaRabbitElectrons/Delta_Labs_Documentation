import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()

import asyncio
import motor.motor_asyncio
from app.config import settings
from app.github_client import get_repo

# Setup MongoDB client
client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URI)
db = client[settings.DATABASE_NAME]

def node_to_ts(node, indent=2):
    pad = " " * indent
    if node.get("type") == "page":
        slug = node.get("slug", "")
        if not slug:
            return ""
        return f'{pad}"{slug}"'
    elif node.get("type") == "category":
        label = node.get("label", "").replace('"', '\\"')
        children = node.get("children", [])
        child_lines = []
        for child in children:
            line = node_to_ts(child, indent + 2)
            if line.strip():
                child_lines.append(line)
        if not child_lines:
            return ""
        items = ",\n".join(child_lines)
        return f'''{pad}{{
{pad}  type: "category",
{pad}  label: "{label}",
{pad}  collapsible: true,
{pad}  collapsed: false,
{pad}  items: [
{items}
{pad}  ]
{pad}}}'''
    return ""

async def regenerate():
    print("Reading sidebar tree from MongoDB...")
    doc = await db.sidebar_tree.find_one({"_id": "main"})
    if not doc:
        # Try finding any document if 'main' doesn't exist
        doc = await db.sidebar_tree.find_one({})
        
    if not doc:
        print("ERROR: No sidebar_tree found in MongoDB")
        return
    
    tree = doc.get("tree", [])
    print(f"Found {len(tree)} top level nodes")
    
    node_lines = []
    for node in tree:
        line = node_to_ts(node, indent=2)
        if line.strip():
            node_lines.append(line)
    
    items = ",\n".join(node_lines)
    
    sidebars_content = f'''import type {{SidebarsConfig}} from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {{
  tutorialSidebar: [
{items}
  ]
}};

export default sidebars;
'''
    
    print("Generated sidebars.ts:")
    print(sidebars_content[:500])
    print("...")
    
    repo = get_repo()
    
    try:
        existing = repo.get_contents("docs-site/sidebars.ts")
        repo.update_file(
            path="docs-site/sidebars.ts",
            message="fix: emergency regenerate sidebars.ts from MongoDB",
            content=sidebars_content,
            sha=existing.sha
        )
        print("SUCCESS: sidebars.ts updated on GitHub")
    except Exception as e:
        print(f"ERROR updating sidebars.ts: {e}")
        return
    
    from app.github_client import _trigger_vercel_rebuild
    result = _trigger_vercel_rebuild()
    print(f"Vercel rebuild triggered: {result}")
    print("Done! Build should succeed now.")

if __name__ == "__main__":
    asyncio.run(regenerate())
