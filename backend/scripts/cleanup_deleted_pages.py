"""
Removes MongoDB page records for .md files that no longer exist in GitHub.
Run from backend/ directory:
    python scripts/cleanup_deleted_pages.py
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

client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]


def get_all_slugs_from_github(repo, path="docs-site/docs") -> set:
    slugs = set()
    try:
        contents = repo.get_contents(path)
        for item in contents:
            if item.type == "dir":
                slugs.update(get_all_slugs_from_github(repo, item.path))
            elif item.name.endswith(".md") and item.name != "README.md":
                slug = item.path.replace("docs-site/docs/", "").replace(".md", "")
                slugs.add(slug)
    except GithubException as e:
        print(f"Error: {e}")
    return slugs


async def cleanup():
    repo = get_repo()
    print("Reading slugs from GitHub...")
    github_slugs = get_all_slugs_from_github(repo)
    print(f"Found {len(github_slugs)} pages in GitHub")

    print("Reading slugs from MongoDB...")
    mongo_pages = await db.pages.find({}, {"slug": 1}).to_list(10000)
    mongo_slugs = {p["slug"] for p in mongo_pages if p.get("slug")}
    print(f"Found {len(mongo_slugs)} pages in MongoDB")

    # Find pages in MongoDB but not in GitHub (deleted pages)
    orphaned = mongo_slugs - github_slugs
    print(f"\nFound {len(orphaned)} orphaned MongoDB records (deleted from GitHub):")

    if not orphaned:
        print("  Nothing to clean up — MongoDB is in sync with GitHub.")
    else:
        for slug in sorted(orphaned):
            print(f"  Removing: {slug}")
            await db.pages.delete_one({"slug": slug})

    print(f"\nCleanup complete. Removed {len(orphaned)} orphaned records.")


asyncio.run(cleanup())
