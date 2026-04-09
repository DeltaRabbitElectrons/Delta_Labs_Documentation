"""
Checks for any remaining prefixed slugs in MongoDB sidebar_tree.
Run from backend/ directory:
    python scripts/check_slugs.py
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import motor.motor_asyncio
from app.config import settings
import re

# Using MONGODB_URL
client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]

def find_prefixed_slugs(nodes: list, found: list = None) -> list:
    if found is None:
        found = []
    for node in nodes:
        slug = node.get("slug")
        if slug and re.match(r'^\d+-', slug.split("/")[0]):
            found.append(slug)
        find_prefixed_slugs(node.get("children", []), found)
    return found

async def check():
    doc = await db.sidebar_tree.find_one({"_id": "main"})
    if not doc:
        print("ERROR: No sidebar_tree in MongoDB")
        return

    tree = doc["tree"]
    bad_slugs = find_prefixed_slugs(tree)

    if bad_slugs:
        print(f"FOUND {len(bad_slugs)} prefixed slugs that need fixing:")
        for s in bad_slugs:
            print(f"  - {s}")
        print("\nRun: python scripts/fix_slugs_final.py")
    else:
        print("All slugs look clean — no numbered prefixes found.")
        print(f"Total root categories: {len(tree)}")

if __name__ == "__main__":
    asyncio.run(check())
