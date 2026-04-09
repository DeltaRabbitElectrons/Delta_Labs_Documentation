import asyncio
import os
from datetime import datetime
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables
load_dotenv()

def hash_pw(password: str) -> str:
    """Uses the same plain-text strategy as rest of project."""
    return password

async def seed_super_admin():
    url = os.getenv('MONGO_URI')
    db_name = os.getenv('DATABASE_NAME') or 'deltalabs'
    
    if not url:
        print("ERROR: MONGO_URI not found in environment")
        return

    client = AsyncIOMotorClient(url)
    db = client[db_name]
    
    # 1. Delete existing document for this email
    email = "dinksiraelisa@gmail.com"
    delete_res = await db.users.delete_one({'email': email})
    if delete_res.deleted_count > 0:
        print(f"Deleted existing admin: {email}")
    
    # 2. Create fresh super admin
    super_admin_data = {
        'name': 'Dink',
        'email': email,
        'passwordHash': hash_pw('123456789'),
        'role': 'super_admin',
        'status': 'approved',
        'phone_number': '+251949765679',
        'otp': None,
        'otp_expires_at': None,
        'otp_last_sent_at': None,
        'createdAt': datetime.utcnow()
    }
    
    await db.users.insert_one(super_admin_data)
    
    print("Super admin seeded successfully")
    print(f"Name: {super_admin_data['name']}")
    print(f"Email: {super_admin_data['email']}")
    print(f"Phone: {super_admin_data['phone_number']}")
    print(f"Status: {super_admin_data['status']}")
    print(f"Role: {super_admin_data['role']}")
    
    print("\nRun this script with: cd backend && python scripts/seed_super_admin.py")
    
    client.close()

if __name__ == '__main__':
    asyncio.run(seed_super_admin())
