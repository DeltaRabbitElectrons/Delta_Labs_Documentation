
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
 
client = None
db = None
 
async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.DATABASE_NAME]
    print('MongoDB connected')
 
async def close_db():
    if client:
        client.close()
 
def get_db():
    return db

