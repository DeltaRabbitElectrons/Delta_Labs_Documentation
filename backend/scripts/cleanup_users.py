import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def cleanup_users():
    url = os.getenv('MONGO_URI')
    db_name = os.getenv('DATABASE_NAME') or 'deltalabs'
    
    if not url:
        print("ERROR: MONGO_URI not found in environment")
        return

    client = AsyncIOMotorClient(url)
    db = client[db_name]
    
    email_to_keep = "dinksiraelisa@gmail.com"
    
    # 1. Delete everyone else
    result = await db.users.delete_many({'email': {'$ne': email_to_keep}})
    
    print(f"Cleanup complete.")
    print(f"Deleted {result.deleted_count} users.")
    print(f"Kept user: {email_to_keep}")
    
    # 2. Ensure dinksira is a super_admin and approved
    await db.users.update_one(
        {'email': email_to_keep},
        {'$set': {'role': 'super_admin', 'status': 'approved'}}
    )
    print(f"Verified {email_to_keep} is super_admin and approved.")
    
    client.close()

if __name__ == '__main__':
    asyncio.run(cleanup_users())
