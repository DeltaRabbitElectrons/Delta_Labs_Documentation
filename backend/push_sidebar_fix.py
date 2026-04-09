
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from app.routes.sidebar import generate_sidebars_ts
from app.github_client import write_file

load_dotenv()

async def push_fix():
    url = os.getenv('MONGODB_URL')
    db_name = os.getenv('DATABASE_NAME')
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    doc = await db.sidebar_tree.find_one({"_id": "main"})
    if not doc:
        print("No sidebar tree.")
        return
    
    tree = doc["tree"]
    content = generate_sidebars_ts(tree)
    
    # Push to GitHub
    success = write_file(
        path="docs-site/sidebars.ts",
        content=content,
        message="chore: fix incorrect introduction slug in sidebar"
    )
    if success:
        print("Successfully pushed corrected sidebars.ts to GitHub.")
    else:
        print("Failed to push to GitHub.")
    client.close()

if __name__ == '__main__':
    asyncio.run(push_fix())
