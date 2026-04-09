
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def fix():
    url = os.getenv('MONGODB_URL')
    db_name = os.getenv('DATABASE_NAME')
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    doc = await db.sidebar_tree.find_one({"_id": "main"})
    
    def fix_node(nodes):
        for node in nodes:
            if node.get("type") == "page" and node.get("slug") == "intro":
                print(f"Fixing node: {node['label']}")
                node["slug"] = "getting-started/introduction"
            if node.get("children"):
                fix_node(node["children"])

    if doc:
        tree = doc["tree"]
        fix_node(tree)
        await db.sidebar_tree.update_one(
            {"_id": "main"},
            {"$set": {"tree": tree}}
        )
        print("MongoDB sidebar tree updated.")
    else:
        print("No sidebar tree to fix.")
    client.close()

if __name__ == '__main__':
    asyncio.run(fix())
