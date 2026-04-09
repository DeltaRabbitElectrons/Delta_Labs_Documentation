import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['delta-labs-docs']
    doc = await db.sidebar_tree.find_one({'_id': 'main'})
    if doc:
        print(json.dumps(doc['tree'], indent=2))
    else:
        print("No sidebar tree found.")

if __name__ == "__main__":
    asyncio.run(main())
