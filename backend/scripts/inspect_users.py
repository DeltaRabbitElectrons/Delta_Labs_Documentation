import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check_users():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DATABASE_NAME", "deltalabs")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    print(f"Checking users in database: {db_name}")
    async for user in db.users.find():
        print(f"--- User: {user.get('email')} ---")
        print(f"ID: {user.get('_id')}")
        print(f"Name: {user.get('name')}")
        print(f"Role: {user.get('role')}")
        print(f"Status: {user.get('status', 'MISSING (defaulting to pending)')}")
        print(f"Created: {user.get('createdAt')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_users())
