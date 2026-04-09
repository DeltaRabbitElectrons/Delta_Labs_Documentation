"""
Backfills missing fields on pages collection documents.
Safe to run multiple times — only updates documents that are missing fields.
Run from backend/ directory:
    python scripts/backfill_pages.py
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import motor.motor_asyncio
from app.config import settings

# Note: Using MONGODB_URL from settings as configured in the project
client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]

def derive_title(slug: str) -> str:
    if not slug:
        return "Untitled"
    return slug.split("/")[-1].replace("-", " ").title()

async def backfill():
    pages = await db.pages.find({}).to_list(10000)
    print(f"Found {len(pages)} page documents in MongoDB")

    updated = 0
    skipped = 0

    for page in pages:
        slug = page.get("slug", "")
        updates = {}

        # Backfill missing title
        if not page.get("title"):
            updates["title"] = derive_title(slug)

        # Backfill missing sidebar_label
        if not page.get("sidebar_label"):
            updates["sidebar_label"] = page.get("title") or derive_title(slug)

        # Backfill missing content
        if "content" not in page:
            updates["content"] = ""

        # Backfill missing change_log
        if "change_log" not in page:
            updates["change_log"] = []

        # Backfill missing isDraft
        if "isDraft" not in page:
            updates["isDraft"] = False

        if updates:
            await db.pages.update_one(
                {"_id": page["_id"]},
                {"$set": updates}
            )
            print(f"  Updated '{slug}': {list(updates.keys())}")
            updated += 1
        else:
            skipped += 1

    print(f"\nDone. Updated: {updated}, Already complete: {skipped}")

if __name__ == "__main__":
    asyncio.run(backfill())
