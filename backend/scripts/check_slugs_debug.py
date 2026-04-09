"""
Quick check — finds the exact slug for any page name in MongoDB.
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

client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]

async def check():
    pages = await db.pages.find({}, {"slug": 1, "content": 1}).to_list(10000)
    print(f"Total pages in MongoDB: {len(pages)}\n")

    # Look for anything with "introduction" or "getting-started"
    print("=== Pages matching 'getting-started' or 'introduction' ===")
    found = False
    for p in pages:
        slug = p.get("slug", "")
        content = p.get("content", "")
        if "getting-started" in slug or "introduction" in slug:
            print(f"  slug='{slug}'  content_len={len(content)}")
            found = True
    if not found:
        print("  (none found)")

    print("\n=== All slugs sorted (first 30) ===")
    for p in sorted(pages, key=lambda x: x.get("slug", ""))[:30]:
        slug = p.get("slug", "")
        content_len = len(p.get("content", ""))
        print(f"  '{slug}'  ({content_len} chars)")

asyncio.run(check())
