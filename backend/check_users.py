
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    url = os.getenv('MONGO_URI')
    db_name = os.getenv('DATABASE_NAME')
    print(f'Connecting to {db_name} at Atlas...')
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    count = await db.users.count_documents({})
    print(f'User count: {count}')
    if count > 0:
        cursor = db.users.find({}, {'passwordHash': 0})
        async for user in cursor:
            print(f"User: {user['email']} (Role: {user['role']})")
    else:
        print('No users found.')
    client.close()

if __name__ == '__main__':
    asyncio.run(check())
