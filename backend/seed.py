import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

def hash_pw(password: str) -> str:
    # Per user request: no hashing
    return password

async def seed():
    url = os.getenv('MONGO_URI')
    db_name = os.getenv('DATABASE_NAME')
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    
    # Update or Create admin
    admin_data = {
        'name': 'Delta Admin',
        'email': 'admin@delta-labs.xyz',
        'passwordHash': hash_pw('delta123'),
        'role': 'admin',
        'createdAt': datetime.utcnow()
    }
    await db.users.update_one(
        {'email': admin_data['email']},
        {'$set': admin_data},
        upsert=True
    )
    print('Admin user updated/created: admin@delta-labs.xyz / delta123 (Plain Text)')
    
    # Update or Create developer
    dev_data = {
        'name': 'Delta Dev',
        'email': 'dev@delta-labs.xyz',
        'passwordHash': hash_pw('delta123'),
        'role': 'developer',
        'createdAt': datetime.utcnow()
    }
    await db.users.update_one(
        {'email': dev_data['email']},
        {'$set': dev_data},
        upsert=True
    )
    print('Developer user updated/created: dev@delta-labs.xyz / delta123 (Plain Text)')
        
    client.close()

if __name__ == '__main__':
    asyncio.run(seed())
