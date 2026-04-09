import asyncio
import os
import sys

# Setup imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import connect_db, get_db

async def main():
    await connect_db()
    db = get_db()
    
    # Get sidebar
    doc = await db.sidebar_tree.find_one({"_id": "main"})
    if not doc:
        print("No sidebar found!")
        return
        
    tree = doc.get("tree", [])
    fixed = False
    
    def walk(nodes):
        nonlocal fixed
        for node in nodes:
            if node.get("type") == "page":
                if node.get("slug") == "introduction":
                    node["slug"] = "getting-started/introduction"
                    fixed = True
                    print("Fixed 'introduction' slug to 'getting-started/introduction'")
            elif node.get("type") == "category":
                walk(node.get("children", []))
    
    walk(tree)
    
    if fixed:
        await db.sidebar_tree.update_one(
            {"_id": "main"},
            {"$set": {"tree": tree}}
        )
        print("Sidebar tree updated in DB.")
    else:
        print("No 'introduction' slug found to fix.")

if __name__ == "__main__":
    asyncio.run(main())
