
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import json

load_dotenv()

async def check():
    url = os.getenv('MONGODB_URL')
    db_name = os.getenv('DATABASE_NAME')
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    doc = await db.sidebar_tree.find_one({"_id": "main"})
    
    def find_intro(nodes):
        for node in nodes:
            if node.get("type") == "page" and node.get("slug") == "intro":
                print(f"Found wrong slug node: {node}")
            if node.get("children"):
                find_intro(node["children"])

    if doc:
        find_intro(doc["tree"])
    else:
        print("No sidebar tree.")
    client.close()

if __name__ == '__main__':
    asyncio.run(check())
