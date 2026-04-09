import os
import asyncio
import motor.motor_asyncio
from dotenv import load_dotenv

load_dotenv()

async def trigger():
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv('MONGO_URI', 'mongodb://localhost:27017'))
    db = client['delta_labs']
    doc = await db.sidebar_tree.find_one({'_id': 'main'})
    tree = doc['tree'] if doc else []
    
    import sys
    sys.path.append(os.getcwd())
    from app.routes.sidebar import generate_sidebars_ts
    from app.github_client import write_file
    
    sidebars_content = generate_sidebars_ts(tree)
    write_file('docs-site/sidebars.ts', sidebars_content, 'fix: resync sidebars with cleaned slugs properly inside Docusaurus build module')
    print('Fixed sidebars.ts')

if __name__ == '__main__':
    asyncio.run(trigger())
