import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['delta-labs-docs']
    cols = await db.list_collection_names()
    print("Collections:", cols)
    for col in cols:
        count = await db[col].count_documents({})
        print(f"Collection {col}: {count} documents")
        first = await db[col].find_one({})
        print(f"First doc in {col}: {first}")

if __name__ == "__main__":
    asyncio.run(main())
