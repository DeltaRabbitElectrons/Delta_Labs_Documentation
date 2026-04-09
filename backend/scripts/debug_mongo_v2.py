import os
import asyncio
import motor.motor_asyncio
from dotenv import load_dotenv

load_dotenv()

async def list_data():
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv('MONGODB_URL'))
    db = client[os.getenv('DATABASE_NAME')]
    
    pages = await db.pages.find().to_list(1000)
    print(f"--- FOUND {len(pages)} PAGES IN DB '{os.getenv('DATABASE_NAME')}' ---")
    for p in pages[:15]:
        print(f"Slug: {p.get('slug')} | Title: {p.get('title')}")
    
    doc = await db.sidebar_tree.find_one({'_id': 'main'})
    if doc:
        tree = doc.get('tree', [])
        print(f"\n--- SIDEBAR TREE HAS {len(tree)} ROOT NODES ---")
        for node in tree:
            print(f"Node: {node.get('label')} ({node.get('type')})")
    else:
        print("\n--- NO SIDEBAR TREE DOC FOUND ---")

if __name__ == '__main__':
    asyncio.run(list_data())
