import os
import asyncio
import motor.motor_asyncio
from dotenv import load_dotenv

load_dotenv()

async def list_data():
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv('MONGO_URI', 'mongodb://localhost:27017'))
    db = client['delta_labs']
    
    pages = await db.pages.find().to_list(1000)
    print(f"--- FOND {len(pages)} PAGES IN DB ---")
    for p in pages[:10]: # show first 10
        print(f"Slug: {p.get('slug')} | Category: {p.get('category')}")
    
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
