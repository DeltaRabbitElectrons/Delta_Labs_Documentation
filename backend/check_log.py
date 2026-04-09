import os
import asyncio
import motor.motor_asyncio
from dotenv import load_dotenv

load_dotenv()

async def check_intro():
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv('MONGODB_URL'))
    db = client[os.getenv('DATABASE_NAME')]
    
    page = await db.pages.find_one({"slug": "intro"})
    if page:
        print(f"Slug: {page.get('slug')}")
        print(f"UpdatedAt: {page.get('updatedAt')}")
        print(f"LastEditedBy: {page.get('lastEditedBy')}")
        log = page.get('change_log', [])
        print(f"Change Log Size: {len(log)}")
        if log:
            last = log[-1]
            print(f"Last Edit: {last.get('edited_at')} by {last.get('admin_name')}")
    else:
        print("Page 'intro' not found")

if __name__ == '__main__':
    asyncio.run(check_intro())
