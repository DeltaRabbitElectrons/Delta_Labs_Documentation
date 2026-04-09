import asyncio
import os
import json
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load .env
load_dotenv('.env')
MONGO_URI = os.getenv('MONGO_URI')

async def check():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client['deltalabs']
    doc = await db.sidebar_tree.find_one({"_id": "main"})
    if doc:
        print(json.dumps(doc, indent=2, default=str))
    else:
        print("No sidebar doc found")

if __name__ == "__main__":
    asyncio.run(check())
