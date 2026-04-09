
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import json

load_dotenv()

async def check():
    url = os.getenv('MONGODB_URL')
    db_name = os.getenv('DATABASE_NAME')
    print(f'Connecting to {db_name}...')
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    doc = await db.sidebar_tree.find_one({"_id": "main"})
    if doc:
        print("Sidebar Tree Found:")
        print(json.dumps(doc["tree"], indent=2))
    else:
        print("No sidebar tree found in MongoDB.")
    client.close()

if __name__ == '__main__':
    asyncio.run(check())
