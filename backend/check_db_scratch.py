import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def check():
    load_dotenv('.env')
    url = os.getenv('MONGODB_URL')
    print(f"Connecting to {url[:40]}...")
    client = AsyncIOMotorClient(url)
    db = client[os.getenv('DATABASE_NAME')]
    try:
        # Check connection is alive
        print("Pinging...")
        await client.admin.command("ping")
        print("Ping successful!")
        
        user_count = await db.users.count_documents({})
        print(f"User count: {user_count}")
        
        # Get one user
        user = await db.users.find_one()
        if user:
            print(f"Found user: {user['name']} <{user['email']}>")
        else:
            print("No users found.")
        
    except Exception as e:
        print(f"Connection failed: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check())
