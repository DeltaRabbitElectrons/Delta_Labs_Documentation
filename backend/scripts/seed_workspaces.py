"""
Seed script: Ensure the default 'Documentation' workspace exists in portal_workspaces.

Run once:  python -m backend.scripts.seed_workspaces
Or:        cd backend && python scripts/seed_workspaces.py
"""

import asyncio
import os
import sys
from datetime import datetime

# Allow running from project root or backend/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings


async def seed():
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.DATABASE_NAME]

    existing = await db.portal_workspaces.find_one({"slug": "docs"})
    if existing:
        print(f"[✓] Documentation workspace already exists (id={existing['_id']})")
    else:
        now = datetime.utcnow()
        result = await db.portal_workspaces.insert_one({
            "name": "Documentation",
            "slug": "docs",
            "order": 0,
            "created_at": now,
            "updated_at": now,
        })
        print(f"[+] Created Documentation workspace (id={result.inserted_id})")

    # Ensure unique index on slug
    await db.portal_workspaces.create_index("slug", unique=True)
    print("[✓] Unique index on 'slug' ensured")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
