import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def setup_indexes():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    print("Creating indexes...")
    await db.pages.create_index("slug", unique=True)
    await db.users.create_index("email", unique=True)
    await db.doc_requests.create_index("status")
    await db.doc_requests.create_index("developerId")
    await db.doc_requests.create_index("pageSlug")
    print("Indexes created successfully.")
    client.close()

if __name__ == "__main__":
    asyncio.run(setup_indexes())
