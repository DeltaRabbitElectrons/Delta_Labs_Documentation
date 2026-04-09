import os
import asyncio
import motor.motor_asyncio
from dotenv import load_dotenv

load_dotenv()

async def list_data():
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv('MONGODB_URL'))
    db = client[os.getenv('DATABASE_NAME')]
    
    pages = await db.pages.find().to_list(1000)
    print(f"--- FOUND {len(pages)} PAGES ---")
    
    # Search for 'intro' or any variants
    for p in pages:
        if 'intro' in p.get('slug', '').lower():
            print(f"Slug Match: {p.get('slug')} | ID: {p.get('_id')}")
            # print(f"Content Start: {p.get('content', '')[:100]}...")

if __name__ == '__main__':
    asyncio.run(list_data())
