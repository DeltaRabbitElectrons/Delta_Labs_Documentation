"""
Run once to set up MongoDB indexes for the Delta Labs portal.
Usage: python setup_indexes.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "deltalabs")


async def create_indexes():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    # ── users ──────────────────────────────────────────
    await db.users.create_index("email", unique=True)
    print("✓ users.email (unique)")

    # ── pages ──────────────────────────────────────────
    await db.pages.create_index("slug", unique=True)
    print("✓ pages.slug (unique)")

    # ── password_resets ────────────────────────────────
    # TTL: auto-delete documents 1 hour after creation
    await db.password_resets.create_index("createdAt", expireAfterSeconds=3600)
    await db.password_resets.create_index("email")
    print("✓ password_resets.createdAt (TTL 1h), password_resets.email")

    # ── chat_messages ──────────────────────────────────
    await db.chat_messages.create_index("createdAt")
    print("✓ chat_messages.createdAt")

    # ── admin_notes ────────────────────────────────────
    await db.admin_notes.create_index([("adminId", 1), ("workspaceId", 1)])
    await db.admin_notes.create_index("updatedAt")
    print("✓ admin_notes.(adminId+workspaceId), admin_notes.updatedAt")

    # ── workspaces ─────────────────────────────────────
    await db.workspaces.create_index([("adminId", 1), ("createdAt", 1)])
    print("✓ workspaces.(adminId+createdAt)")

    print("\n✅ All indexes created successfully!")
    client.close()


if __name__ == "__main__":
    asyncio.run(create_indexes())
