
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

async def run():
    url = os.getenv('MONGO_URI')
    db_name = os.getenv('DATABASE_NAME')
    print(f'Connecting to {db_name} at Atlas...')
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    
    # Simple insert
    print('Inserting admin...')
    await db.users.update_one(
        {'email': 'admin@delta-labs.xyz'},
        {'$set': {
            'name': 'Delta Admin',
            'email': 'admin@delta-labs.xyz',
            'passwordHash': 'delta123',
            'role': 'admin',
            'status': 'approved',
            'createdAt': datetime.utcnow()
        }},
        upsert=True
    )
    
    count = await db.users.count_documents({})
    print(f'Done! New user count: {count}')
    client.close()

if __name__ == '__main__':
    asyncio.run(run())
