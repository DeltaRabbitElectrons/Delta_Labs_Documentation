import asyncio
import os
import json
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv('.env')
MONGO_URI = os.getenv('MONGO_URI')

async def deduplicate_sidebar():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client['deltalabs']
    doc = await db.sidebar_tree.find_one({"_id": "main"})
    if not doc: return

    def dedupe(nodes):
        seen = set()
        result = []
        for n in nodes:
            if n.get("type") == "page":
                slug = n.get("slug")
                if slug in seen: continue
                seen.add(slug)
                result.append(n)
            elif n.get("type") == "category":
                n["children"] = dedupe(n.get("children", []))
                result.append(n)
            else:
                result.append(n)
        return result

    fixed_tree = dedupe(doc.get("tree", []))
    await db.sidebar_tree.update_one({"_id": "main"}, {"$set": {"tree": fixed_tree}})
    print("Deduplicated sidebar tree in MongoDB")

if __name__ == "__main__":
    asyncio.run(deduplicate_sidebar())
