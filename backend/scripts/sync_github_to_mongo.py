"""
Syncs GitHub docs files to MongoDB.
Creates MongoDB records for any .md file that doesn't have one.
Run from backend/ directory:
    python scripts/sync_github_to_mongo.py
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import motor.motor_asyncio
from app.config import settings
from app.github_client import get_repo
from github import GithubException
from datetime import datetime

client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URI)
db = client[settings.DATABASE_NAME]

def get_all_md_files(repo, path="docs-site/docs"):
    """Recursively get all .md files from GitHub."""
    files = []
    try:
        contents = repo.get_contents(path)
        for item in contents:
            if item.type == "dir":
                files.extend(get_all_md_files(repo, item.path))
            elif item.name.endswith(".md"):
                files.append(item)
    except GithubException as e:
        print(f"Error reading {path}: {e}")
    return files

def file_path_to_slug(path: str) -> str:
    """Convert 'docs-site/docs/getting-started/intro.md' → 'getting-started/intro'"""
    slug = path.replace("docs-site/docs/", "").replace(".md", "")
    return slug

async def sync():
    repo = get_repo()
    print("Reading all .md files from GitHub...")
    all_files = get_all_md_files(repo)
    print(f"Found {len(all_files)} .md files in GitHub")

    created = 0
    skipped = 0

    for file in all_files:
        slug = file_path_to_slug(file.path)

        # Skip README files
        if slug.endswith("README"):
            skipped += 1
            continue

        # Check if MongoDB record exists
        existing = await db.pages.find_one({"slug": slug})
        if existing:
            skipped += 1
            continue

        # Create MongoDB record
        try:
            raw = file.decoded_content.decode("utf-8")
            content = raw
            if raw.startswith("---"):
                parts = raw.split("---", 2)
                if len(parts) >= 3:
                    content = parts[2].strip()

            title = slug.split("/")[-1].replace("-", " ").title()

            await db.pages.insert_one({
                "slug": slug,
                "title": title,
                "content": content,
                "category": slug.split("/")[0] if "/" in slug else "General",
                "sidebar_label": title,
                "sidebar_position": 1,
                "change_log": [],
                "updatedAt": datetime.utcnow(),
                "createdAt": datetime.utcnow()
            })
            print(f"  Created: {slug}")
            created += 1

        except Exception as e:
            print(f"  Error creating {slug}: {e}")

    print(f"\nDone. Created: {created}, Skipped: {skipped}")

if __name__ == "__main__":
    asyncio.run(sync())
