import os
import asyncio
import motor.motor_asyncio
import re
from dotenv import load_dotenv

load_dotenv()

def clean_slug(slug: str) -> str:
    if not slug:
        return ""
    # Strip numbers like 00- from each part of the slug path
    return "/".join(re.sub(r'^\d+-', '', part) for part in slug.split("/"))

def generate_sidebars_ts(tree: list) -> str:
    def node_to_ts(node: dict, indent: int = 2) -> str:
        pad = " " * indent
        if node["type"] == "page":
            return f'{pad}"{clean_slug(node["slug"])}"'
        else:
            children_str = ",\n".join(
                node_to_ts(child, indent + 2) for child in node.get("children", [])
            )
            return (
                f'{pad}{{\n'
                f'{pad}  type: "category",\n'
                f'{pad}  label: "{node["label"]}",\n'
                f'{pad}  collapsible: true,\n'
                f'{pad}  collapsed: false,\n'
                f'{pad}  items: [\n{children_str}\n{pad}  ]\n'
                f'{pad}}}'
            )

    items_str = ",\n".join(node_to_ts(node) for node in tree)
    return f"""import type {{SidebarsConfig}} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {{
  tutorialSidebar: [
{items_str}
  ],
}};

export default sidebars;
"""

async def run_force_sync():
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv('MONGODB_URL'))
    db = client[os.getenv('DATABASE_NAME')]
    
    doc = await db.sidebar_tree.find_one({'_id': 'main'})
    if not doc:
        print("No sidebar tree found in MongoDB!")
        return
    
    tree = doc['tree']
    print(f"Loaded tree with {len(tree)} root categories. Generating cleaned sidebars.ts...")
    
    content = generate_sidebars_ts(tree)
    
    # Use the existing github_client logic if possible, or just write directly since it's a script
    import sys
    sys.path.append(os.getcwd())
    from app.github_client import write_file
    
    success = write_file('docs-site/sidebars.ts', content, 'fix: final force sync of cleaned sidebar slugs for Docusaurus v3 build')
    if success:
        print("SUCCESS: New sidebars.ts pushed to GitHub. Check Vercel build status.")
    else:
        print("FAILED: Could not write to GitHub.")

if __name__ == '__main__':
    asyncio.run(run_force_sync())
