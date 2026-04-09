import os
import asyncio
import motor.motor_asyncio
from dotenv import load_dotenv

load_dotenv()

async def trigger():
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv('MONGO_URI', 'mongodb://localhost:27017'))
    db = client['delta_labs']
    
    # 1. READ the current tree from MongoDB
    doc = await db.sidebar_tree.find_one({'_id': 'main'})
    if not doc:
        print("No sidebar tree found in MongoDB!")
        return
    
    tree = doc['tree']
    print(f"Syncing sidebar tree with {len(tree)} top-level nodes...")
    
    # 2. GENERATE AND WRITE
    import sys
    sys.path.append(os.getcwd())
    from app.routes.sidebar import generate_sidebars_ts
    from app.github_client import write_file
    
    sidebars_content = generate_sidebars_ts(tree)
    
    # Debug print the content to see what it looks like
    print("--- CONTENT PREVIEW ---")
    print("\n".join(sidebars_content.split("\n")[:20])) 
    print("--- END PREVIEW ---")
    
    success = write_file('docs-site/sidebars.ts', sidebars_content, 'fix: resync sidebars with cleaned slugs properly')
    if success:
        print('Successfully updated sidebars.ts in GitHub and triggered Vercel rebuild.')
    else:
        print('Failed to update sidebars.ts in GitHub.')

if __name__ == '__main__':
    asyncio.run(trigger())
