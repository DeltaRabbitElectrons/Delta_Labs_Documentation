"""
Migration script: Add avatar_initials to existing admin users that are missing it.
Run once: python backend/migrate_avatar_initials.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "delta_labs_docs")


async def migrate():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    users = await db.users.find({"avatar_initials": {"$exists": False}}).to_list(1000)
    if not users:
        print("✅ All users already have avatar_initials — nothing to migrate.")
        client.close()
        return

    updated = 0
    for user in users:
        name = user.get("name", "")
        if not name:
            continue
        parts = name.strip().split()
        initials = "".join(p[0].upper() for p in parts if p)[:2]
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"avatar_initials": initials}}
        )
        print(f"  → {name!r:30s}  avatar_initials = {initials!r}")
        updated += 1

    print(f"\n✅ Migrated {updated} user(s).")
    client.close()


if __name__ == "__main__":
    asyncio.run(migrate())
