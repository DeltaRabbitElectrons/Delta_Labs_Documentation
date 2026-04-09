import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
import os

from dotenv import load_dotenv
load_dotenv()

async def main():
    mongo_url = os.getenv("MONGODB_URL")
    db_name = os.getenv("DATABASE_NAME")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    pages = await db.pages.find({}).to_list(100)
    print("All slugs in MongoDB pages collection:")
    for p in pages:
        print(f"- {p['slug']}")

if __name__ == "__main__":
    asyncio.run(main())
