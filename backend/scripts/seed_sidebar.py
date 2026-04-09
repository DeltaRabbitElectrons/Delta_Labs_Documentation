"""
One-time script to seed the existing Docusaurus sidebars.ts into MongoDB.
Run from backend/ directory:
  python scripts/seed_sidebar.py
"""
import asyncio
import motor.motor_asyncio
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client["delta_labs"]

# Manually define the current sidebar structure here
INITIAL_TREE = [
    {
        "id": str(uuid.uuid4()),
        "type": "category",
        "label": "Tutorial",
        "slug": None,
        "children": [
            {
                "id": str(uuid.uuid4()),
                "type": "page",
                "label": "Intro",
                "slug": "intro",
                "children": []
            },
            {
                "id": str(uuid.uuid4()),
                "type": "page",
                "label": "Hello",
                "slug": "hello",
                "children": []
            },
            {
                "id": str(uuid.uuid4()),
                "type": "category",
                "label": "Tutorial",
                "slug": None,
                "children": [
                    {
                        "id": str(uuid.uuid4()),
                        "type": "page",
                        "label": "Create a Document",
                        "slug": "tutorial-basics/create-a-document",
                        "children": []
                    }
                ]
            }
        ]
    }
]

async def seed():
    await db.sidebar_tree.update_one(
        {"_id": "main"},
        {"$setOnInsert": {
            "_id": "main",
            "tree": INITIAL_TREE,
            "updated_at": "2025-03-05T00:00:00Z",
            "updated_by": "seed"
        }},
        upsert=True
    )
    print("Sidebar seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed())
