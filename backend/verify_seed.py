import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def list_pages():
    mongodb_url = os.getenv("MONGODB_URL")
    database_name = os.getenv("DATABASE_NAME")
    client = AsyncIOMotorClient(mongodb_url)
    db = client[database_name]
    
    count = await db.pages.count_documents({})
    print(f"Total pages in MongoDB: {count}")
    
    pages = await db.pages.find({}, {"slug": 1}).to_list(10)
    for p in pages:
        print(f" - {p['slug']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(list_pages())
